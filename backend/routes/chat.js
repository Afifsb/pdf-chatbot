const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../controllers/chatController');


const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('pdf'), chatController.uploadPdf);

router.post('/chat', chatController.chat);

router.get('/history', chatController.getChatHistory);

router.get('/history/:id', chatController.getChatMessages);

router.delete('/history/:id', chatController.deleteChat);


module.exports = router;