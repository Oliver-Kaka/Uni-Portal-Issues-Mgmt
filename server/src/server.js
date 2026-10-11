/**
 * Local development server entry point.
 * Connects to MongoDB then starts Express.
 * Demo Only: Use Fictional Data
 */
import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log('[Server] Demo Only: Use Fictional Data');
    });
  })
  .catch((err) => {
    console.error('[Server] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
