"use-client";

import { useChat } from "@ai-sdk/react";


export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({})

  return <main>
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>
            <div>{message.role}</div>
            <p>{message.content}</p>
          </div>
        </div>
      ))}
    </div>
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Type your message here..."
      />
      <button type="submit">Send</button>
    </form>
  </main>;
}
