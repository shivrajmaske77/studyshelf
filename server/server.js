import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import resourceRoutes from "./routes/resourceRoutes.js";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_request, response) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  response.status(databaseConnected ? 200 : 503).json({
    status: "ok",
    database: databaseConnected ? "connected" : "disconnected"
  });
});

app.use("/api/resources", (_request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({
      message: process.env.MONGODB_URI
        ? "MongoDB Atlas is not connected. Check your connection string, database user, and Atlas Network Access settings."
        : "MongoDB Atlas is not configured. Add MONGODB_URI to server/.env and restart the app."
    });
  }
  next();
}, resourceRoutes);

app.use((error, _request, response, _next) => {
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(" ");
    return response.status(400).json({ message });
  }

  if (error.name === "SyntaxError" && "body" in error) {
    return response.status(400).json({ message: "Please send valid JSON." });
  }

  console.error(error);
  response.status(500).json({ message: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);

  if (!process.env.MONGODB_URI) {
    console.error("MongoDB Atlas is not configured. Add MONGODB_URI to server/.env.");
    return;
  }

  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas."))
    .catch((error) => {
      console.error("Could not connect to MongoDB Atlas:", error.message);
    });
});
