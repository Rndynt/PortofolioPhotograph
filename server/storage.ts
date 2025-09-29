import { type PortfolioImage, type InsertPortfolioImage, type ContactSubmission, type InsertContactSubmission } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Portfolio methods
  getPortfolioImages(): Promise<PortfolioImage[]>;
  getPortfolioImagesByCategory(category: string): Promise<PortfolioImage[]>;
  getFeaturedImages(): Promise<PortfolioImage[]>;
  createPortfolioImage(image: InsertPortfolioImage): Promise<PortfolioImage>;
  
  // Contact methods
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
}

export class MemStorage implements IStorage {
  private portfolioImages: Map<string, PortfolioImage>;
  private contactSubmissions: Map<string, ContactSubmission>;

  constructor() {
    this.portfolioImages = new Map();
    this.contactSubmissions = new Map();
  }

  async getPortfolioImages(): Promise<PortfolioImage[]> {
    return Array.from(this.portfolioImages.values());
  }

  async getPortfolioImagesByCategory(category: string): Promise<PortfolioImage[]> {
    return Array.from(this.portfolioImages.values()).filter(
      image => image.category === category
    );
  }

  async getFeaturedImages(): Promise<PortfolioImage[]> {
    return Array.from(this.portfolioImages.values()).filter(
      image => image.featured === "true"
    );
  }

  async createPortfolioImage(insertImage: InsertPortfolioImage): Promise<PortfolioImage> {
    const id = randomUUID();
    const image: PortfolioImage = {
      ...insertImage,
      id,
      description: insertImage.description || null,
      featured: insertImage.featured || null,
      createdAt: new Date(),
    };
    this.portfolioImages.set(id, image);
    return image;
  }

  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = {
      ...insertSubmission,
      id,
      createdAt: new Date(),
    };
    this.contactSubmissions.set(id, submission);
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.contactSubmissions.values());
  }
}

export const storage = new MemStorage();
