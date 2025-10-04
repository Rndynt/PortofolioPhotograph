import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertContactSubmissionSchema,
  insertPortfolioImageSchema,
  insertCategorySchema,
  insertPriceTierSchema,
  insertProjectSchema,
  insertProjectImageSchema,
  insertOrderSchema,
  insertPhotographerSchema,
  insertSessionSchema,
  projectImages,
  orders,
  projects,
  payments,
} from "@shared/schema";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { computeDpAmount, generateOrderId, verifySignature } from "./midtrans/helpers";
import { createSnapTransaction } from "./midtrans/client";

const createOrderSchema = z.object({
  categoryId: z.string().min(1),
  priceTierId: z.string().optional(),
  customerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  notes: z.string().optional(),
  channel: z.enum(["ONLINE", "OFFLINE"]).default("ONLINE"),
  paymentProvider: z.string().default("midtrans"),
  source: z.string().optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONSULTATION", "SESSION", "FINISHING", "DRIVE_LINK", "DONE", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  driveLink: z.string().optional(),
});

const manualPaymentSchema = z.object({
  provider: z.enum(["cash", "bank_transfer", "midtrans"]).default("cash"),
  status: z.enum(["pending", "settlement", "deny", "expire", "cancel"]).default("settlement"),
  grossAmount: z.number().positive(),
  paidAt: z.string().datetime().optional(),
  type: z.enum(["DOWN_PAYMENT", "FULL_PAYMENT"]).default("DOWN_PAYMENT"),
  notes: z.string().optional()
});

const createSessionApiSchema = z.object({
  projectId: z.string(),
  orderId: z.string().optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "CONFIRMED", "DONE", "CANCELLED"]).default("PLANNED"),
});

