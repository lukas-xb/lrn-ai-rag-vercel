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
import fs from 'fs';
import path from 'path';

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

// Parse markdown and split into sections
const parseMarkdown = (content: string, filename: string): Array<{ title: string; content: string; source: string }> => {
  const sections: Array<{ title: string; content: string; source: string }> = [];
  
  // Split by headers (# ## ###)
  const lines = content.split('\n');
  let currentSection = { title: '', content: '', source: filename };
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      // Save previous section if it has content
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }
      
      // Start new section
      currentSection = {
        title: line.replace(/^#+\s*/, ''),
        content: line + '\n',
        source: filename
      };
    } else {
      currentSection.content += line + '\n';
    }
  }
  
  // Add the last section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
};

// Load and process all markdown files from the data folder
export const loadDataFiles = async () => {
  try {
    console.log('=== Loading data files ===');
    
    const dataDir = path.join(process.cwd(), 'data');
    console.log('Data directory:', dataDir);
    
    if (!fs.existsSync(dataDir)) {
      return { error: 'Data directory does not exist' };
    }
    
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.md'));
    console.log('Found markdown files:', files);
    
    if (files.length === 0) {
      return { message: 'No markdown files found in data directory' };
    }
    
    let totalSections = 0;
    const processedFiles: string[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log(`Processing file: ${file}`);
        
        // Parse markdown into sections
        const sections = parseMarkdown(content, file);
        console.log(`Found ${sections.length} sections in ${file}`);
        
        // Process each section
        for (const section of sections) {
          const sectionContent = `File: ${section.source}\nSection: ${section.title}\n\n${section.content}`;
          
          // Create resource entry
          const [resource] = await db
            .insert(resources)
            .values({ content: sectionContent })
            .returning();
          
          // Generate and store embeddings
          const embeddings = await generateEmbeddings(sectionContent);
          await db.insert(embeddingsTable).values(embeddings.map(embedding => ({
            resourceId: resource.id, ...embedding
          })));
          
          totalSections++;
        }
        
        processedFiles.push(file);
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
      }
    }
    
    return {
      message: `Successfully processed ${processedFiles.length} files with ${totalSections} sections`,
      processedFiles,
      totalSections
    };
    
  } catch (e) {
    console.error('Error loading data files:', e);
    return { error: 'Error loading data files: ' + (e instanceof Error ? e.message : 'Unknown error') };
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