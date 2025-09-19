import React, { useState } from 'react'

interface ChatInputProps {
  onSend: (input: string) => void
  loading: boolean
}

export default function ChatInput({ onSend, loading }: ChatInputProps) {
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  return (
    <div className="input-row">
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Say something..."
        minLength={2}
        required
        onKeyDown={e => {
          if (e.key === 'Enter') handleSend()
        }}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? '...' : 'Send'}
      </button>
    </div>
  )
}
