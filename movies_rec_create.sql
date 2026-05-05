-- 1. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create the Movies table
CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    release_year INTEGER,
    genre_main TEXT,
    rating_avg DECIMAL(3,2) DEFAULT 0.0
);