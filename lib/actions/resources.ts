'use server';

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from '@/lib/db/schema/resources';
import { db } from '../db';
import { generateEmbeddings } from '../ai/embeddings';
import { embeddings as embeddingsTable } from '@/lib/db/schema/embeddings';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { embed } from 'ai';
import { ollama } from 'ollama-ai-provider';

const ollamaEmbeddings = ollama.embedding('mxbai-embed-large');

export const createResource = async (input: NewResourceParams) => {
  try {
    console.log('Creating resource with content:', input.content);
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();

    console.log('Resource created:', resource);

    const embeddings = await generateEmbeddings(content);
    console.log('Generated embeddings:', embeddings.length);

    await db.insert(embeddingsTable).values(embeddings.map(embedding => ({
      resourceId: resource.id, ...embedding
    })))

    console.log('Embeddings inserted successfully');
    return 'Resource successfully created and embedded.';
  } catch (e) {
    console.error('Error creating resource:', e);
    if (e instanceof Error)
      return e.message.length > 0 ? e.message : 'Error, please try again.';
    return 'Error, please try again.';
  }
};

export const findRelevantContent = async (userQuery: string) => {
  try {
    console.log('Searching for:', userQuery);

    const { embedding } = await embed({
      model: ollamaEmbeddings,
      value: userQuery,
    });

    console.log('Generated search embedding, length:', embedding.length);

    const similarity = sql<number>`1 - (${cosineDistance(embeddingsTable.embedding, embedding)})`;

    const similarGuides = await db
      .select({
        content: embeddingsTable.content,
        similarity,
      })
      .from(embeddingsTable)
      .where(gt(similarity, 0.3))
      .orderBy(desc(similarity))
      .limit(5);

    console.log('Search results:', similarGuides.length, 'items found');
    if (similarGuides.length > 0) {
      console.log('Top result similarity:', similarGuides[0].similarity);
    }

    return similarGuides;
  } catch (e) {
    console.error('Error searching knowledge base:', e);
    return { error: 'Error searching knowledge base: ' + (e instanceof Error ? e.message : 'Unknown error') };
  }
};

// Debug function to check database contents and test search
export const debugKnowledgeBase = async () => {
  try {
    console.log('=== Starting database debug ===');

    // Check total number of resources
    const resourceCount = await db.select().from(resources);

    // Check total number of embeddings
    const embeddingCount = await db.select().from(embeddingsTable);

    console.log(`Resources in database: ${resourceCount.length}`);
    console.log(`Embeddings in database: ${embeddingCount.length}`);

    if (resourceCount.length > 0) {
      console.log('Sample resources:', resourceCount.slice(0, 3));
    }

    if (embeddingCount.length > 0) {
      console.log('Sample embeddings:', embeddingCount.slice(0, 2).map(e => ({
        content: e.content,
        embeddingLength: e.embedding?.length || 0
      })));
    }

    return {
      resourceCount: resourceCount.length,
      embeddingCount: embeddingCount.length,
      resources: resourceCount.slice(0, 3),
      embeddings: embeddingCount.slice(0, 2).map(e => ({
        id: e.id,
        content: e.content,
        embeddingLength: e.embedding?.length || 0
      })),
      message: `Found ${resourceCount.length} resources and ${embeddingCount.length} embeddings`
    };
  } catch (e) {
    console.error('Debug error:', e);
    return { error: 'Debug failed: ' + (e instanceof Error ? e.message : 'Unknown error') };
  }
};