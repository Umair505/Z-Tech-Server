const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// (Configuration Loading)
dotenv.config();

// (Database Connection)
connectDB();

const app = express();

// (Middleware)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true 
}));

// (Test Route)
app.get('/', (req, res) => {
    res.send('Z-Tech Server is Running... 🚀');
});

// (Global Error Handling)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

// (Server Listening)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});