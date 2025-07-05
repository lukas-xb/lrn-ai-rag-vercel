"use client";

import { useChat } from "@ai-sdk/react";


export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({})

  return <main className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
    <div className="space-y-4">
      {messages.map(message => (
        <div key={message.id}>
          <div className="border p-4 rounded-md">
            <div className="font-bold">{message.role}</div>
            <p>{message.content}</p>
          </div>
        </div>
      ))}
    </div>
    <form onSubmit={handleSubmit}>
      <input className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl bg-white"
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Type your message here..."
      />
    </form>
  </main>;
}
