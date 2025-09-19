import React from "react"
import ChatWindow from "./components/ChatWindow"
import "./styles.css"

export default function App() {
  return (
    <div className="app-bg">
      <div className="app-card">
        <header className="header">
          ☠️ Cap’n Chatbeard 
        </header>
        <ChatWindow />
      </div>
    </div>
  )
}
