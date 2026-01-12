const { createClient } = require('@libsql/client');

let db;
let initialized = false;

function getDb() {
    if (!db) {
        db = createClient({
            url: process.env.TURSO_DATABASE_URL || 'file:local.db',
            authToken: process.env.TURSO_AUTH_TOKEN
        });
    }
    return db;
}

async function initDatabase() {
    if (initialized) return;
    
    try {
        const db = getDb();
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_fid INTEGER NOT NULL,
                username TEXT NOT NULL,
                difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
                time INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await db.execute(`
            CREATE INDEX IF NOT EXISTS idx_scores_difficulty_time 
            ON scores(difficulty, time ASC)
        `);
        
        await db.execute(`
            CREATE INDEX IF NOT EXISTS idx_scores_user_fid 
            ON scores(user_fid)
        `);
        
        initialized = true;
        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

async function saveScore(userFid, username, difficulty, time) {
    const db = getDb();
    
    const existing = await db.execute({
        sql: `SELECT id, time FROM scores 
              WHERE user_fid = ? AND difficulty = ?
              ORDER BY time ASC
              LIMIT 1`,
        args: [userFid, difficulty]
    });
    
    const existingRow = existing.rows[0];
    
    if (!existingRow || time < existingRow.time) {
        if (existingRow) {
            await db.execute({
                sql: `UPDATE scores 
                      SET time = ?, username = ?, created_at = CURRENT_TIMESTAMP
                      WHERE id = ?`,
                args: [time, username, existingRow.id]
            });
        } else {
            await db.execute({
                sql: `INSERT INTO scores (user_fid, username, difficulty, time)
                      VALUES (?, ?, ?, ?)`,
                args: [userFid, username, difficulty, time]
            });
        }
        return { isNewBest: true };
    }
    
    return { isNewBest: false };
}

async function getTopScores(difficulty, limit = 10) {
    const db = getDb();
    
    const result = await db.execute({
        sql: `SELECT user_fid, username, time, created_at
              FROM scores
              WHERE difficulty = ?
              ORDER BY time ASC
              LIMIT ?`,
        args: [difficulty, limit]
    });
    
    return result.rows;
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        await initDatabase();
        
        // POST - Save a new score
        if (req.method === 'POST') {
            const { userFid, username, difficulty, time } = req.body;
            
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
            
            return res.json({
                success: true,
                isNewBest: result.isNewBest,
                message: result.isNewBest ? 'New best score!' : 'Score saved'
            });
        }
        
        // GET - Get top scores for a difficulty
        if (req.method === 'GET') {
            const { difficulty } = req.query;
            
            if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
                return res.status(400).json({ error: 'Invalid or missing difficulty parameter' });
            }
            
            const scores = await getTopScores(difficulty, 10);
            return res.json(scores);
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
