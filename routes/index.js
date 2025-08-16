const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

const User = require('../models/user.model');
const Policy = require('../models/policy.model');
const Message = require('../models/message.model');
const schedule = require('node-schedule');

const router = express.Router();

// Multer setup
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadsDir),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  limits: { fileSize: (Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 20)) * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = /(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .xlsx/.xls/.csv allowed'), ok);
  }
});

// 1) Upload API using worker threads
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  const workerPath = path.join(__dirname, '..', 'workers', 'uploadWorker.js');
  const worker = new Worker(workerPath, {
    workerData: {
      filePath: req.file.path,
      mongoUri: process.env.MONGO_URI
    }
  });

  worker.on('message', (msg) => {
    if (msg.status === 'success') return res.json(msg);
    return res.status(500).json(msg);
  });
  worker.on('error', (err) => res.status(500).json({ status: 'error', error: err.message }));
});

// 2) Search API to find policy info by username (firstName)
router.get('/policies/by-user/:username', async (req, res) => {
  const username = req.params.username;
  const user = await User.findOne({ firstName: new RegExp(`^${username}$`, 'i') });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const policies = await Policy.find({ userId: user._id })
    .populate('policyCategoryCollectionId', 'categoryName')
    .populate('companyCollectionId', 'companyName')
    .lean();

  res.json({ user: { id: user._id, firstName: user.firstName }, policies });
});

// 3) Aggregated policy by each user
router.get('/policies/aggregate/by-user', async (req, res) => {
  const results = await Policy.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: '$user._id',
        firstName: { $first: '$user.firstName' },
        email: { $first: '$user.email' },
        totalPolicies: { $sum: 1 },
        firstPolicyStart: { $min: '$policyStartDate' },
        lastPolicyEnd: { $max: '$policyEndDate' }
      }
    },
    { $sort: { firstName: 1 } }
  ]);
  res.json(results);
});

// 4) Scheduled insert API (message, day, time)
// Body: { message: string, day: 'YYYY-MM-DD', time: 'HH:mm' (24h, local) }
router.post('/schedule-message', async (req, res) => {
  const { message, day, time } = req.body || {};
  if (!message || !day || !time) {
    return res.status(400).json({ error: 'message, day (YYYY-MM-DD), time (HH:mm) are required' });
  }
  const date = new Date(`${day}T${time}:00`); // local timezone
  if (isNaN(date.getTime())) return res.status(400).json({ error: 'Invalid day/time format' });

  // Schedule the job
  schedule.scheduleJob(date, async () => {
    try {
      await Message.create({ message, scheduledFor: date });
      console.log('Inserted scheduled message at', new Date().toISOString());
    } catch (e) {
      console.error('Failed to insert scheduled message:', e.message);
    }
  });

  res.json({ status: 'scheduled', executeAt: date });
});

module.exports = router;