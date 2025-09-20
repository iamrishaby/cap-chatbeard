import React from 'react'
import { Conversation } from '../api'
import TrashIcon from './TrashIcon'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export default function ConversationList({ 
  conversations, 
  activeId, 
  onSelect, 
  onDelete 
}: ConversationListProps) {
  return (
    <div className="sidebar">
      <h2 style={{ margin: 0, fontFamily: '"Pirata One", cursive' }}>Conversations</h2>
      <div className="conversation-list">
        {conversations.map((conv) => (
          <div
            key={conv.conversationId}
            className={`conversation-item ${conv.conversationId === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv.conversationId)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="conversation-title">
                <span>Chat {conv.conversationId.slice(0, 6)}...</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(conv.conversationId)
                }}
                className="delete-btn"
                title="Delete conversation"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="timestamp">
              {new Date(conv.lastActivity).toLocaleDateString()}
            </div>
          </div>
        ))}
        {conversations.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.7 }}>
            No previous conversations
          </div>
        )}
      </div>
    </div>
  )
}