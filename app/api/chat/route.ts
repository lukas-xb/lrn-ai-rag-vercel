import { createOllama } from "ollama-ai-provider"
import { streamText, UIMessage } from "ai"

const ollama = createOllama();
const model = ollama("gemma3n")

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = await streamText({
        model,
        system: `You are a helpful assistant. Check your knowledge base before answering any questions. Only respond to questions using information from tool calls. if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
        messages: messages,
    })
    return result.toDataStreamResponse();
}