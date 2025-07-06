import { createOllama } from "ollama-ai-provider"
import { streamText, UIMessage, tool } from "ai"
import { z } from "zod"
import { createResource, debugKnowledgeBase, findRelevantContent } from "@/lib/actions/resources";

const ollama = createOllama();
const model = ollama("llama3.2")

export async function POST(req: Request) {
    try {
        console.log('=== Chat API called ===');
        const { messages }: { messages: UIMessage[] } = await req.json()
        console.log('Messages received:', messages.length);
        console.log('Last message:', messages[messages.length - 1]);

        // Check if the last message contains specific keywords
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
        console.log('Last user message content:', lastUserMessage);

        // Manual tool dispatch - intercept and handle tool calls directly
        if (lastUserMessage.toLowerCase().includes('check') && lastUserMessage.toLowerCase().includes('database')) {
            console.log('*** Detected database check request - calling tool directly ***');
            try {
                const debug = await debugKnowledgeBase();
                console.log('Debug result:', debug);

                // Return a simple response with the debug info
                return new Response(JSON.stringify({
                    choices: [{
                        delta: {
                            content: `Database check complete:\n- Resources: ${debug.resourceCount}\n- Embeddings: ${debug.embeddingCount}\n\n${debug.message}`
                        }
                    }],
                    done: true
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('Error checking database:', error);
                return new Response(JSON.stringify({
                    choices: [{
                        delta: {
                            content: 'Error checking database: ' + (error instanceof Error ? error.message : 'Unknown error')
                        }
                    }],
                    done: true
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (lastUserMessage.toLowerCase().includes('add') && lastUserMessage.toLowerCase().includes('knowledge')) {
            console.log('*** Detected add to knowledge base request - calling tool directly ***');
            // Extract content after "knowledge base:"
            const match = lastUserMessage.match(/knowledge base:\s*(.+)/i);
            if (match) {
                const content = match[1].trim();
                console.log('Extracted content:', content);

                try {
                    const result = await createResource({ content });
                    console.log('Resource creation result:', result);

                    return new Response(JSON.stringify({
                        choices: [{
                            delta: {
                                content: `Successfully added to knowledge base: "${content}"\n\nResult: ${result}`
                            }
                        }],
                        done: true
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error adding to knowledge base:', error);
                    return new Response(JSON.stringify({
                        choices: [{
                            delta: {
                                content: 'Error adding to knowledge base: ' + (error instanceof Error ? error.message : 'Unknown error')
                            }
                        }],
                        done: true
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        // For all other messages, search the knowledge base first
        console.log('*** Searching knowledge base for relevant content ***');
        try {
            const searchResults = await findRelevantContent(lastUserMessage);
            console.log('Search results:', searchResults);

            let systemContext = '';
            if (Array.isArray(searchResults) && searchResults.length > 0) {
                console.log('Found relevant content, adding to context');
                systemContext = `\n\nUse this information from the knowledge base to help answer the user's question:\n${searchResults.map((r: any) => r.content).join('. ')}`;
            } else {
                console.log('No relevant content found in knowledge base');
            }

            const result = await streamText({
                model,
                system: `You are a helpful assistant. ${systemContext}

To add information to the knowledge base, users should say "Add this to knowledge base: [content]".
To check the database, users should say "Check the database".`,
                messages: messages,
            });

            console.log('StreamText completed');
            return result.toDataStreamResponse();
        } catch (searchError) {
            console.error('Error during search:', searchError);
            // Fallback to normal response if search fails
        }
    } catch (error) {
        console.error('=== Chat API error ===', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}