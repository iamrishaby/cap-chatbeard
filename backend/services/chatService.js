const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { v4: uuidv4 } = require('uuid');

class ChatService {
    async createConversation() {
        try {
            const conversationId = uuidv4();
            console.log('Creating new conversation with ID:', conversationId);
            
            const conversation = new Conversation({
                conversationId: conversationId,
                messages: []
            });
            
            const savedConversation = await conversation.save();
            console.log('Created conversation:', savedConversation);
            return savedConversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw new Error(`Failed to create conversation: ${error.message}`);
        }
    }

    async addMessageToConversation(conversationId, messageData) {
        try {
            console.log('Adding message to conversation:', conversationId, messageData);
            
            // Create and save the message
            const message = new Message(messageData);
            const savedMessage = await message.save();
            console.log('Saved message:', savedMessage);

            // Add message to conversation
            const conversation = await Conversation.findOne({ conversationId });
            if (!conversation) {
                throw new Error(`Conversation not found: ${conversationId}`);
            }

            conversation.messages.push(savedMessage._id);
            await conversation.save();
            console.log('Updated conversation with new message');

            return savedMessage;
        } catch (error) {
            console.error('Error adding message to conversation:', error);
            throw new Error(`Failed to add message: ${error.message}`);
        }
    }

    async getConversationHistory(conversationId) {
        try {
            console.log('Getting conversation history for:', conversationId);
            
            const conversation = await Conversation.findOne({ conversationId })
                .populate({
                    path: 'messages',
                    options: { sort: { 'createdAt': 1 } }
                })
                .exec();

            if (!conversation) {
                throw new Error(`Conversation not found: ${conversationId}`);
            }

            // Format the response to match the expected structure
            return {
                conversationId: conversation.conversationId,
                messages: conversation.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    image: msg.image
                })),
                lastActivity: conversation.lastActivity
            };
        } catch (error) {
            console.error('Error getting conversation history:', error);
            throw new Error(`Failed to get conversation history: ${error.message}`);
        }
    }

    async listConversations(limit = 10, skip = 0) {
        try {
            console.log('Listing conversations with limit:', limit, 'skip:', skip);
            
            const conversations = await Conversation.find({})
                .sort({ lastActivity: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            return conversations;
        } catch (error) {
            console.error('Error listing conversations:', error);
            throw new Error(`Failed to list conversations: ${error.message}`);
        }
    }
}

module.exports = new ChatService();