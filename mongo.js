const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+ 
    // but we can omit them as modern mongoose handles it cleanly
})
.then(() => console.log('Connected to MongoDB successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Schema Definition
const userActivitySchema = new mongoose.Schema({
    user_id: { type: Number, required: true },
    movie_id: { type: Number, required: true },
    action: { type: String, enum: ['watched', 'liked'], required: true },
    timestamp: { type: Date, default: Date.now }
});

// Indexes (Bonus Requirement)
// 1. Index on user_id for faster lookups in get_history
userActivitySchema.index({ user_id: 1 });
// 2. Prevent duplicate entries for (user_id, movie_id, action)
userActivitySchema.index({ user_id: 1, movie_id: 1, action: 1 }, { unique: true });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

// API 1: /log_activity
router.post('/log_activity', async (req, res) => {
    try {
        const { user_id, movie_id, action } = req.body;

        // Validation - user_id and movie_id MUST be integers
        if (!Number.isInteger(user_id) || !Number.isInteger(movie_id)) {
            return res.status(400).json({ error: 'user_id and movie_id MUST be integers' });
        }

        const newLog = new UserActivity({
            user_id: user_id,
            movie_id: movie_id,
            action: action
        });

        await newLog.save();

        res.status(200).json({ message: 'Activity logged successfully' });
    } catch (err) {
        // Handle Duplicate entry error smoothly
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Activity already logged for this user, movie, and action.' });
        }
        // Basic error handling
        res.status(500).json({ error: err.message });
    }
});

// API 2: /get_history
router.get('/get_history', async (req, res) => {
    try {
        const user_id = parseInt(req.query.user_id, 10);

        if (isNaN(user_id)) {
            return res.status(400).json({ error: 'user_id MUST be an integer' });
        }

        // Fetch all records for user_id and sort by latest timestamp
        const records = await UserActivity.find({ user_id: user_id })
            .sort({ timestamp: -1 })
            .exec();

        // Unique movie_ids only
        const uniqueMovieIds = [...new Set(records.map(record => record.movie_id))];

        res.status(200).json({
            user_id: user_id,
            history: uniqueMovieIds
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
