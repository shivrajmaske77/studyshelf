import { Router } from "express";
import mongoose from "mongoose";
import Resource from "../models/Resource.js";

const router = Router();

router.get("/", async (_request, response, next) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    response.json(resources);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const resource = await Resource.create(request.body);
    response.status(201).json(resource);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: "Invalid resource ID." });
    }

    const resource = await Resource.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return response.status(404).json({ message: "Resource not found." });
    }

    response.json(resource);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ message: "Invalid resource ID." });
    }

    const resource = await Resource.findByIdAndDelete(request.params.id);
    if (!resource) {
      return response.status(404).json({ message: "Resource not found." });
    }

    response.json({ message: "Resource deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;
