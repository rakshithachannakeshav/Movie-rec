# 🎬 Personalized Movie Recommendation System

This project is a multi-database movie recommendation system that combines SQL, NoSQL, and Graph databases to generate personalized recommendations for users.

---

## 🧠 One-Line Explanation

We use PostgreSQL for structured data, MongoDB for user behavior tracking, and Neo4j for relationship-based recommendations, all integrated through APIs.

---

## 🏗️ Architecture

- **PostgreSQL** → Stores structured data (users, movies, ratings)
- **MongoDB** → Tracks user activity (watch history, likes)
- **Neo4j** → Generates recommendations using graph relationships
- **Node.js (Express)** → Backend integration layer
- **Frontend** → Displays recommendations to users

---

## 🔄 System Flow

1. User logs in → PostgreSQL  
2. User watches a movie → MongoDB + Neo4j  
3. Recommendation request:
   - Neo4j → returns recommended movie IDs  
   - MongoDB → provides user history  
   - PostgreSQL → provides movie details  
4. Backend combines results and sends to frontend  

---

## 🚀 Features Implemented

### ✅ PostgreSQL (Person A)
- Users, Movies, Ratings tables created
- APIs:
  - `/movies`
  - `/movie/:id`
  - `/users/:id`

---

### ✅ MongoDB (Person B)
- `user_activity` collection implemented
- Tracks:
  - user_id
  - movie_id
  - action (watched/liked)
  - timestamp
- APIs:
  - `POST /log_activity`
  - `GET /get_history`
- Optimizations:
  - Indexing on user_id
  - Duplicate prevention

---

### ✅ Neo4j (Person C)
- Graph relationships:
  - (User)-[:WATCHED]->(Movie)
- Implemented:
  - `/get_recommendations`
- Added:
  - executeRead / executeWrite abstraction
  - Stable query execution

---

### ✅ Integration Layer (Person D)
- Unified API:
  - `GET /recommend?user_id=1`
- Logic:
  - Fetch recommendations from Neo4j
  - Fetch user history from MongoDB
  - Remove already watched movies
  - Fetch movie details from PostgreSQL
- Optimizations:
  - Parallel API calls using `Promise.all`
  - Result limiting (top 10)
  - Graceful error handling

---

## 🧪 Current Status

### ✅ Completed Work
- Multi-database architecture fully implemented
- All individual APIs working
- End-to-end integration completed
- Error handling and edge cases covered
- System does not crash even if a service is down

---

### ⚠️ Pending / Limitations

- Neo4j is not running locally in the current environment  
  → Recommendations fall back to error handling instead of live graph output  

- No advanced ranking logic (e.g., liked > watched weighting)

- Frontend can be further enhanced for better UX

---

## 🔮 Future Improvements

- Add fallback recommendation logic when Neo4j is unavailable
- Implement ranking:
  - Prioritize liked movies
  - Genre-based recommendations
- Improve frontend UI/UX
- Add caching for faster responses
- Deploy system (Docker / Cloud)

---

## 🛠️ Tech Stack

- Node.js + Express
- PostgreSQL
- MongoDB (Mongoose)
- Neo4j (neo4j-driver)
- Axios (API communication)

---

## ▶️ How to Run

```bash
npm install
node index.js
