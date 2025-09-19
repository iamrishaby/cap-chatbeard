import React from 'react'

type Message = { role: 'user' | 'assistant' | 'system'; content: string }

interface ChatProps {
  messages: Message[]
  endRef: React.RefObject<HTMLDivElement>
}

export default function Chat({ messages, endRef }: ChatProps) {
  return (
    <div className="messages" role="log" aria-live="polite">
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>
          {m.content}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
