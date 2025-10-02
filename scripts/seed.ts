import { db } from "../server/db";
import { categories, priceTiers, projects, projectImages, orders } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories).limit(1);
    
    if (existingCategories.length > 0) {
      console.log("⚠️  Data already exists. Skipping seed to avoid duplicates.");
      console.log("   To reseed, manually clear the database first.");
      return;
    }

    console.log("📦 Seeding categories...");
    
    // Insert categories
    /*const [weddingCategory, portraitCategory, commercialCategory] = await db*/
    const [prepostWeddingCategory, weddingCategory, graduationCategory] = await db
      .insert(categories)
      .values([
        {
          name: "Pre/Post Wedding",
          slug: "prepostwed",
          description: "Timeless Elegance",
          basePrice: 5000000,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Bride Wedding Event",
          slug: "wedding",
          description: "Timeless & Memorable",
          basePrice: 5000000,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Graduation",
          slug: "graduation",
          description: "Graduation",
          basePrice: 5000000,
          isActive: true,
          sortOrder: 3,
        },
        /** {
          name: "Portrait Photography",
          slug: "portrait",
          description: "Professional portrait sessions for individuals and families",
          basePrice: 2000000,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Commercial Photography",
          slug: "commercial",
          description: "High-quality commercial and product photography",
          basePrice: 8000000,
          isActive: true,
          sortOrder: 3,
        }, */
      ])
      .returning();

    console.log("✅ Created 3 categories");

    console.log("💰 Seeding price tiers...");

    // Insert price tiers for Pre/Post Wedding
    const prepostweddingTiers = await db
      .insert(priceTiers)
      .values([
        {
          categoryId: prepostWeddingCategory.id,
          name: "Photo Only",
          price: 1250000,
          description: "1 hours coverage, Unlimited Shoots, 40 edited photos, All files Original",
          isActive: true,
          sortOrder: 1,
        },
        {
          categoryId: prepostWeddingCategory.id,
          name: "Photo & Video",
          price: 1850000,
          description: "Full Session coverage, Unlimited Shoots, 40 edited photos, 10 photo retouch & instagram layout, 1 reels portrait video, All files original",
          isActive: true,
          sortOrder: 2,
        },
      ])
      .returning();

    // Insert price tiers for Wedding
    const weddingTiers = await db
      .insert(priceTiers)
      .values([
        {
          categoryId: weddingCategory.id,
          name: "Minimalist Package",
          price: 1777000,
          description: "3 hours coverage, Unlimited Shoots, 1 Magnetic Album, Bonus Flashdisk 16GB",
          isActive: true,
          sortOrder: 1,
        },
        {
          categoryId: weddingCategory.id,
          name: "Brides Sweet Package",
          price: 3960000,
          description: "Full day coverage, Unlimited Shoots, 1 Wooden Album, 1 Frameless | large size, Bonus Flashdisk 16GB",
          isActive: true,
          sortOrder: 2,
        },
      ])
      .returning();

    // Insert price tiers for Wedding
    const graduationTiers = await db
      .insert(priceTiers)
      .values([
        {
          categoryId: graduationCategory.id,
          name: "Chill Sweet Shapes",
          price: 750000,
          description: "75 minutes coverage, 1 client, Unlimited Shoots, 25 edited photo, All original files",
          isActive: true,
          sortOrder: 1,
        },
        {
          categoryId: graduationCategory.id,
          name: "Happy Sweet Shapes",
          price: 1750000,
          description: "Half day (4-5 hours) coverage, 1 client, Unlimited Shoots (incl. w/Friends & Family), 1 reels portrait video, 32 edites photo, All original files, Bonus layout slide instagram 1 feeds",
          isActive: true,
          sortOrder: 2,
        },
      ])
      .returning();
    
    // Insert price tiers for Portrait
    const portraitTiers = await db
      .insert(priceTiers)
      .values([
        {
          categoryId: portraitCategory.id,
          name: "Standard Session",
          price: 1500000,
          description: "1 hour session, 20 edited photos, online gallery",
          isActive: true,
          sortOrder: 1,
        },
        {
          categoryId: portraitCategory.id,
          name: "Extended Session",
          price: 2500000,
          description: "2 hour session, 40 edited photos, online gallery, outfit changes",
          isActive: true,
          sortOrder: 2,
        },
      ])
      .returning();

    // Insert price tiers for Commercial
    const commercialTiers = await db
      .insert(priceTiers)
      .values([
        {
          categoryId: commercialCategory.id,
          name: "Half Day",
          price: 6000000,
          description: "4 hours coverage, 50 edited photos, commercial usage rights",
          isActive: true,
          sortOrder: 1,
        },
        {
          categoryId: commercialCategory.id,
          name: "Full Day",
          price: 10000000,
          description: "8 hours coverage, 100 edited photos, commercial usage rights, priority editing",
          isActive: true,
          sortOrder: 2,
        },
      ])
      .returning();

    console.log("✅ Created price tiers for all categories");

    console.log("📸 Seeding projects...");

    // Insert wedding project (published)
    const [weddingProject] = await db
      .insert(projects)
      .values({
        title: "Sarah & Michael's Wedding",
        slug: "sarah-michael-wedding",
        categoryId: weddingCategory.id,
        clientName: "Sarah & Michael",
        happenedAt: "2024-09-15",
        mainImageUrl: "/attached_assets/stock_images/wedding_ceremony_bri_41ca4d67.jpg",
        isPublished: true,
        driveLink: "https://drive.google.com/example-wedding",
      })
      .returning();

    // Insert wedding project images
    await db.insert(projectImages).values([
      {
        projectId: weddingProject.id,
        url: "/attached_assets/stock_images/wedding_ceremony_bri_2c5b531a.jpg",
        caption: "The ceremony",
        sortOrder: 1,
      },
      {
        projectId: weddingProject.id,
        url: "/attached_assets/stock_images/wedding_ceremony_bri_35b64858.jpg",
        caption: "First dance",
        sortOrder: 2,
      },
      {
        projectId: weddingProject.id,
        url: "/attached_assets/stock_images/wedding_ceremony_bri_ad01dd1d.jpg",
        caption: "Reception moments",
        sortOrder: 3,
      },
      {
        projectId: weddingProject.id,
        url: "/attached_assets/stock_images/wedding_ceremony_bri_aff38db9.jpg",
        caption: "Couple portraits",
        sortOrder: 4,
      },
      {
        projectId: weddingProject.id,
        url: "/attached_assets/stock_images/wedding_ceremony_bri_be334cba.jpg",
        caption: "Wedding party",
        sortOrder: 5,
      },
    ]);

    console.log("✅ Created wedding project with 5 images");

    // Insert portrait project (unpublished)
    const [portraitProject] = await db
      .insert(projects)
      .values({
        title: "Johnson Family Portrait",
        slug: "johnson-family-portrait",
        categoryId: portraitCategory.id,
        clientName: "The Johnson Family",
        happenedAt: "2024-10-01",
        mainImageUrl: "/attached_assets/stock_images/professional_portrai_03ca58cd.jpg",
        isPublished: false,
      })
      .returning();

    // Insert portrait project images
    await db.insert(projectImages).values([
      {
        projectId: portraitProject.id,
        url: "/attached_assets/stock_images/professional_portrai_2cee816f.jpg",
        caption: "Family group shot",
        sortOrder: 1,
      },
      {
        projectId: portraitProject.id,
        url: "/attached_assets/stock_images/professional_portrai_428c14cd.jpg",
        caption: "Individual portraits",
        sortOrder: 2,
      },
      {
        projectId: portraitProject.id,
        url: "/attached_assets/stock_images/professional_portrai_4a5b38db.jpg",
        caption: "Candid moments",
        sortOrder: 3,
      },
    ]);

    console.log("✅ Created portrait project with 3 images");

    console.log("📋 Seeding demo order...");

    // Insert a demo PENDING order
    const totalPrice = 5000000; // Premium Wedding Package
    const dpPercent = 30;
    const dpAmount = Math.floor((totalPrice * dpPercent) / 100);

    await db.insert(orders).values({
      categoryId: weddingCategory.id,
      priceTierId: weddingTiers[1].id, // Premium Package
      customerName: "John Doe",
      email: "john.doe@example.com",
      phone: "+62812345678",
      notes: "Looking for wedding photography coverage for December 2024. Interested in the premium package with engagement session.",
      status: "PENDING",
      totalPrice: totalPrice,
      dpPercent: dpPercent,
      dpAmount: dpAmount,
    });

    console.log("✅ Created demo order");

    console.log("🎉 Database seeding completed successfully!");
    console.log("\nSeeded data summary:");
    console.log("  - 3 categories (Wedding, Portrait, Commercial)");
    console.log("  - 7 price tiers (3 for Wedding, 2 for Portrait, 2 for Commercial)");
    console.log("  - 2 projects (1 published wedding, 1 unpublished portrait)");
    console.log("  - 8 project images (5 wedding, 3 portrait)");
    console.log("  - 1 pending order");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
