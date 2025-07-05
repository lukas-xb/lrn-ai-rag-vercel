# Vercel AI SDK RAG Guide Starter Project

This is project is built on top of Starter project for the Vercel AI SDK [Retrieval-Augmented Generation (RAG) guide](https://sdk.vercel.ai/docs/guides/rag-chatbot).

//TODO - update readme
In this project, you will build a chatbot that will only respond with information that it has within its knowledge base. The chatbot will be able to both store and retrieve information. This project has many interesting use cases from customer support through to building your own second brain!

This project will use the following stack:

- [Next.js](https://nextjs.org) 14 (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- Replaces [OpenAI](https://openai.com) with locally running [Ollama](https://ollama.com) as LLM and [embedding generator](https://ollama.com/blog/embedding-models).
- [Drizzle ORM](https://orm.drizzle.team)
- [Postgres](https://www.postgresql.org/) with [ pgvector ](https://github.com/pgvector/pgvector) - runs Postgres in Docker using `akane/pgvector`
  ```sh
    docker run -e POSTGRES_USER=your_postgres_user -e POSTGRES_PASSWORD=your_password --name postgres -p 5432:5432 -d ankane/pgvector
  ```
- [shadcn-ui](https://ui.shadcn.com) and [TailwindCSS](https://tailwindcss.com) for styling
