export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  image?: string;
}

export type Conversation = {
  conversationId: string;
  messages: Message[];
  lastActivity: string;
}

const API_URL = 'http://localhost:3001/api';

export async function sendToServer(messages: Message[], conversationId?: string) {
  // First make API call
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, conversationId }),
  });
  
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Generate conversation ID if none exists
  const chatId = conversationId || crypto.randomUUID();
  
  // Update local storage with latest messages
  if (data.reply) {
    const conversation = {
      messages: [...messages, { role: "assistant", content: data.reply }],
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem(`conversation_${chatId}`, JSON.stringify(conversation));
  }

  // Return response with conversationId
  return {
    ...data,
    conversationId: chatId
  };
}

export async function getConversationHistory(conversationId: string): Promise<{messages: Message[]}> {
  // First try to get from localStorage
  const storedData = localStorage.getItem(`conversation_${conversationId}`);
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      if (parsed && Array.isArray(parsed.messages)) {
        return { messages: parsed.messages };
      }
    } catch (e) {
      console.error('Failed to parse stored conversation:', e);
    }
  }

  // Fallback to server (or throw if server request fails)
  const response = await fetch(`${API_URL}/conversations/${conversationId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch conversation history: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Store the conversation data
  if (data && Array.isArray(data.messages)) {
    localStorage.setItem(`conversation_${conversationId}`, JSON.stringify(data));
  }

  return data;
}

export async function listConversations(limit = 10, skip = 0): Promise<{conversations: Conversation[]}> {
  // First try to fetch from server
  try {
    const response = await fetch(
      `${API_URL}/conversations?limit=${limit}&skip=${skip}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.conversations)) {
        return data;
      }
    }
  } catch (e) {
    console.error('Failed to fetch conversations from server:', e);
  }
  
  // Fall back to local storage if server fails
  const conversations: Conversation[] = [];
  
  // Iterate through localStorage to find conversations
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('conversation_')) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const conversationId = key.replace('conversation_', '');
          conversations.push({
            conversationId,
            messages: parsed.messages || [],
            lastActivity: parsed.lastActivity || new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Failed to parse conversation from storage:', e);
      }
    }
  }
  
  // Sort by last activity
  conversations.sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
  
  // Apply pagination
  return {
    conversations: conversations.slice(skip, skip + limit)
  };
}

export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
