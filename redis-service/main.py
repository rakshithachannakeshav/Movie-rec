from fastapi import FastAPI
import redis
import json

app = FastAPI()

# connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# -------- MOVIE CACHE --------
@app.post("/redis/cache_movie")
def cache_movie(movie: dict):
    r.set(f"movie:{movie['movie_id']}", json.dumps(movie))
    return {"message": "Movie cached"}

@app.get("/redis/movie/{movie_id}")
def get_movie(movie_id: int):
    data = r.get(f"movie:{movie_id}")
    if data:
        return json.loads(data)
    return {"error": "Not found"}

# -------- USER HISTORY --------
@app.post("/redis/log_activity")
def log_activity(user_id: int, movie_id: int):
    r.lpush(f"user:{user_id}:history", movie_id)

    # 🔥 ADD THIS LINE (TRENDING LOGIC)
    r.zincrby("trending_movies", 1, movie_id)

    return {"message": "Activity logged"}

@app.get("/redis/history")
def get_history(user_id: int):
    history = r.lrange(f"user:{user_id}:history", 0, -1)
    return {"user_id": user_id, "history": history}

# -------- RECOMMENDATIONS --------
@app.post("/redis/store_recommendations")
def store_recommendations(user_id: int, movies: dict):
    r.zadd(f"user:{user_id}:recommendations", movies)
    return {"message": "Stored"}

@app.get("/redis/recommendations")
def get_recommendations(user_id: int):
    recs = r.zrevrange(f"user:{user_id}:recommendations", 0, 4)

    # ✅ If cache exists → return instantly
    if recs:
        return {
            "source": "redis",
            "recommended_movies": recs
        }

    return {
        "source": "neo4j",
        "message": "No cache available"
    }
@app.get("/redis/trending")
def get_trending():
    return {
        "trending": r.zrevrange("trending_movies", 0, 4)
    }