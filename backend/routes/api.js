const express = require('express');
const router = express.Router();
const {
  handleChatMessage,
  getConversationHistory,
  listConversations
} = require('../controllers/chatController');

// Chat endpoints
router.post('/chat', handleChatMessage);
router.get('/conversations/:conversationId', getConversationHistory);
router.get('/conversations', listConversations);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;