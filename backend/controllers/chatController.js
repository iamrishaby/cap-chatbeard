const chatService = require('../services/chatService');

const validateMessage = (message) => {
  if (!message.role || !message.content) {
    throw new Error('Invalid message format: role and content are required');
  }
  if (!['user', 'assistant', 'system'].includes(message.role)) {
    throw new Error('Invalid role: must be user, assistant, or system');
  }
};

const formatResponse = (content, messageId) => {
  return {
    reply: content,
    messageId,
    timestamp: new Date().toISOString()
  };
};

const handleChatMessage = async (req, res) => {
  try {
    console.log('Received chat request:', req.body);
    const { messages, conversationId } = req.body;

    // Validate request
    if (!Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Messages must be an array' 
      });
    }

    // Validate each message
    messages.forEach(validateMessage);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      try {
        console.log('Looking for existing conversation:', conversationId);
        conversation = await chatService.getConversationHistory(conversationId);
      } catch (error) {
        console.log('Creating new conversation as conversation not found:', error.message);
        conversation = await chatService.createConversation();
      }
    } else {
      console.log('Creating new conversation');
      conversation = await chatService.createConversation();
    }

    if (!conversation) {
      throw new Error('Failed to create or retrieve conversation');
    }

    console.log('Using conversation:', conversation.conversationId);

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    
    // Save user message to database
    console.log('Saving user message to conversation:', lastMessage);
    const savedUserMessage = await chatService.addMessageToConversation(
      conversation.conversationId,
      lastMessage
    );

    if (!savedUserMessage) {
      throw new Error('Failed to save user message');
    }

    // For now, create a pirate-themed response
    const responses = [
      "Yarr! That be a fine message ye sent!",
      "Shiver me timbers, what an interesting thought!",
      "Aye, ye speak true, matey!",
      "Blimey! Ye got me thinking with that one!",
      "Arr, now that's what I call a proper message!"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Save assistant's response to database
    console.log('Saving assistant response to conversation');
    const savedAssistantMessage = await chatService.addMessageToConversation(
      conversation.conversationId,
      {
        role: 'assistant',
        content: randomResponse
      }
    );

    if (!savedAssistantMessage) {
      throw new Error('Failed to save assistant message');
    }

    const response = {
      ...formatResponse(randomResponse, savedAssistantMessage._id),
      conversationId: conversation.conversationId
    };

    console.log('Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('Error in chat controller:', error);
    res.status(error.status || 500).json({ 
      error: error.status ? 'Bad Request' : 'Internal Server Error',
      message: error.message 
    });
  }
};

const getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await chatService.getConversationHistory(conversationId);
    res.json({ messages });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }
};

const listConversations = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const conversations = await chatService.listConversations(
      parseInt(limit),
      parseInt(skip)
    );
    res.json({ conversations });
  } catch (error) {
    console.error('Error listing conversations:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

module.exports = {
  handleChatMessage,
  getConversationHistory,
  listConversations
};