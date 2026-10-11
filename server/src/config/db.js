/**
 * Cached MongoDB connection helper.
 * Keeps the connection alive between serverless invocations (Vercel).
 * Demo Only: Use Fictional Data
 */
import mongoose from 'mongoose';

let cached = global._mongoConn ?? null;

export async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) {
    return cached;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  cached = conn;
  global._mongoConn = conn;
  console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
  return conn;
}
