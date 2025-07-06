"use client";

import { useChat } from "@ai-sdk/react";


export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({})

  return <main className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
    <div className="space-y-4">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          <div>
            <div className="font-bold">{m.role}</div>
            <div>
              {m.parts.map((part, index) => {
                if (part.type === 'text') {
                  return <p key={index}>{part.text}</p>;
                } else if (part.type === 'tool-invocation') {
                  return (
                    <span key={index} className="italic font-light">
                      {'calling tool: ' + part.toolInvocation.toolName + ' with arguments: ' + JSON.stringify(part.toolInvocation.args)}
                    </span>
                  );
                }
                return null;
              })}
            </div>
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
