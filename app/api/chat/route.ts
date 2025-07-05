import { createOllama } from "ollama-ai-provider"
import { streamText, UIMessage } from "ai"

const ollama = createOllama();
const model = ollama("gemma3n")

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = await streamText({
        model,
        messages: messages,
    })
    return result.toDataStreamResponse();
}