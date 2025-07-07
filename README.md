# Vercel AI SDK RAG with Ollama and Next.js

This is a learning project built on top of Starter project for the Vercel AI SDK [Retrieval-Augmented Generation (RAG) guide](https://sdk.vercel.ai/docs/guides/rag-chatbot).

The chatbot only responds with information that it has within its knowledge base. It can store and retrieve information.

Instead of calling `tools` which fails sometimes even in supported Ollama models, it parses user request and triggers dedicated tool-like functions. It's a learning project for another app -- it contains logs of actions left for further reference.

Uses the following stack:

- [Next.js](https://nextjs.org) 14 (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- Replaces [OpenAI](https://openai.com) with locally running [Ollama](https://ollama.com) as LLM and [embedding generator](https://ollama.com/blog/embedding-models).
- [Drizzle ORM](https://orm.drizzle.team) and [Zod](https://zod.dev/) for validation.
- [Postgres](https://www.postgresql.org/) with [ pgvector ](https://github.com/pgvector/pgvector) - runs Postgres in Docker
- [shadcn-ui](https://ui.shadcn.com) and [TailwindCSS](https://tailwindcss.com) for styling
