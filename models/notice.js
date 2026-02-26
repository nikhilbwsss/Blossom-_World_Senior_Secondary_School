const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, default: "General" },
    description: String,
    pdfUrl: String,
    isPinned: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', noticeSchema);