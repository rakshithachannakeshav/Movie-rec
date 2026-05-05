const axios = require('axios');

const API_BASE = 'http://localhost:3000';

const NUM_USERS = 50;
const NUM_MOVIES = 51;
const NUM_INTERACTIONS = 300;
const ACTIONS = ['WATCHED', 'LIKED', 'RATED'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedData() {
  console.log(`🎬 Starting data seed... generating ${NUM_INTERACTIONS} random interactions.`);
  let successCount = 0;

  for (let i = 0; i < NUM_INTERACTIONS; i++) {
    const userId = getRandomInt(1, NUM_USERS);
    const movieId = getRandomInt(1, NUM_MOVIES);
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

    try {
      // Add to Neo4j
      await axios.post(`${API_BASE}/add_interaction`, {
        user_id: userId,
        movie_id: movieId,
        action: action
      });

      // Add to MongoDB
      // Map action strictly as per Mongo Schema: ['watched', 'liked']
      const mongoAction = action === 'RATED' ? 'watched' : action.toLowerCase();
      
      await axios.post(`${API_BASE}/mongo/log_activity`, {
        user_id: userId,
        movie_id: movieId,
        action: mongoAction
      });

      successCount++;
      if (i % 50 === 0 && i > 0) {
        console.log(`✅ Seeded ${i} interactions...`);
      }
    } catch (err) {
      // Ignore duplicates since mongo has a unique constraint
      if (err.response && err.response.status === 400 && err.response.data && err.response.data.error && err.response.data.error.includes('already logged')) {
         // silent ignore
      } else {
         console.warn(`⚠️ Error seeding interaction (User ${userId}, Movie ${movieId}):`, err.message);
      }
    }
  }

  console.log(`\n🎉 Seeding complete! Successfully added ${successCount} interactions to the Graph & MongoDB!`);
  console.log(`You can now test the recommendation engine for any User ID between 1 and 50.`);
}

seedData();
