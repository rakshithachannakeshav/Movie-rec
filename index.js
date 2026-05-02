const express = require('express');
const app = express();
const pg = require('./postgres'); 
const neo4j = require('./neo4j'); // Ensure this is imported for the graph part
require('dotenv').config();

app.use(express.json());

// --- 1. REGISTRATION API (POST) ---
// Creates a user in Postgres and a corresponding node in Neo4j
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Attempting to register user:", username);

    try {
        // Step A: Insert into PostgreSQL
        const pgQuery = 'INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING user_id';
        const pgResult = await pg.query(pgQuery, [username, email, password]);
        const newUser_id = pgResult.rows[0].user_id;

        // Step B: Sync with Neo4j (Optional but recommended for your project)
        if (neo4j) {
            await neo4j.executeWrite(tx => 
                tx.run('CREATE (u:User {id: $id, username: $username})', { id: newUser_id, username: username })
            );
        }

        res.status(201).json({ message: "User registered!", user_id: newUser_id });
    } catch (err) {
        console.error("Reg Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- 2. RATINGS API (POST) ---
// Links a user to a movie with a score
app.post('/rate', async (req, res) => {
    const { user_id, movie_id, rating } = req.body;
    try {
        const query = 'INSERT INTO ratings (user_id, movie_id, rating_value) VALUES ($1, $2, $3) RETURNING *';
        const result = await pg.query(query, [user_id, movie_id, rating]);
        res.status(201).json({ message: "Rating submitted!", data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ... [Existing imports remain the same]

// This MUST be '/movies' (plural)
app.get('/movies', async (req, res) => {
    try {
        const result = await pg.query('SELECT movie_id, title, genre_main as genre FROM movies');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// This MUST be '/movie/:id' (singular + colon)
app.get('/movie/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pg.query('SELECT * FROM movies WHERE movie_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Movie not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. USER APIs (GET) ---

app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pg.query('SELECT user_id, username, email FROM users WHERE user_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`-----------------------------------------`);
});