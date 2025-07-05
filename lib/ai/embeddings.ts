import { embedMany } from 'ai';
import { ollama } from 'ollama-ai-provider';

// define the model to use for embeddings
const ollamaEmbeddings = ollama.embedding('mxbai-embed-large');

// split input by periods
const generateChunk = (input: string): string[] => {
    return input.trim().split('.').filter(i => i !== ''
    )
}

// generate embeddings for the input string
// returns an array of objects with the content and its corresponding embedding
export const generateEmbeddings = async (value: string): Promise<Array<{ embedding: number[], content: string }>> => {
    const chunks = generateChunk(value);
    const { embeddings } = await embedMany({
        model: ollamaEmbeddings,
        values: chunks
    });

    return embeddings.map((embedding, index) => ({
        content: chunks[index],
        embedding: embedding,
    }));
}