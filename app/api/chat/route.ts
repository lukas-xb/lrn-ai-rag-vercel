import { createOllama } from "ollama-ai-provider"
import { streamText, UIMessage, tool } from "ai"
import { z } from "zod"
import { createResource } from "@/lib/actions/resources";

const ollama = createOllama();
const model = ollama("gemma3n")

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = await streamText({
        model,
        system: `You are a helpful assistant. Check your knowledge base before answering any questions. Only respond to questions using information from tool calls. if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
        messages: messages,
        tools: {
            addResource: tool({
                description: "add a resource to your knowledge base. If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation",
                parameters: z.object({
                    content: z.string().describe("the content or resource to add to the knowledge base")
                }),
                execute: async ({ content }) => createResource({ content }),
            }),
        }
    })
    return result.toDataStreamResponse();
}