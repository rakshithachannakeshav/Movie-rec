// ==========================================================================
// FRONTEND (PERSON D) - COMPLETE UI INTEGRATION
// ==========================================================================
// ✅ Person C (Neo4j) - FULLY INTEGRATED with their API endpoints
// ⏳ Person A (PostgreSQL) - EMPTY MODULE (ready for teammate's integration)
// ⏳ Person B (MongoDB) - EMPTY MODULE (ready for teammate's integration)
// ==========================================================================

const API_BASE_URL = 'http://localhost:3000';

// ==========================================================================
// 🅲 PERSON C (Neo4j) - COMPLETE INTEGRATION
// ==========================================================================

// Get recommendations from Person C's Neo4j API
async function getRecommendationsFromNeo4j(userId) {
  const response = await fetch(`${API_BASE_URL}/get_recommendations?user_id=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Neo4j API error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('✅ Person C (Neo4j) Response:', data);
  return data.recommended_movies || [];
}

// Add interaction using Person C's Neo4j API
async function addInteractionToNeo4j(userId, movieId, action) {
  const response = await fetch(`${API_BASE_URL}/add_interaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      movie_id: movieId,
      action: action
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add interaction: ${response.status}`);
  }
  
  return await response.json();
}

// ==========================================================================
// 🅰️ PERSON A (PostgreSQL) - EMPTY MODULE
// ==========================================================================
// ⚠️ This is a STUB - Person A will replace this with actual PostgreSQL integration
// Expected endpoint: GET /api/movies/{movieId} returning { movie_id, title, year, genre, poster_url }
// ==========================================================================

async function getMovieDetailsFromPostgreSQL(movieId) {
  // ============== PERSON A SECTION - READY FOR INTEGRATION ===============
  // TODO: Replace with actual PostgreSQL backend API call
  // Example implementation when Person A provides their endpoint:
  /*
  try {
    const response = await fetch(`http://localhost:5000/api/movies/${movieId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn(`PostgreSQL not available yet for movie ${movieId}:`, error.message);
  }
  */
  
  // Temporary placeholder - Person A will replace this
  console.log(`[Person A - PostgreSQL] Placeholder for movie ${movieId} - awaiting integration`);
  
  // Enhanced placeholder with realistic movie data for demo purposes
  const movieTitles = {
    101: "Inception", 204: "The Dark Knight", 567: "Interstellar", 
    890: "Pulp Fiction", 432: "Fight Club", 305: "Forrest Gump",
    678: "The Matrix", 123: "Goodfellas", 456: "The Godfather",
    789: "Seven Samurai", 999: "Spirited Away", 888: "Parasite",
    777: "Oldboy", 666: "City of God", 555: "The Lives of Others",
    42: "Blade Runner 2049", 73: "Whiplash", 91: "Her",
    158: "Moonlight", 203: "Get Out", 327: "La La Land",
    489: "Arrival", 11: "The Shawshank Redemption", 
    22: "The Social Network", 33: "No Country for Old Men",
    44: "There Will Be Blood", 55: "Eternal Sunshine"
  };
  
  return {
    movie_id: movieId,
    title: movieTitles[movieId] || `Movie ${movieId}`,
    year: Math.floor(Math.random() * (2024 - 1990 + 1) + 1990),
    genre: ["Action", "Drama", "Sci-Fi", "Thriller", "Comedy"][Math.floor(Math.random() * 5)],
    poster_emoji: "🎬",
    source: "PostgreSQL (Person A) - Awaiting Integration"
  };
}

// ==========================================================================
// 🅱️ PERSON B (MongoDB) - EMPTY MODULE
// ==========================================================================
// ⚠️ This is a STUB - Person B will replace this with actual MongoDB integration
// Expected endpoint: GET /api/users/{userId}/history returning user's watch history
// ==========================================================================

