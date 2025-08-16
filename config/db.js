const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('MONGO_URI missing in .env');

mongoose.set('strictQuery', true);

mongoose.connect(uri, {
  maxPoolSize: 10
}).then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = mongoose;