require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const app = express();

// DB
require('./config/db');

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Utils: CPU Monitor (auto-restart when >= 70%)
require('./utils/cpuMonitor');

// Routes
const router = require('./routes');
app.use('/api', router);

// Health endpoint
app.get('/health', async (req, res) => {
  const state = mongoose.connection.readyState; // 1=connected
  res.json({ status: 'ok', dbConnected: state === 1 });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));