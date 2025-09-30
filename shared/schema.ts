import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, date, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import cuid from "cuid";

export const orderStatusEnum = pgEnum("order_status", ["PENDING", "CONSULTATION", "SESSION", "FINISHING", "DRIVE_LINK", "DONE", "CANCELLED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "settlement", "deny", "expire", "cancel"]);
export const paymentTypeEnum = pgEnum("payment_type", ["DOWN_PAYMENT", "FULL_PAYMENT"]);

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => cuid()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  basePrice: integer("base_price").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceTiers = pgTable("price_tiers", {
  id: text("id").primaryKey().$defaultFn(() => cuid()),
  categoryId: text("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => cuid()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: text("category_id").references(() => categories.id),
  clientName: text("client_name"),
  happenedAt: date("happened_at"),
  mainImageUrl: text("main_image_url").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  driveLink: text("drive_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectImages = pgTable("project_images", {
  id: text("id").primaryKey().$defaultFn(() => cuid()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const OrderStatus = {
  PENDING: "PENDING",
  CONSULTATION: "CONSULTATION",
  SESSION: "SESSION",
  FINISHING: "FINISHING",
  DRIVE_LINK: "DRIVE_LINK",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const orders = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => cuid()),
  categoryId: text("category_id").notNull().references(() => categories.id),
  priceTierId: text("price_tier_id").references(() => priceTiers.id),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  totalPrice: integer("total_price").notNull(),
  dpPercent: integer("dp_percent").notNull().default(30),
  dpAmount: integer("dp_amount").notNull(),
  midtransOrderId: text("midtrans_order_id").unique(),
  snapToken: text("snap_token"),
  snapRedirectUrl: text("snap_redirect_url"),
  paymentStatus: text("payment_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const PaymentStatus = {
  PENDING: "pending",
  SETTLEMENT: "settlement",
  DENY: "deny",
  EXPIRE: "expire",
  CANCEL: "cancel",
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentType = {
  DOWN_PAYMENT: "DOWN_PAYMENT",
  FULL_PAYMENT: "FULL_PAYMENT",
} as const;

export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => cuid()),
  orderId: text("order_id").notNull().references(() => orders.id),
  provider: text("provider").notNull().default("midtrans"),
  type: paymentTypeEnum("type").notNull().default("DOWN_PAYMENT"),
  status: paymentStatusEnum("status").notNull(),
  grossAmount: integer("gross_amount").notNull(),
  paidAt: timestamp("paid_at"),
  rawNotifJson: jsonb("raw_notif_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioImages = pgTable("portfolio_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text").notNull(),
  description: text("description"),
  featured: text("featured").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceTierSchema = createInsertSchema(priceTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectImageSchema = createInsertSchema(projectImages).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioImageSchema = createInsertSchema(portfolioImages).omit({
  id: true,
  createdAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertPriceTier = z.infer<typeof insertPriceTierSchema>;
export type PriceTier = typeof priceTiers.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectImage = z.infer<typeof insertProjectImageSchema>;
export type ProjectImage = typeof projectImages.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertPortfolioImage = z.infer<typeof insertPortfolioImageSchema>;
export type PortfolioImage = typeof portfolioImages.$inferSelect;

export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
