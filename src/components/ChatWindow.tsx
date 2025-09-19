import React, { useState, useRef, useEffect } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
  image?: string
}

export default function ChatWindow() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ahoy! I'm Cap'n Chatbeard — how may I help ye!" }
  ])
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      window.alert("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Image = event.target?.result as string
      const userMsg: Message = { 
        role: "user", 
        content: "Sent an image",
        image: base64Image
      }
      setMessages(prev => [...prev, userMsg])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  async function send() {
    const text = input.trim()
    if (text.length < 2) {
      window.alert("Type at least 2 characters")
      return
    }

    const userMsg: Message = { 
      role: "user", 
      content: text
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")

    setLoading(true)
    try {
      // Simulate a delay for the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistant: Message = {
        role: "assistant",
        content: "Yarr! That's a fine message ye sent. I be processing it with me pirate brain! 🏴‍☠️"
      }
      setMessages(prev => [...prev, assistant])
    } catch (err) {
      console.error(err)
      if (err instanceof Error) {
        window.alert(`Error: ${err.message}`)
      } else {
        window.alert("Network error")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="chat">
      <div className="messages" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content !== "Sent an image" && <div>{m.content}</div>}
            {m.image && (
              <div className="image-container">
                <img src={m.image} alt="User uploaded" className="chat-image" />
              </div>
            )}
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
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="upload-btn"
          title="Upload image"
        >
          📷
        </button>
        <button onClick={send} disabled={loading}>
          {loading ? "…" : "Send"}
        </button>
      </div>
    </main>
  )
}