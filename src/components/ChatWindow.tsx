import React, { useState, useRef, useEffect } from "react"
import { Message, sendToServer, getConversationHistory, listConversations, Conversation } from "../api"
import ConversationList from "./ConversationList"

const STORAGE_KEY = 'chatbeard_conversation'

export default function ChatWindow() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<string | null>(() => 
    localStorage.getItem(STORAGE_KEY)
  )
  
  const endRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize state based on stored conversation
  useEffect(() => {
    const storedConversationId = localStorage.getItem(STORAGE_KEY)
    
    if (storedConversationId) {
      // If we have a stored conversation, load it
      setConversationId(storedConversationId)
    } else {
      // If no stored conversation, show welcome message
      setMessages([
        { role: "assistant", content: "Ahoy! I'm Cap'n Chatbeard — how may I help ye!" }
      ])
    }
  }, [])

  // Load conversation list
  const refreshConversations = async () => {
    try {
      const response = await listConversations(20, 0)
      if (response.conversations) {
        setConversations(response.conversations)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  // Initial load and periodic refresh of conversations
  useEffect(() => {
    refreshConversations()
    // Refresh conversations every 30 seconds
    const interval = setInterval(refreshConversations, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load conversation history if we have a conversationId
  useEffect(() => {
    async function loadHistory() {
      if (!conversationId) {
        // If no conversation ID, show welcome message
        setMessages([
          { role: "assistant", content: "Ahoy! I'm Cap'n Chatbeard — how may I help ye!" }
        ]);
        return;
      }
      
      setLoadingHistory(true);
      try {
        console.log('Loading conversation:', conversationId);
        const data = await getConversationHistory(conversationId);
        console.log('Loaded conversation data:', data);
        
        if (data && data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
          // Also update conversations list to ensure it's fresh
          await refreshConversations();
        } else {
          console.error("Invalid conversation history format:", data);
          throw new Error('Invalid conversation data received');
        }
      } catch (error) {
        console.error("Failed to load conversation history:", error);
        localStorage.removeItem(STORAGE_KEY);
        setConversationId(null);
        setMessages([{ 
          role: "assistant", 
          content: "Failed to load conversation history. Starting a new chat."
        }]);
        // Also refresh conversations list in case the conversation was deleted
        await refreshConversations();
      } finally {
        setLoadingHistory(false);
      }
    }
    
    loadHistory();
  }, [conversationId])

  // Save conversationId to localStorage whenever it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(STORAGE_KEY, conversationId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [conversationId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endRef.current) {
      const scrollOptions = {
        behavior: "smooth" as ScrollBehavior,
        block: "end" as ScrollLogicalPosition
      }
      setTimeout(() => {
        endRef.current?.scrollIntoView(scrollOptions)
      }, 100) // Small delay to ensure content is rendered
    }
  }, [messages, loading])

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
    
    setInput("") // Clear input first
    
    // Use functional update to ensure we have the latest state
    setMessages(prevMessages => [...prevMessages, userMsg])
    
    setLoading(true)
    try {
      // Send all messages in current conversation to maintain context
      const currentMessages = [...messages, userMsg]
      console.log('Sending message with conversation ID:', conversationId)
      const response = await sendToServer(currentMessages, conversationId || undefined)
      
      if (!response || !response.reply) {
        throw new Error('Invalid response from server')
      }
      
      // Update conversation ID first if this is a new conversation
      if (response.conversationId && (!conversationId || conversationId !== response.conversationId)) {
        console.log('Setting new conversation ID:', response.conversationId)
        setConversationId(response.conversationId)
        localStorage.setItem(STORAGE_KEY, response.conversationId)
      }
      
      // Then update messages
      const assistantMsg: Message = {
        role: "assistant",
        content: response.reply
      }
      setMessages(prevMessages => [...prevMessages, assistantMsg])
      
      // Finally refresh conversations list
      await refreshConversations()
      
    } catch (err) {
      console.error('Error sending message:', err)
      // Revert the user message on error
      setMessages(prevMessages => 
        prevMessages.slice(0, -1).concat({
          role: "assistant",
          content: "Sorry, there was an error sending your message. Please try again."
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const startNewChat = async () => {
    try {
      setLoading(true)
      // Clear the existing conversation state
      setConversationId(null)
      localStorage.removeItem(STORAGE_KEY)
      
      // Reset messages with welcome message
      setMessages([
        { role: "assistant", content: "Ahoy! I'm Cap'n Chatbeard — how may I help ye!" }
      ])
      
      // Clear input if any
      setInput("")
    } catch (error) {
      console.error("Error starting new chat:", error)
      window.alert("Failed to start new chat. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    try {
      // If deleting current conversation, switch to a new chat
      if (id === conversationId) {
        await startNewChat()
      }
      
      // Remove from conversations list
      setConversations(prev => prev.filter(c => c.conversationId !== id))
      
      // TODO: Add API call to delete conversation from server when endpoint is available
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      window.alert('Failed to delete conversation')
    }
  }

  const handleSelectConversation = async (id: string) => {
    try {
      setLoadingHistory(true)
      setConversationId(id)
      localStorage.setItem(STORAGE_KEY, id)
      
      const data = await getConversationHistory(id)
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages)
      } else {
        throw new Error('Invalid conversation data received')
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
      window.alert('Failed to load conversation')
      // Reset state on error
      localStorage.removeItem(STORAGE_KEY)
      setConversationId(null)
      setMessages([{ 
        role: "assistant", 
        content: "Failed to load conversation. Starting a new chat."
      }])
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <main className="chat-layout">
      <ConversationList 
        conversations={conversations}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
      />
      
      <div className="chat-main">
        <div className="conversation-controls">
          <span>{conversationId ? 'Current Chat' : 'New Chat'}</span>
          <button 
            onClick={startNewChat} 
            className="new-chat-btn"
            disabled={loading || loadingHistory}
          >
            Start New Chat
          </button>
        </div>
        
        {loadingHistory ? (
          <div className="loading-overlay">
            <div className="loading-message">Loading conversation history...</div>
          </div>
        ) : (
          <>
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
                disabled={loading || loadingHistory}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
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
                disabled={loading || loadingHistory}
              >
                📷
              </button>
              <button 
                onClick={send} 
                disabled={loading || loadingHistory || !input.trim()}
                className={loading ? 'loading' : ''}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}