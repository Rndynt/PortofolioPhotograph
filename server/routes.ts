import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSubmissionSchema, insertPortfolioImageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Portfolio routes
  app.get("/api/portfolio", async (req, res) => {
    try {
      const images = await storage.getPortfolioImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio images" });
    }
  });

  app.get("/api/portfolio/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const images = await storage.getPortfolioImagesByCategory(category);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio images by category" });
    }
  });

  app.get("/api/portfolio/featured", async (req, res) => {
    try {
      const images = await storage.getFeaturedImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured images" });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    try {
      const validatedData = insertPortfolioImageSchema.parse(req.body);
      const image = await storage.createPortfolioImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      res.status(400).json({ message: "Invalid portfolio image data" });
    }
  });

  // Contact routes
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      res.status(201).json({ message: "Contact form submitted successfully", id: submission.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid contact form data" });
    }
  });

  app.get("/api/contact", async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact submissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
