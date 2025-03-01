const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Environment variables for flexibility
const DB_HOST = process.env.DB_HOST || 'localhost'; // Default to localhost
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'myuser';
const DB_PASSWORD = process.env.DB_PASSWORD || 'mypassword';
const DB_NAME = process.env.DB_NAME || 'mydatabase';

// Configure connection pool
const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false, // Enable SSL for remote connections
});

module.exports = pool;
module.exports = prisma;