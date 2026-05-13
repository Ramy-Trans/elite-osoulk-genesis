// Vercel serverless entry point — re-exports the Express app
// Vercel's @vercel/node runtime handles the HTTP bridging automatically.
import app from "../server/index.js";
export default app;
