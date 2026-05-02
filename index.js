const express = require('express');
const app = express();
const pg = require('./postgres'); 
const neo4j = require('./neo4j'); // Ensure this is imported for the graph part
const queries = require('./queries'); // Import query strings
require('dotenv').config();

app.use(express.json());

// MongoDB Routes
const mongoRoutes = require('./mongo');
app.use('/mongo', mongoRoutes);

// Unified Recommend Routes
const recommendRoutes = require('./recommend');
app.use('/recommend', recommendRoutes);

// --- 0. NEO4J RECOMMENDATIONS API ---
app.get('/get_recommendations', async (req, res) => {
    try {
        const user_id = parseInt(req.query.user_id, 10);
        if (isNaN(user_id)) {
            return res.status(400).json({ error: "user_id MUST be an integer" });
        }

        const result = await neo4j.executeRead(queries.getRecommendationsQuery, { userId: user_id });
        
        // Extract movie_ids, accounting for Neo4j Integer objects or standard numbers safely
        const recommendedMovies = result.records.map(record => {
            const id = record.get('movie_id');
            return id.toNumber ? id.toNumber() : id;
        });

        res.status(200).json({ recommended_movies: recommendedMovies });
    } catch (err) {
        console.error("Neo4j /get_recommendations Error:", err.message);
        res.status(500).json({ error: "Failed to fetch recommendations from Neo4j" });
    }
});

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
        if (neo4j && neo4j.executeWrite) {
            await neo4j.executeWrite(
                'CREATE (u:User {id: $id, username: $username})', 
                { id: newUser_id, username: username }
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
