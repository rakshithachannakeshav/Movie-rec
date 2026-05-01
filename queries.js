/**
 * Cypher queries for the Neo4j Recommendation Engine
 */

// 1. Enhanced Collaborative Filtering (User-Based & Item-Based Hybrid behavior)
// This query finds users who interacted with the same movies as the target user,
// then recommends movies those similar users interacted with.
// It assigns higher weights to 'LIKED' and 'RATED' interactions to improve quality.
const getRecommendationsQuery = `
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
  RETURN rec.movie_id AS movie_id, sum(interactionWeight) AS score
  ORDER BY score DESC
  LIMIT 5
`;

// 2. Query to add a new interaction
// This ensures the User and Movie nodes exist, then creates the relationship
const getAddInteractionQuery = (action) => {
  // Only allow specific actions to prevent Cypher injection
  const validActions = ['WATCHED', 'LIKED', 'RATED'];
  const relType = validActions.includes(action.toUpperCase()) ? action.toUpperCase() : 'WATCHED';
  
  return `
    MERGE (u:User {user_id: $userId})
    MERGE (m:Movie {movie_id: $movieId})
    MERGE (u)-[r:${relType}]->(m)
    RETURN u.user_id, m.movie_id, type(r) AS action
  `;
};

// 3. Query to create indexes (should be run once in Neo4j Browser)
const createIndexesQueries = [
  "CREATE INDEX user_id_index IF NOT EXISTS FOR (u:User) ON (u.user_id)",
  "CREATE INDEX movie_id_index IF NOT EXISTS FOR (m:Movie) ON (m.movie_id)"
];

module.exports = {
  getRecommendationsQuery,
  getAddInteractionQuery,
  createIndexesQueries
};
