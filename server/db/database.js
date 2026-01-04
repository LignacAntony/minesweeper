const { createClient } = require('@libsql/client');

let db;

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
    try {
        const db = getDb();
        
        // Create scores table
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
        
        // Create indexes for faster queries
        await db.execute(`
            CREATE INDEX IF NOT EXISTS idx_scores_difficulty_time 
            ON scores(difficulty, time ASC)
        `);
        
        await db.execute(`
            CREATE INDEX IF NOT EXISTS idx_scores_user_fid 
            ON scores(user_fid)
        `);
        
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

// Save a new score
async function saveScore(userFid, username, difficulty, time) {
    const db = getDb();
    
    // Check if this is a new best score for this user and difficulty
    const existing = await db.execute({
        sql: `SELECT id, time FROM scores 
              WHERE user_fid = ? AND difficulty = ?
              ORDER BY time ASC
              LIMIT 1`,
        args: [userFid, difficulty]
    });
    
    const existingRow = existing.rows[0];
    
    // Only save if it's better than existing or no existing score
    if (!existingRow || time < existingRow.time) {
        if (existingRow) {
            // Update existing score
            await db.execute({
                sql: `UPDATE scores 
                      SET time = ?, username = ?, created_at = CURRENT_TIMESTAMP
                      WHERE id = ?`,
                args: [time, username, existingRow.id]
            });
        } else {
            // Insert new score
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

// Get top scores for a difficulty
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

// Get user's best scores
async function getUserScores(userFid) {
    const db = getDb();
    
    const result = await db.execute({
        sql: `SELECT difficulty, time, created_at
              FROM scores
              WHERE user_fid = ?
              ORDER BY difficulty, time ASC`,
        args: [userFid]
    });
    
    return result.rows;
}

module.exports = {
    initDatabase,
    getDb,
    saveScore,
    getTopScores,
    getUserScores
};
