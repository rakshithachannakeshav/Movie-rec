require('dotenv').config();
const express = require('express');
const { getDriver, closeDriver } = require('./neo4j');
const { getRecommendationsQuery, getAddInteractionQuery } = require('./queries');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * GET /
 * Root route to verify the server is running
 */
app.get('/', (req, res) => {
  res.send('Neo4j Recommendation API is running. Try visiting /get_recommendations?user_id=1');
});

/**
 * POST /add_interaction
 * Body: { user_id: 1, movie_id: 104, action: "WATCHED" }
 * Used by Backend Integration to update Neo4j when a user interacts with a movie.
 */
app.post('/add_interaction', async (req, res) => {
  const { user_id, movie_id, action } = req.body;

  if (!user_id || !movie_id || !action) {
    return res.status(400).json({ error: 'user_id, movie_id, and action are required' });
  }

  const userId = isNaN(user_id) ? user_id : Number(user_id);
  const movieId = isNaN(movie_id) ? movie_id : Number(movie_id);

  const driver = getDriver();
  const session = driver.session();

  try {
    const query = getAddInteractionQuery(action);
    await session.run(query, { userId, movieId });

    return res.json({
      success: true,
      message: `Interaction '${action}' added between user ${userId} and movie ${movieId}`
    });
  } catch (error) {
    console.error('Error adding interaction:', error);
    return res.status(500).json({ error: 'Internal server error while adding interaction' });
  } finally {
    await session.close();
  }
});

/**
 * GET /get_recommendations
 * Query Parameters:
 *   - user_id (required): The ID of the user to get recommendations for
 * Example: /get_recommendations?user_id=1
 */
app.get('/get_recommendations', async (req, res) => {
  const userIdStr = req.query.user_id;

  if (!userIdStr) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }

  // user_id might be a string or number in your DB depending on how you ingested data.
  // Using string by default, adjust to parseInt(userIdStr) if user_id is an integer in Neo4j.
  const userId = isNaN(userIdStr) ? userIdStr : Number(userIdStr);

  const driver = getDriver();
  const session = driver.session();

  try {
    // Execute the Cypher query using parameterized inputs to optimize performance
    const result = await session.run(getRecommendationsQuery, { userId });

    // Extract movie_ids, converting Neo4j Integers to regular JS numbers if necessary
    const movieIds = result.records.map(record => {
      const movieIdRaw = record.get('movie_id');
      return movieIdRaw && movieIdRaw.toNumber ? movieIdRaw.toNumber() : movieIdRaw;
    });

    return res.json({
      recommended_movies: movieIds
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({ error: 'Internal server error while fetching recommendations' });
  } finally {
    await session.close();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await closeDriver();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Try visiting: http://localhost:3000/get_recommendations?user_id=1');
});
