require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();

app.use(cors());


app.use(express.json({ limit: '50mb' }));


app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.use('/api/auth', authRoutes);


app.use('/api/chat', authMiddleware, chatRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error("!!! MongoDB Connection Error !!!");
        console.error(err);
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));