async function getUserHistoryFromMongoDB(userId) {
  // ============== PERSON B SECTION - READY FOR INTEGRATION ===============
  // TODO: Replace with actual MongoDB backend API call
  // Example implementation when Person B provides their endpoint:
  /*
  try {
    const response = await fetch(`http://localhost:4000/api/users/${userId}/history`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn(`MongoDB not available yet for user ${userId}:`, error.message);
  }
  */
  
  // Temporary placeholder - Person B will replace this
  console.log(`[Person B - MongoDB] Placeholder for user ${userId} history - awaiting integration`);
  return { user_id: userId, watch_history: [], ratings: [], analytics: {} };
}

// ==========================================================================
// MAIN APPLICATION LOGIC
// ==========================================================================

// Main function to get and display recommendations
async function getRecommendations() {
  const userIdInput = document.getElementById("userId");
  const userId = userIdInput.value.trim();
  
  if (!userId) {
    showNotification("⚠️ Please enter a User ID", "error");
    return;
  }
  
  const container = document.getElementById("recommendationContainer");
  const badge = document.getElementById("recCountBadge");
  const btn = document.getElementById("recBtn");
  
  // Show loading state
  btn.disabled = true;
  btn.innerHTML = `<span class="loader" style="width:18px;height:18px;border-width:3px;"></span> Fetching from Neo4j...`;
  
  container.innerHTML = `
    <div class="loading-state">
      <div class="loader"></div>
      <p>🎬 Querying Neo4j Graph Database (Person C)</p>
      <small style="color:#94a3b8;">Fetching collaborative filtering recommendations for user ${escapeHtml(userId)}</small>
    </div>
  `;
  badge.textContent = "⏳ Loading...";
  
  try {
    // Step 1: Get recommendations from Person C's Neo4j API
    const recommendedMovieIds = await getRecommendationsFromNeo4j(userId);
    
    console.log(`Received ${recommendedMovieIds.length} recommendations from Neo4j`);
    
    if (!recommendedMovieIds || recommendedMovieIds.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span style="font-size: 3rem;">🔍</span>
          <h3 style="margin: 1rem 0 0.5rem;">No recommendations found</h3>
          <p>User ${escapeHtml(userId)} has no interaction history in Neo4j.<br>Try adding some interactions first or use a different user ID.</p>
          <div style="margin-top: 1rem; font-size: 0.85rem; color: #facc15;">
            💡 Use the "Add User-Movie Interaction" section below
          </div>
        </div>
      `;
      badge.textContent = "0 recommendations";
      btn.disabled = false;
      btn.innerHTML = `<span>✨</span> Get Recommendations`;
      return;
    }
    
    badge.textContent = `🎬 ${recommendedMovieIds.length} recommendations from Neo4j`;
    
    // Step 2: Fetch movie details from Person A's PostgreSQL (placeholder for now)
    const movieDetailsPromises = recommendedMovieIds.map(async (movieId) => {
      try {
        const details = await getMovieDetailsFromPostgreSQL(movieId);
        return details;
      } catch (err) {
        console.warn(`Failed to fetch details for movie ${movieId}:`, err);
        return {
          movie_id: movieId,
          title: `Movie #${movieId}`,
          year: "TBA",
          genre: "Unknown",
          poster_emoji: "🎥",
          source: "Details unavailable"
        };
      }
    });
    
    const moviesData = await Promise.all(movieDetailsPromises);
    
    // Step 3: Optionally fetch user history from Person B's MongoDB (non-blocking)
    getUserHistoryFromMongoDB(userId).then(history => {
      console.log(`[Person B - MongoDB] User ${userId} history placeholder:`, history);
    }).catch(err => console.warn("MongoDB fetch error:", err));
    
    // Step 4: Render the recommendations
    renderMovieGrid(moviesData);
    
  } catch (error) {
    console.error("❌ Error in recommendation flow:", error);
    
    let errorMsg = "Unable to connect to Neo4j recommendation server.";
    if (error.message.includes("Failed to fetch")) {
      errorMsg = "⚠️ Cannot connect to Neo4j server at localhost:3000. Is Person C's backend running?";
    } else {
      errorMsg = `⚠️ Error: ${error.message}`;
    }
    
    container.innerHTML = `
      <div class="empty-state" style="border-left: 4px solid #ef4444;">
        <span style="font-size: 2.5rem;">🔌</span>
        <p style="color:#facc15; margin-top: 12px; font-weight:500;">${errorMsg}</p>
        <p style="font-size:0.85rem; margin-top:12px;">
          Make sure Person C's Neo4j server is running:<br>
          <code style="background:#000; padding: 0.25rem 0.5rem; border-radius: 0.5rem;">node index.js</code>
        </p>
        <p style="font-size:0.8rem; margin-top:12px; color:#94a3b8;">
          Expected endpoint: ${API_BASE_URL}/get_recommendations?user_id=...
        </p>
      </div>
    `;
    badge.textContent = "Error";
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>✨</span> Get Recommendations`;
  }
}

// Add user-movie interaction using Person C's API
async function addInteraction() {
  const userId = document.getElementById("interactionUserId").value;
  const movieId = document.getElementById("interactionMovieId").value;
  const action = document.getElementById("interactionAction").value;
  const messageDiv = document.getElementById("interactionMessage");
  
  if (!userId || !movieId) {
    showMessage(messageDiv, "Please enter both User ID and Movie ID", "error");
    return;
  }
  
  messageDiv.style.display = "block";
  messageDiv.innerHTML = "⏳ Adding interaction to Neo4j...";
  messageDiv.className = "interaction-message";
  
  try {
    const result = await addInteractionToNeo4j(userId, movieId, action);
    console.log("Interaction added:", result);
    showMessage(messageDiv, `✅ Success! User ${userId} ${action} movie ${movieId}`, "success");
    
    // Clear input fields after successful addition
    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 3000);
  } catch (error) {
    console.error("Error adding interaction:", error);
    showMessage(messageDiv, `❌ Failed: ${error.message}`, "error");
  }
}

// Helper function to render movie grid
function renderMovieGrid(movies) {
  const container = document.getElementById("recommendationContainer");
  
  if (!movies || movies.length === 0) {
    container.innerHTML = `<div class="empty-state">No movie details available.</div>`;
    return;
  }
  
  const gridHTML = `
    <div class="movie-grid">
      ${movies.map(movie => `
        <div class="movie-card">
          <div class="movie-poster-placeholder">
            ${movie.poster_emoji || "🎬"}
          </div>
          <div class="movie-title">${escapeHtml(movie.title)}</div>
          <div class="movie-meta">
            <span class="movie-id">🎫 ID: ${movie.movie_id}</span>
            <span class="movie-id">📅 ${movie.year || "—"}</span>
          </div>
          ${movie.genre ? `<div style="margin-top: 6px; font-size: 0.75rem; color: #facc15;">🎭 ${movie.genre}</div>` : ''}
          <div class="data-source">
            ${movie.source || "Person A (PostgreSQL) - Ready for integration"}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.innerHTML = gridHTML;
}

// Helper functions for UI
function showNotification(msg, type) {
  const container = document.getElementById("recommendationContainer");
  const notifDiv = document.createElement("div");
  notifDiv.className = "empty-state";
  notifDiv.style.background = type === "error" ? "#3b2a1f" : "#1e293b";
  notifDiv.style.borderLeft = `4px solid ${type === "error" ? "#ef4444" : "#facc15"}`;
  notifDiv.innerHTML = `<p>${msg}</p>`;
  container.prepend(notifDiv);
  setTimeout(() => notifDiv.remove(), 3000);
}

function showMessage(element, msg, type) {
  element.innerHTML = msg;
  element.className = `interaction-message ${type}`;
  element.style.display = "block";
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Add Enter key support
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("userId");
  if (inputField) {
    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        getRecommendations();
      }
    });
  }
  
  console.log("🎬 CinemaScope Frontend Ready");
  console.log("✅ Person C (Neo4j) API Integration: Complete");
  console.log("⏳ Person A (PostgreSQL) Module: Placeholder ready");
  console.log("⏳ Person B (MongoDB) Module: Placeholder ready");
  console.log(`🌐 Neo4j API URL: ${API_BASE_URL}`);
});