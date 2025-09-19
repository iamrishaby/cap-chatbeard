import React, { useState, useRef, useEffect } from "react"
import { sendToServer } from "../api"

type Message = { role: "user" | "assistant" | "system"; content: string }

export default function ChatWindow() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ahoy! I’m Cap’n Chatbeard — how may I help ye?" }
  ])
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text) return
    if (text.length < 2) {
      window.alert("Type at least 2 characters")
      return
    }

    const userMsg: Message = { role: "user", content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")

    const system: Message = {
      role: "system",
      content:
        "You are Cap’n Chatbeard, a playful pirate persona. Keep replies short, use pirate words, and be friendly."
    }
    const payload = [system, ...newMessages]

    setLoading(true)
    try {
      const data = await sendToServer(payload)
      const assistant: Message = {
        role: "assistant",
        content: data.reply ?? "Arrr, I have no reply."
      }
      setMessages((m) => [...m, assistant])
    } catch (err) {
      console.error(err)
      window.alert("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="chat">
      <div className="messages" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak yer mind..."
          minLength={2}
          required
          onKeyDown={(e) => {
            if (e.key === "Enter") send()
          }}
        />
        <button onClick={send} disabled={loading}>
          {loading ? "…" : "Send"}
        </button>
      </div>
    </main>
  )
}
