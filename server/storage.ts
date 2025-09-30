import {
  type Category,
  type InsertCategory,
  type PriceTier,
  type InsertPriceTier,
  type Project,
  type InsertProject,
  type ProjectImage,
  type InsertProjectImage,
  type Order,
  type InsertOrder,
  type Payment,
  type InsertPayment,
  type PortfolioImage,
  type InsertPortfolioImage,
  type ContactSubmission,
  type InsertContactSubmission,
  categories,
  priceTiers,
  projects,
  projectImages,
  orders,
  payments,
  portfolioImages,
  contactSubmissions,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  // Price Tiers
  getTiersByCategory(categoryId: string): Promise<PriceTier[]>;
  getTierById(id: string): Promise<PriceTier | undefined>;
  createTier(tier: InsertPriceTier): Promise<PriceTier>;
  updateTier(id: string, tier: Partial<InsertPriceTier>): Promise<PriceTier | undefined>;
  deleteTier(id: string): Promise<void>;

  // Projects
  getProjects(filters?: { published?: boolean; categoryId?: string; search?: string }): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  getProjectBySlug(slug: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  // Project Images
  getProjectImages(projectId: string): Promise<ProjectImage[]>;
  createProjectImage(image: InsertProjectImage): Promise<ProjectImage>;
  updateProjectImage(id: string, image: Partial<InsertProjectImage>): Promise<ProjectImage | undefined>;
  deleteProjectImage(id: string): Promise<void>;

  // Orders
  getOrders(filters?: { status?: string }): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Payments
  getPaymentsByOrder(orderId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Portfolio (backward compatibility)
  getPortfolioImages(): Promise<PortfolioImage[]>;
  getPortfolioImagesByCategory(category: string): Promise<PortfolioImage[]>;
  getFeaturedImages(): Promise<PortfolioImage[]>;
  createPortfolioImage(image: InsertPortfolioImage): Promise<PortfolioImage>;

  // Contact (backward compatibility)
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Price Tiers
  async getTiersByCategory(categoryId: string): Promise<PriceTier[]> {
    return await db.select().from(priceTiers).where(eq(priceTiers.categoryId, categoryId));
  }

  async getTierById(id: string): Promise<PriceTier | undefined> {
    const [tier] = await db.select().from(priceTiers).where(eq(priceTiers.id, id));
    return tier || undefined;
  }

  async createTier(insertTier: InsertPriceTier): Promise<PriceTier> {
    const [tier] = await db
      .insert(priceTiers)
      .values(insertTier)
      .returning();
    return tier;
  }

  async updateTier(id: string, updateData: Partial<InsertPriceTier>): Promise<PriceTier | undefined> {
    const [tier] = await db
      .update(priceTiers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(priceTiers.id, id))
      .returning();
    return tier || undefined;
  }

  async deleteTier(id: string): Promise<void> {
    await db.delete(priceTiers).where(eq(priceTiers.id, id));
  }

  // Projects
  async getProjects(filters?: { published?: boolean; categoryId?: string; search?: string }): Promise<Project[]> {
    if (!filters) {
      return await db.select().from(projects);
    }

    const conditions = [];
    
    if (filters.published !== undefined) {
      conditions.push(eq(projects.isPublished, filters.published));
    }
    
    if (filters.categoryId) {
      conditions.push(eq(projects.categoryId, filters.categoryId));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(projects.title, `%${filters.search}%`),
          like(projects.clientName, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length === 0) {
      return await db.select().from(projects);
    }

    return await db.select().from(projects).where(and(...conditions));
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Images
  async getProjectImages(projectId: string): Promise<ProjectImage[]> {
    return await db.select().from(projectImages).where(eq(projectImages.projectId, projectId));
  }

  async createProjectImage(insertImage: InsertProjectImage): Promise<ProjectImage> {
    const [image] = await db
      .insert(projectImages)
      .values(insertImage)
      .returning();
    return image;
  }

  async updateProjectImage(id: string, updateData: Partial<InsertProjectImage>): Promise<ProjectImage | undefined> {
    const [image] = await db
      .update(projectImages)
      .set(updateData)
      .where(eq(projectImages.id, id))
      .returning();
    return image || undefined;
  }

  async deleteProjectImage(id: string): Promise<void> {
    await db.delete(projectImages).where(eq(projectImages.id, id));
  }

  // Orders
  async getOrders(filters?: { status?: string }): Promise<Order[]> {
    if (!filters || !filters.status) {
      return await db.select().from(orders);
    }

    return await db.select().from(orders).where(eq(orders.status, filters.status as any));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Payments
  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.orderId, orderId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: string, updateData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  // Portfolio (backward compatibility)
  async getPortfolioImages(): Promise<PortfolioImage[]> {
    return await db.select().from(portfolioImages);
  }

  async getPortfolioImagesByCategory(category: string): Promise<PortfolioImage[]> {
    return await db.select().from(portfolioImages).where(eq(portfolioImages.category, category));
  }

  async getFeaturedImages(): Promise<PortfolioImage[]> {
    return await db.select().from(portfolioImages).where(eq(portfolioImages.featured, "true"));
  }

  async createPortfolioImage(insertImage: InsertPortfolioImage): Promise<PortfolioImage> {
    const [image] = await db
      .insert(portfolioImages)
      .values(insertImage)
      .returning();
    return image;
  }

  // Contact (backward compatibility)
  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const [submission] = await db
      .insert(contactSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db.select().from(contactSubmissions);
  }
}

export const storage = new DatabaseStorage();
