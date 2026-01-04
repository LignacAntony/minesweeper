const express = require('express');
const router = express.Router();
const { saveScore, getTopScores, getUserScores } = require('../db/database');

// Get top scores for a difficulty
router.get('/:difficulty', async (req, res) => {
    try {
        const { difficulty } = req.params;
        
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }
        
        const scores = await getTopScores(difficulty, 10);
        res.json(scores);
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Get user's scores
router.get('/user/:fid', async (req, res) => {
    try {
        const userFid = parseInt(req.params.fid);
        
        if (isNaN(userFid)) {
            return res.status(400).json({ error: 'Invalid user FID' });
        }
        
        const scores = await getUserScores(userFid);
        res.json(scores);
    } catch (error) {
        console.error('Error fetching user scores:', error);
        res.status(500).json({ error: 'Failed to fetch user scores' });
    }
});

// Save a new score
router.post('/', async (req, res) => {
    try {
        const { userFid, username, difficulty, time } = req.body;
        
        // Validate input
        if (!userFid || !username || !difficulty || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }
        
        if (typeof time !== 'number' || time <= 0) {
            return res.status(400).json({ error: 'Invalid time' });
        }
        
        const result = await saveScore(userFid, username, difficulty, time);
        
        res.json({
            success: true,
            isNewBest: result.isNewBest,
            message: result.isNewBest ? 'New best score!' : 'Score saved'
        });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

module.exports = router;
