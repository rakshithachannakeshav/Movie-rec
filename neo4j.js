const neo4j = require('neo4j-driver');

// Update these credentials to match your local Neo4j database setup
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD; // Reads strictly from .env

let driver;

function initDriver() {
  try {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );
    console.log('Neo4j Driver initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Neo4j Driver:', error);
  }
}

function getDriver() {
  if (!driver) {
    initDriver();
  }
  return driver;
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    console.log('Neo4j Driver closed.');
  }
}

async function executeRead(query, params = {}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.executeRead(tx => tx.run(query, params));
    return result;
  } catch (error) {
    console.error('Neo4j Read Error:', error);
    throw error;
  } finally {
    await session.close();
  }
}

async function executeWrite(query, params = {}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.executeWrite(tx => tx.run(query, params));
    return result;
  } catch (error) {
    console.error('Neo4j Write Error:', error);
    throw error;
  } finally {
    await session.close();
  }
}

module.exports = {
  getDriver,
  closeDriver,
  executeRead,
  executeWrite
};
