const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    }
}, { timestamps: true });

// Update lastActivity whenever the conversation is modified
conversationSchema.pre('save', function(next) {
    this.lastActivity = new Date();
    next();
});

module.exports = mongoose.model('Conversation', conversationSchema);