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
  type Photographer,
  type InsertPhotographer,
  type Session,
  type InsertSession,
  type SessionAssignment,
  type InsertSessionAssignment,
  type CalendarSlot,
  type InsertCalendarSlot,
  type AppSettings,
  type InsertAppSettings,
  type PaymentStatus,
  categories,
  priceTiers,
  projects,
  projectImages,
  orders,
  payments,
  portfolioImages,
  contactSubmissions,
  photographers,
  sessions,
  sessionAssignments,
  calendarSlots,
  appSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, gte, lte, inArray, asc } from "drizzle-orm";

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
  deleteOrder(id: string): Promise<void>;

  // Payments
  getPaymentsByOrder(orderId: string): Promise<Payment[]>;
  getPaymentByTransaction(orderId: string, transactionId: string): Promise<Payment | null>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  upsertPayment(orderId: string, transactionId: string, paymentData: {
    status: PaymentStatus;
    grossAmount: number;
    paidAt?: Date;
    rawNotifJson: any;
  }): Promise<Payment>;

  // Portfolio (backward compatibility)
  getPortfolioImages(): Promise<PortfolioImage[]>;
  getPortfolioImagesByCategory(category: string): Promise<PortfolioImage[]>;
  getFeaturedImages(): Promise<PortfolioImage[]>;
  createPortfolioImage(image: InsertPortfolioImage): Promise<PortfolioImage>;

  // Contact (backward compatibility)
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;

  // Photographers
  getPhotographers(): Promise<Photographer[]>;
  getPhotographerById(id: string): Promise<Photographer | undefined>;
  createPhotographer(photographer: InsertPhotographer): Promise<Photographer>;
  updatePhotographer(id: string, photographer: Partial<InsertPhotographer>): Promise<Photographer | undefined>;
  deletePhotographer(id: string): Promise<void>;

  // Sessions
  getSessions(filters?: { photographerId?: string; from?: Date; to?: Date; projectId?: string; orderId?: string }): Promise<Session[]>;
  getSessionById(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, session: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;

  // Session Assignments
  assignPhotographerToSession(sessionId: string, photographerId: string): Promise<SessionAssignment>;
  getSessionAssignments(sessionId: string): Promise<SessionAssignment[]>;
  removeSessionAssignment(assignmentId: string): Promise<void>;

  // Calendar Slots
  getCalendarSlots(from: string, to: string): Promise<CalendarSlot[]>;
  upsertCalendarSlots(slots: Array<{localDate: string, hour: number, label?: string}>): Promise<void>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings>;
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

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
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

  async getPaymentByTransaction(orderId: string, transactionId: string): Promise<Payment | null> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.transactionId, transactionId)));
    return payment || null;
  }

  async upsertPayment(orderId: string, transactionId: string, paymentData: {
    status: PaymentStatus;
    grossAmount: number;
    paidAt?: Date;
    rawNotifJson: any;
  }): Promise<Payment> {
    const existingPayment = await this.getPaymentByTransaction(orderId, transactionId);

    if (existingPayment) {
      const [payment] = await db
        .update(payments)
        .set({
          status: paymentData.status,
          grossAmount: paymentData.grossAmount,
          paidAt: paymentData.paidAt,
          rawNotifJson: paymentData.rawNotifJson,
        })
        .where(eq(payments.id, existingPayment.id))
        .returning();
      return payment;
    } else {
      const [payment] = await db
        .insert(payments)
        .values({
          orderId,
          transactionId,
          status: paymentData.status,
          grossAmount: paymentData.grossAmount,
          paidAt: paymentData.paidAt,
          rawNotifJson: paymentData.rawNotifJson,
        })
        .returning();
      return payment;
    }
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

  // Photographers
  async getPhotographers(): Promise<Photographer[]> {
    return await db.select().from(photographers);
  }

  async getPhotographerById(id: string): Promise<Photographer | undefined> {
    const [photographer] = await db.select().from(photographers).where(eq(photographers.id, id));
    return photographer || undefined;
  }

  async createPhotographer(insertPhotographer: InsertPhotographer): Promise<Photographer> {
    const [photographer] = await db
      .insert(photographers)
      .values(insertPhotographer)
      .returning();
    return photographer;
  }

  async updatePhotographer(id: string, updateData: Partial<InsertPhotographer>): Promise<Photographer | undefined> {
    const [photographer] = await db
      .update(photographers)
      .set(updateData)
      .where(eq(photographers.id, id))
      .returning();
    return photographer || undefined;
  }

  async deletePhotographer(id: string): Promise<void> {
    await db.delete(photographers).where(eq(photographers.id, id));
  }

  // Sessions
  async getSessions(filters?: { photographerId?: string; from?: Date; to?: Date; projectId?: string; orderId?: string }): Promise<Session[]> {
    if (!filters) {
      return await db.select().from(sessions);
    }

    const conditions = [];
    
    if (filters.projectId) {
      conditions.push(eq(sessions.projectId, filters.projectId));
    }
    
    if (filters.orderId) {
      conditions.push(eq(sessions.orderId, filters.orderId));
    }
    
    if (filters.from) {
      conditions.push(gte(sessions.startAt, filters.from));
    }
    
    if (filters.to) {
      conditions.push(lte(sessions.endAt, filters.to));
    }
    
    if (filters.photographerId) {
      const assignments = await db.select().from(sessionAssignments)
        .where(eq(sessionAssignments.photographerId, filters.photographerId));
      
      const sessionIds = assignments.map(a => a.sessionId);
      
      if (sessionIds.length === 0) {
        return [];
      }
      
      conditions.push(inArray(sessions.id, sessionIds));
    }

    if (conditions.length === 0) {
      return await db.select().from(sessions);
    }

    return await db.select().from(sessions).where(and(...conditions));
  }

  async getSessionById(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateSession(id: string, updateData: Partial<InsertSession>): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  // Session Assignments
  async assignPhotographerToSession(sessionId: string, photographerId: string): Promise<SessionAssignment> {
    try {
      // Get the session we're trying to assign to
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('SESSION_NOT_FOUND');
      }

      // Check for overlapping sessions with this photographer
      const photographerSessions = await db
        .select({ session: sessions })
        .from(sessionAssignments)
        .innerJoin(sessions, eq(sessionAssignments.sessionId, sessions.id))
        .where(eq(sessionAssignments.photographerId, photographerId));

      // Check if any of the photographer's existing sessions overlap with the new session
      const sessionStart = new Date(session.startAt);
      const sessionEnd = new Date(session.endAt);

      for (const { session: existingSession } of photographerSessions) {
        const existingStart = new Date(existingSession.startAt);
        const existingEnd = new Date(existingSession.endAt);

        // Check for overlap: sessions overlap if one starts before the other ends
        const hasOverlap = sessionStart < existingEnd && sessionEnd > existingStart;
        
        if (hasOverlap) {
          throw new Error('PHOTOGRAPHER_BUSY');
        }
      }

      // No overlap found, proceed with assignment
      const [assignment] = await db
        .insert(sessionAssignments)
        .values({ sessionId, photographerId })
        .returning();
      return assignment;
    } catch (error: any) {
      if (error.code === '23P01') {
        throw new Error('PHOTOGRAPHER_BUSY');
      }
      throw error;
    }
  }

  async getSessionAssignments(sessionId: string): Promise<SessionAssignment[]> {
    return await db.select().from(sessionAssignments).where(eq(sessionAssignments.sessionId, sessionId));
  }

  async removeSessionAssignment(assignmentId: string): Promise<void> {
    await db.delete(sessionAssignments).where(eq(sessionAssignments.id, assignmentId));
  }

  // Calendar Slots
  async getCalendarSlots(from: string, to: string): Promise<CalendarSlot[]> {
    return await db
      .select()
      .from(calendarSlots)
      .where(and(gte(calendarSlots.localDate, from), lte(calendarSlots.localDate, to)))
      .orderBy(asc(calendarSlots.localDate), asc(calendarSlots.hour));
  }

  async upsertCalendarSlots(slots: Array<{localDate: string, hour: number, label?: string}>): Promise<void> {
    for (const slot of slots) {
      await db
        .insert(calendarSlots)
        .values({
          localDate: slot.localDate,
          hour: slot.hour,
          label: slot.label,
        })
        .onConflictDoUpdate({
          target: [calendarSlots.localDate, calendarSlots.hour],
          set: {
            label: slot.label,
            updatedAt: new Date(),
          },
        });
    }
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(appSettings).limit(1);
    return settings || undefined;
  }

  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    const existing = await this.getAppSettings();

    if (existing) {
      const [updated] = await db
        .update(appSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(appSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(appSettings)
        .values({
          timezone: settings.timezone || 'Asia/Jakarta',
          calendarStartHour: settings.calendarStartHour || 6,
          calendarEndHour: settings.calendarEndHour || 20,
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
