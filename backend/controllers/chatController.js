const pdf = require('pdf-parse');
const axios = require('axios');
const Chat = require('../models/Chat');


exports.uploadPdf = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    pdf(req.file.buffer).then(function(data) {
        res.status(200).json({
            message: "PDF processed successfully.",
            textContent: data.text
        });
    }).catch(error => {
        console.error("PDF Parsing Error:", error);
        res.status(500).json({ message: "Error processing PDF file.", error: error.message });
    });
};

exports.chat = async (req, res) => {
    const { question, context, chatId } = req.body;
    const userId = req.user.id; 

    if (!question) return res.status(400).json({ message: "Question is required." });

    try {
        const geminiResponseText = await callGeminiAPI(question, context);
        let chat;

        if (chatId) {
            chat = await Chat.findById(chatId);
            if (!chat || chat.userId.toString() !== userId) {
                return res.status(403).json({ message: "Chat not found or user not authorized." });
            }
        } else {
            const title = question.length > 40 ? question.substring(0, 40) + '...' : question;
            chat = new Chat({ userId, title, messages: [] });
        }

        chat.messages.push({ role: 'user', content: question });
        chat.messages.push({ role: 'assistant', content: geminiResponseText });
        await chat.save();
        res.status(200).json(chat);
    } catch (error) {
        console.error("Chat processing error:", error);
        res.status(500).json({ message: "Server error during chat processing." });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const history = await Chat.find({ userId: req.user.id })
            .select('title _id createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching history." });
    }
};

exports.getChatMessages = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
        if (!chat) {
            return res.status(404).json({ message: "Chat not found or user not authorized." });
        }
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching messages." });
    }
};

exports.deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
        if (!chat) {
            return res.status(404).json({ message: "Chat not found or user not authorized." });
        }
        await chat.deleteOne();
        res.status(200).json({ message: "Chat deleted successfully." });
    } catch (error) {
        console.error("Delete chat error:", error);
        res.status(500).json({ message: "Server error while deleting chat." });
    }
};

async function callGeminiAPI(question, context) {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const requestBody = {
        "contents": [{ "parts": [
            { "text": `System instruction: You are a helpful assistant. Based on the document text, answer the question. Use Markdown for formatting. Document: ${context}` },
            { "text": `Question: ${question}` }
        ]}],
        "generationConfig": { "temperature": 0.4, "maxOutputTokens": 2048 }
    };

    try {
        const response = await axios.post(GEMINI_API_URL, requestBody, { headers: { 'Content-Type': 'application/json' }});
        if (!response.data.candidates || response.data.candidates.length === 0) {
            throw new Error("AI service returned an empty response.");
        }
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from AI service.");
    }
}