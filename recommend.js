const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// Default 3000 as defined in index.js server start section (wait, process.env.PORT || 3000 in index.js and I set PORT=5000 in .env so it will use 5000)
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// The router will be mounted on '/recommend' in index.js
router.get('/', async (req, res) => {
    try {
        const user_id = parseInt(req.query.user_id, 10);
        
        if (isNaN(user_id)) {
            return res.status(400).json({ error: "user_id MUST be an integer" });
        }

        console.log(`[Recommend API] Generating recommendations for user_id: ${user_id}`);

        // 1. Call Neo4j: GET /get_recommendations?user_id=1
        let recommendations = [];
        try {
            const neoResponse = await axios.get(`${BASE_URL}/get_recommendations`, { params: { user_id } });
            recommendations = neoResponse.data.recommended_movies || [];
            console.log(`[Recommend API] 1. Neo4j recommended:`, recommendations);
        } catch (err) {
            console.error('[Recommend API] 1. Error fetching from Neo4j:', err.message);
            return res.status(500).json({ error: "Failed to fetch recommendations from Neo4j API" });
        }

        // 2. Call MongoDB: GET /mongo/get_history?user_id=1
        let history = [];
        try {
            const mongoResponse = await axios.get(`${BASE_URL}/mongo/get_history`, { params: { user_id } });
            history = mongoResponse.data.history || [];
            console.log(`[Recommend API] 2. MongoDB history:`, history);
        } catch (err) {
            console.error('[Recommend API] 2. Error fetching from MongoDB:', err.message);
            return res.status(500).json({ error: "Failed to fetch user history from MongoDB API" });
        }

        // 3. Filter: recommended_movies - history
        const historySet = new Set(history);
        const filteredMovieIds = recommendations.filter(id => !historySet.has(id));
        console.log(`[Recommend API] 3. Filtered movies count:`, filteredMovieIds.length);

        // Edge case: No recommendations or all already watched
        if (filteredMovieIds.length === 0) {
            return res.status(200).json({
                user_id: user_id,
                recommendations: []
            });
        }

        // Bonus: Limit to top 10 movies
        const topMovies = filteredMovieIds.slice(0, 10);

        // 4. Call PostgreSQL for each remaining movie_id in parallel
        let finalRecommendations = [];
        try {
            // Using Promise.all for speed optimization as requested
            const moviePromises = topMovies.map(async id => {
                try {
                    const response = await axios.get(`${BASE_URL}/movie/${id}`);
                    return {
                        movie_id: response.data.movie_id,
                        title: response.data.title
                    };
                } catch (internalErr) {
                    // If a specific movie is not found, we ignore it cleanly
                    if (internalErr.response && internalErr.response.status === 404) {
                        return null;
                    }
                    // For massive network failure on this Postgres call, propagate
                    throw internalErr;
                }
            });

            const movieResponses = await Promise.all(moviePromises);
            
            // Remove any nulls due to 404s
            finalRecommendations = movieResponses.filter(item => item !== null);

            console.log(`[Recommend API] 4. PostgreSQL movie details resolved successfully`);
        } catch (err) {
            console.error('[Recommend API] 4. Error fetching from PostgreSQL:', err.message);
            return res.status(500).json({ error: "Failed to fetch movie details from PostgreSQL API" });
        }

        console.log(`[Recommend API] Process finalized successfully`);

        // Build precise final JSON response pattern
        return res.status(200).json({
            user_id: user_id,
            recommendations: finalRecommendations
        });

    } catch (error) {
        console.error('[Recommend API] Fatal Error:', error.message);
        res.status(500).json({ error: "Internal Server Error during integration" });
    }
});

module.exports = router;
