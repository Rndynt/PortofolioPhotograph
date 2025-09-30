import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContactSubmissionSchema,
  insertPortfolioImageSchema,
  insertCategorySchema,
  insertPriceTierSchema,
  insertProjectSchema,
  insertProjectImageSchema,
  insertOrderSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const { active } = req.query;
      let categories = await storage.getCategories();
      
      if (active === "true") {
        categories = categories.filter(cat => cat.isActive);
      }
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Price Tiers routes
  app.get("/api/categories/:categoryId/tiers", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const tiers = await storage.getTiersByCategory(categoryId);
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price tiers" });
    }
  });

  app.post("/api/tiers", async (req, res) => {
    try {
      const validatedData = insertPriceTierSchema.parse(req.body);
      const tier = await storage.createTier(validatedData);
      res.status(201).json(tier);
    } catch (error) {
      res.status(400).json({ message: "Invalid tier data" });
    }
  });

  app.patch("/api/tiers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPriceTierSchema.partial().parse(req.body);
      const tier = await storage.updateTier(id, validatedData);
      
      if (!tier) {
        return res.status(404).json({ message: "Tier not found" });
      }
      
      res.json(tier);
    } catch (error) {
      res.status(400).json({ message: "Invalid tier data" });
    }
  });

  app.delete("/api/tiers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTier(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tier" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const { published, categoryId, search } = req.query;
      const filters: { published?: boolean; categoryId?: string; search?: string } = {};
      
      if (published === "true") {
        filters.published = true;
      } else if (published === "false") {
        filters.published = false;
      }
      
      if (categoryId && typeof categoryId === "string") {
        filters.categoryId = categoryId;
      }
      
      if (search && typeof search === "string") {
        filters.search = search;
      }
      
      const projects = await storage.getProjects(filters);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let project = await storage.getProjectById(idOrSlug);
      
      if (!project) {
        project = await storage.getProjectBySlug(idOrSlug);
      }
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project Images routes
  app.get("/api/projects/:projectId/images", async (req, res) => {
    try {
      const { projectId } = req.params;
      const images = await storage.getProjectImages(projectId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project images" });
    }
  });

  app.post("/api/projects/:projectId/images", async (req, res) => {
    try {
      const { projectId } = req.params;
      const validatedData = insertProjectImageSchema.parse({
        ...req.body,
        projectId,
      });
      const image = await storage.createProjectImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      res.status(400).json({ message: "Invalid project image data" });
    }
  });

  app.patch("/api/project-images/:imageId", async (req, res) => {
    try {
      const { imageId } = req.params;
      const validatedData = insertProjectImageSchema.partial().parse(req.body);
      const image = await storage.updateProjectImage(imageId, validatedData);
      
      if (!image) {
        return res.status(404).json({ message: "Project image not found" });
      }
      
      res.json(image);
    } catch (error) {
      res.status(400).json({ message: "Invalid project image data" });
    }
  });

  app.delete("/api/project-images/:imageId", async (req, res) => {
    try {
      const { imageId } = req.params;
      await storage.deleteProjectImage(imageId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project image" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const { status } = req.query;
      const filters: { status?: string } = {};
      
      if (status && typeof status === "string") {
        filters.status = status;
      }
      
      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, validatedData);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.get("/api/orders/:id/payments", async (req, res) => {
    try {
      const { id } = req.params;
      const payments = await storage.getPaymentsByOrder(id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Portfolio routes (backward compatibility)
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

  const httpServer = createServer(app);
  return httpServer;
}
