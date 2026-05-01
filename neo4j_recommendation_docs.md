# Personalized Movie Recommendation System: Neo4j Engine Documentation

This document explains the graph logic behind our movie recommendation system and why Neo4j is the ideal choice for this component.

## 1. How Recommendations are Generated (Graph Traversal)

Our recommendation engine relies on a **Hybrid Collaborative Filtering** approach, leveraging both user behaviors and item co-occurrences directly through graph traversal.

### The Graph Structure
- **Nodes**: `User` (with `user_id`), `Movie` (with `movie_id`, `title`)
- **Relationships**: `[:WATCHED]`, `[:LIKED]`, `[:RATED]` connecting a User to a Movie.

### The Traversal Query
```cypher
MATCH (u:User {user_id: $userId})-[r1:WATCHED|LIKED|RATED]->(m:Movie)
MATCH (other:User)-[r2:WATCHED|LIKED|RATED]->(m)
MATCH (other)-[r3:WATCHED|LIKED|RATED]->(rec:Movie)
WHERE NOT (u)-[:WATCHED|LIKED|RATED]->(rec) AND u <> other
WITH rec, 
     CASE type(r3) 
       WHEN 'LIKED' THEN 3
       WHEN 'RATED' THEN coalesce(r3.rating, 2)
       ELSE 1 
     END AS interactionWeight
RETURN rec.movie_id AS movie_id, rec.title AS title, sum(interactionWeight) AS score
ORDER BY score DESC
LIMIT 5
```

### Step-by-Step Explanation
1. **Find Target User's History**: `(u:User)-[r1]->(m:Movie)`
   The traversal starts at the specific user (`$userId`) and finds all movies `m` they have interacted with (watched, liked, or rated).
2. **Find Similar Users**: `(other:User)-[r2]->(m)`
   It then traverses backwards from those movies to find `other` users who have also interacted with the same movies. These are our "similar users" (Collaborative Filtering).
3. **Find Candidate Movies**: `(other)-[r3]->(rec:Movie)`
   From those similar users, we traverse forward to find other movies `rec` they have interacted with. These are the candidate recommendations.
4. **Filter Out Already Seen**: `WHERE NOT (u)->(rec)`
   We exclude movies the target user has already interacted with.
5. **Scoring with Weights**: 
   Instead of just counting occurrences, we evaluate the *type* of relationship (`r3`). A `LIKED` relationship contributes a weight of 3, `RATED` contributes its rating value, and `WATCHED` contributes 1. We sum these weights up to get the final `score`.
6. **Return Top 5**: We sort by the highest score and return the top 5 `movie_id`s.

---

## 2. Why Neo4j is Suitable for this Use Case

While PostgreSQL and MongoDB are excellent for storing structured profiles and document-based logs, **Neo4j excels at discovering connections and patterns**.

### A. Index-Free Adjacency
In a relational database (like PostgreSQL), finding "users who watched the same movies and what else they watched" requires multiple expensive `JOIN` operations across massive tables. As data grows, JOINs become exponentially slower. 
In Neo4j, relationships are stored natively as pointers. Traversing from User -> Movie -> User -> Movie takes constant time per step (Index-Free Adjacency), making real-time recommendations extremely fast regardless of total data size.

### B. Natural Modeling of Real-World Systems
A recommendation system is inherently a network (Users connected to Items). Neo4j allows us to model the data exactly as we whiteboard it: `(User)-[:WATCHED]->(Movie)`. This semantic clarity makes queries (Cypher) intuitive to write, read, and modify.

### C. Easily Extensible Relationships
If we want to add a new interaction type (e.g., `[:ADDED_TO_WATCHLIST]`), we simply draw a new edge in the graph. We don't need to alter rigid table schemas or perform expensive migrations. Cypher allows us to seamlessly query `[:WATCHED|LIKED|ADDED_TO_WATCHLIST]` on the fly.

### D. Multi-Database Architecture Justification
By offloading the complex, connection-heavy recommendation logic to Neo4j, we prevent our primary PostgreSQL database from being bogged down by heavy analytical JOINs. Each database does what it does best:
- **PostgreSQL**: ACID transactions, structured user accounts.
- **MongoDB**: Flexible, high-write-throughput activity logs.
- **Neo4j**: Fast, deep-traversal relationship querying for real-time recommendations.

---

## 3. Query Optimization Setup

For the best performance, ensure the following indexes are created in your Neo4j database. You only need to run these commands once in your Neo4j Browser:

```cypher
CREATE INDEX user_id_index IF NOT EXISTS FOR (u:User) ON (u.user_id);
CREATE INDEX movie_id_index IF NOT EXISTS FOR (m:Movie) ON (m.movie_id);
```
These indexes ensure that the initial lookup `MATCH (u:User {user_id: $userId})` happens in `O(log N)` time rather than scanning the entire user base.