const updateSessionApiSchema = z.object({
  projectId: z.string().optional(),
  orderId: z.string().optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "CONFIRMED", "DONE", "CANCELLED"]).optional(),
}).partial();

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  app.get("/api/projects/:projectIdOrSlug/images", async (req, res) => {
    try {
      const { projectIdOrSlug } = req.params;
      
      let project = await storage.getProjectById(projectIdOrSlug);
      if (!project) {
        project = await storage.getProjectBySlug(projectIdOrSlug);
      }
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const images = await storage.getProjectImages(project.id);
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
      
      const image = await db.transaction(async (tx) => {
        const lockKey = Math.abs(hashCode(projectId));
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
        
        const existingImages = await tx.select().from(projectImages)
          .where(eq(projectImages.projectId, projectId));
        
        if (existingImages.length >= 7) {
          throw new Error("Cannot add more than 7 images per project");
        }
        
        const [newImage] = await tx
          .insert(projectImages)
          .values(validatedData)
          .returning();
        
        return newImage;
      });
      
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof Error && error.message === "Cannot add more than 7 images per project") {
        return res.status(400).json({ message: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project image data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project image" });
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

  app.post("/api/orders", async (req, res) => {
    try {
      // Validate request body
      const validatedData = createOrderSchema.parse(req.body);
      const { categoryId, priceTierId, customerName, email, phone, notes, channel, paymentProvider, source } = validatedData;
      
      // Fetch category first (needed for project creation)
      const category = await storage.getCategoryById(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }
      
      let totalPrice: number;
      let itemName: string;
      
      // Validate tier belongs to category if tier is provided
      if (priceTierId) {
        const tier = await storage.getTierById(priceTierId);
        if (!tier) {
          return res.status(400).json({ message: "Price tier not found" });
        }
        
        // Data integrity check: validate tier belongs to category
        if (tier.categoryId !== categoryId) {
          return res.status(400).json({ message: "Price tier does not belong to the specified category" });
        }
        
        totalPrice = tier.price;
        itemName = tier.name;
      } else {
        totalPrice = category.basePrice;
        itemName = category.name;
      }
      
      const dpAmount = computeDpAmount(totalPrice, 30);
      
      // Create order and project in a transaction
      const { order, project } = await db.transaction(async (tx) => {
        const [newOrder] = await tx
          .insert(orders)
          .values({
            categoryId,
            priceTierId: priceTierId || null,
            customerName,
            email,
            phone,
            notes: notes || null,
            status: "PENDING",
            totalPrice,
            dpPercent: 30,
            dpAmount,
            channel,
            paymentProvider,
            source: source || null,
          })
          .returning();
        
        const [newProject] = await tx
          .insert(projects)
          .values({
            orderId: newOrder.id,
            title: `${category.name} - ${customerName}`,
            slug: generateSlug(`${category.name}-${customerName}-${Date.now()}`),
            categoryId: categoryId,
            clientName: customerName,
            mainImageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4",
            isPublished: false,
          })
          .returning();
        
        return { order: newOrder, project: newProject };
      });
      
      // Skip Midtrans for offline orders
      if (channel === "OFFLINE") {
        return res.status(201).json({ orderId: order.id, projectId: project.id });
      }
      
      // Environment variable guards for online orders
      if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
        await storage.deleteProject(project.id);
        await storage.deleteOrder(order.id);
        return res.status(500).json({ message: "Payment system not configured" });
      }
      
      const midtransOrderId = generateOrderId(order.id);
      
      // Try to create Snap transaction, delete order and project if it fails
      let snapTransaction;
      try {
        snapTransaction = await createSnapTransaction({
          transaction_details: {
            order_id: midtransOrderId,
            gross_amount: dpAmount,
          },
          customer_details: {
            first_name: customerName,
            email,
            phone,
          },
          item_details: [
            {
              id: "dp",
              name: `Down Payment for ${itemName}`,
              price: dpAmount,
              quantity: 1,
            },
          ],
        });
      } catch (midtransError) {
        // Delete both order and project if Midtrans fails
        await storage.deleteProject(project.id);
        await storage.deleteOrder(order.id);
        console.error("Midtrans transaction creation failed:", midtransError);
        return res.status(500).json({ message: "Payment system error: Failed to create payment transaction" });
      }
      
      // Update order with Midtrans data
      await storage.updateOrder(order.id, {
        midtransOrderId,
        snapToken: snapTransaction.token,
        snapRedirectUrl: snapTransaction.redirect_url,
      });
      
      res.status(201).json({
        orderId: order.id,
        projectId: project.id,
        snapToken: snapTransaction.token,
        redirect_url: snapTransaction.redirect_url,
      });
    } catch (error) {
      // Handle validation errors (400) vs server errors (500)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateOrderSchema.parse(req.body);
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

  app.post("/api/orders/:id/payments", async (req, res) => {
    try {
      const { id: orderId } = req.params;
      const validatedData = manualPaymentSchema.parse(req.body);
      
      // Verify order exists
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Create payment record
      const payment = await db.insert(payments).values({
        orderId,
        transactionId: `manual_${Date.now()}_${orderId.slice(0, 8)}`,
        provider: validatedData.provider,
        type: validatedData.type,
        status: validatedData.status,
        grossAmount: validatedData.grossAmount,
        paidAt: validatedData.paidAt ? new Date(validatedData.paidAt) : new Date(),
        rawNotifJson: { manual: true, notes: validatedData.notes || null }
      }).returning();
      
      // If settlement and order is PENDING, advance to CONSULTATION
      if (validatedData.status === "settlement" && order.status === "PENDING") {
        await storage.updateOrder(orderId, { 
          status: "CONSULTATION",
          paymentStatus: "settlement"
        });
      }
      
      res.status(201).json(payment[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create manual payment" });
    }
  });

  // Photographers routes
  app.get("/api/photographers", async (req, res) => {
    try {
      const { active } = req.query;
      let photographersList = await storage.getPhotographers();
      
      if (active === "true") {
        photographersList = photographersList.filter(p => p.isActive);
      }
      
      res.json(photographersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photographers" });
    }
  });

  app.get("/api/photographers/:id", async (req, res) => {
    try {
      const photographer = await storage.getPhotographerById(req.params.id);
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }
      res.json(photographer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photographer" });
    }
  });

  app.post("/api/photographers", async (req, res) => {
    try {
      const validatedData = insertPhotographerSchema.parse(req.body);
      const photographer = await storage.createPhotographer(validatedData);
      res.status(201).json(photographer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid photographer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create photographer" });
    }
  });

  app.patch("/api/photographers/:id", async (req, res) => {
    try {
      const validatedData = insertPhotographerSchema.partial().parse(req.body);
      const photographer = await storage.updatePhotographer(req.params.id, validatedData);
      
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }
      res.json(photographer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid photographer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update photographer" });
    }
  });

  app.delete("/api/photographers/:id", async (req, res) => {
    try {
      await storage.deletePhotographer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photographer" });
    }
  });

  // Sessions routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const { photographerId, from, to, projectId, orderId } = req.query;
      const filters: any = {};
      
      if (photographerId && typeof photographerId === "string") {
        filters.photographerId = photographerId;
      }
      if (from && typeof from === "string") {
        filters.from = new Date(from);
      }
      if (to && typeof to === "string") {
        filters.to = new Date(to);
      }
      if (projectId && typeof projectId === "string") {
        filters.projectId = projectId;
      }
      if (orderId && typeof orderId === "string") {
        filters.orderId = orderId;
      }
      
      const sessionsList = await storage.getSessions(filters);
      res.json(sessionsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSessionById(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = createSessionApiSchema.parse(req.body);
      
      // Validate endAt > startAt
      if (new Date(validatedData.endAt) <= new Date(validatedData.startAt)) {
        return res.status(400).json({ message: "End time must be after start time" });
      }
      
      // Transform to storage format with Date objects
      const sessionData = {
        ...validatedData,
        startAt: new Date(validatedData.startAt),
        endAt: new Date(validatedData.endAt),
      };
      
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const validatedData = updateSessionApiSchema.parse(req.body);
      
      // If updating times, validate endAt > startAt
      if (validatedData.startAt || validatedData.endAt) {
        const existing = await storage.getSessionById(req.params.id);
        if (!existing) {
          return res.status(404).json({ message: "Session not found" });
        }
        
        const newStart = validatedData.startAt ? new Date(validatedData.startAt) : new Date(existing.startAt);
        const newEnd = validatedData.endAt ? new Date(validatedData.endAt) : new Date(existing.endAt);
        
        if (newEnd <= newStart) {
          return res.status(400).json({ message: "End time must be after start time" });
        }
      }
      
      // Transform to storage format with Date objects
      const sessionData: any = { ...validatedData };
      if (validatedData.startAt) sessionData.startAt = new Date(validatedData.startAt);
      if (validatedData.endAt) sessionData.endAt = new Date(validatedData.endAt);
      
      const session = await storage.updateSession(req.params.id, sessionData);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      await storage.deleteSession(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Session Assignment endpoints
  app.post("/api/sessions/:id/assign", async (req, res) => {
    try {
      const { id: sessionId } = req.params;
      const { photographerId } = req.body;

      if (!photographerId || typeof photographerId !== "string") {
        return res.status(400).json({ message: "Photographer ID is required" });
      }

      // Verify session exists
      const session = await storage.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify photographer exists and is active
      const photographer = await storage.getPhotographerById(photographerId);
      if (!photographer) {
        return res.status(404).json({ message: "Photographer not found" });
      }
      if (!photographer.isActive) {
        return res.status(400).json({ message: "Photographer is not active" });
      }

      // Try to assign photographer (will throw PHOTOGRAPHER_BUSY on conflict)
      const assignment = await storage.assignPhotographerToSession(sessionId, photographerId);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof Error && error.message === "PHOTOGRAPHER_BUSY") {
        return res.status(409).json({
          code: "PHOTOGRAPHER_BUSY",
          message: "Photographer is busy during this time",
          conflict: true
        });
      }
      console.error("Session assignment error:", error);
      res.status(500).json({ message: "Failed to assign photographer to session" });
    }
  });

  app.get("/api/sessions/:id/assignments", async (req, res) => {
    try {
      const { id: sessionId } = req.params;
      
      // Verify session exists
      const session = await storage.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const assignments = await storage.getSessionAssignments(sessionId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session assignments" });
    }
  });

  app.get("/api/session-assignments", async (req, res) => {
    try {
      const allSessions = await storage.getSessions();
      const allAssignments = await Promise.all(
        allSessions.map(async (session) => {
          const assignments = await storage.getSessionAssignments(session.id);
          return assignments;
        })
      );
      const flatAssignments = allAssignments.flat();
      res.json(flatAssignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session assignments" });
    }
  });

  app.delete("/api/session-assignments/:id", async (req, res) => {
    try {
      const { id: assignmentId } = req.params;
      await storage.removeSessionAssignment(assignmentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove session assignment" });
    }
  });

  app.post("/api/midtrans/webhook", async (req, res) => {
    try {
      const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_id,
        transaction_status,
      } = req.body;

      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      if (!serverKey) {
        console.error("MIDTRANS_SERVER_KEY not configured");
        return res.status(500).json({ message: "Server configuration error" });
      }

      const isValid = verifySignature(
        order_id,
        status_code,
        gross_amount,
        serverKey,
        signature_key
      );

      if (!isValid) {
        console.error("Invalid signature for webhook");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orderId = order_id.replace("order_", "");
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        console.error(`Order not found: ${orderId}`);
        return res.status(200).json({ message: "OK" });
      }

      const paidAt = transaction_status === "settlement" ? new Date() : undefined;
      
      await storage.upsertPayment(orderId, transaction_id, {
        status: transaction_status,
        grossAmount: parseInt(gross_amount),
        paidAt,
        rawNotifJson: req.body,
      });

      const updateData: any = {
        paymentStatus: transaction_status,
      };

      if (transaction_status === "settlement" && order.status === "PENDING") {
        updateData.status = "CONSULTATION";
      }

      await storage.updateOrder(orderId, updateData);

      res.status(200).json({ message: "OK" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(200).json({ message: "OK" });
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
