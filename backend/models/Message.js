const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'assistant', 'system']
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);