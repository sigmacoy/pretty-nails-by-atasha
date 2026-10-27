import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[INFO] Seeding database...");

  // 1. Create Services matching exact price list
  const services = [
    {
      name: "Nail Gel",
      category: "GEL",
      description: "Classic gel nail polish with long-lasting shine and durability",
      basePrice: 30000, // ₱300 in centavos
      duration: 180, // 3 hours
      variants: [
        { name: "Small", price: 30000 },
        { name: "Medium", price: 35000 },
        { name: "Long", price: 40000 },
      ],
    },
    {
      name: "Soft Gel Extension",
      category: "EXTENSION",
      description: "Soft gel nail extensions for premium length, strength and style",
      basePrice: 40000, // ₱400
      duration: 240, // 4 hours
      variants: [
        { name: "Small", price: 40000 },
        { name: "Medium", price: 45000 },
        { name: "Long", price: 50000 },
      ],
    },
    {
      name: "Nail Gel Pedicure",
      category: "PEDICURE",
      description: "Gel polish pedicure for beautiful, healthy, and shining toes",
      basePrice: 30000, // ₱300
      duration: 180,
      variants: [
        { name: "Standard", price: 30000 },
      ],
    },
  ];

  for (const service of services) {
    const { variants, ...serviceData } = service;
    const upserted = await prisma.service.upsert({
      where: { name: service.name },
      update: serviceData,
      create: {
        ...serviceData,
        variants: { create: variants },
      },
    });
    console.log(`[SUCCESS] Service ready: ${upserted.name}`);
  }

  // 2. Create Add-on Services (Per Nail)
  const addOns = [
    { name: "Nail Art", category: "ADDON", basePrice: 5000, duration: 30, variants: [{ name: "Per Nail (50-100)", price: 5000 }] },
    { name: "French Tip", category: "ADDON", basePrice: 1000, duration: 15, variants: [{ name: "Per Nail", price: 1000 }] },
    { name: "Ombre", category: "ADDON", basePrice: 1000, duration: 20, variants: [{ name: "Per Nail", price: 1000 }] },
    { name: "Marble", category: "ADDON", basePrice: 2000, duration: 25, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "Polka Dots", category: "ADDON", basePrice: 1000, duration: 15, variants: [{ name: "Per Nail", price: 1000 }] },
    { name: "Gold/Silver Flakes", category: "ADDON", basePrice: 2000, duration: 20, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "Cat Eye", category: "ADDON", basePrice: 2000, duration: 20, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "Glitters", category: "ADDON", basePrice: 2000, duration: 15, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "Metallic", category: "ADDON", basePrice: 2000, duration: 20, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "Embossed Flower", category: "ADDON", basePrice: 3000, duration: 30, variants: [{ name: "Per Nail", price: 3000 }] },
    { name: "Embossed", category: "ADDON", basePrice: 2000, duration: 20, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "3D Effect", category: "ADDON", basePrice: 3000, duration: 35, variants: [{ name: "Per Nail", price: 3000 }] },
    { name: "3D Mermaid/Shell", category: "ADDON", basePrice: 3000, duration: 40, variants: [{ name: "Per Nail", price: 3000 }] },
    { name: "Big Stone", category: "ADDON", basePrice: 2000, duration: 15, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "Pearl", category: "ADDON", basePrice: 500, duration: 10, variants: [{ name: "Per Nail", price: 500 }] },
    { name: "Rhinestone", category: "ADDON", basePrice: 500, duration: 10, variants: [{ name: "Per Nail", price: 500 }] },
    { name: "Blooming Gel", category: "ADDON", basePrice: 2000, duration: 20, variants: [{ name: "Per Nail", price: 2000 }] },
    { name: "Matte Coat", category: "ADDON", basePrice: 1000, duration: 10, variants: [{ name: "Per Nail", price: 1000 }] },
  ];

  for (const addon of addOns) {
    const { variants, ...addonData } = addon;
    await prisma.service.upsert({
      where: { name: addon.name },
      update: addonData,
      create: {
        ...addonData,
        variants: { create: variants },
      },
    });
  }
  console.log("[SUCCESS] Add-on services configured");

  // 3. Seed Demo Users
  const ownerHashed = await bcrypt.hash("owner123", 10);
  const clientHashed = await bcrypt.hash("client123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@prettynails.com" },
    update: { role: "ADMIN", password: ownerHashed, name: "Ma'am Atasha (Owner)", phone: "0977 284 6167" },
    create: {
      email: "owner@prettynails.com",
      password: ownerHashed,
      role: "ADMIN",
      name: "Ma'am Atasha (Owner)",
      phone: "0977 284 6167",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@prettynails.com" },
    update: { role: "CUSTOMER", password: clientHashed, name: "Maria Santos", nickname: "Loyal Maria", phone: "0917 123 4567" },
    create: {
      email: "client@prettynails.com",
      password: clientHashed,
      role: "CUSTOMER",
      name: "Maria Santos",
      nickname: "Loyal Maria",
      phone: "0917 123 4567",
    },
  });

  // Client loyalty card with 5 stamps
  await prisma.loyaltyCard.upsert({
    where: { userId: client.id },
    update: { stampCount: 5, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: client.id,
      stampCount: 5,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed customer notes
  await prisma.customerNote.create({
    data: {
      userId: client.id,
      adminId: owner.id,
      content: "Loves soft pink nails with subtle ombre or pearls. Very punctual.",
      nickname: "Loyal Maria",
    },
  }).catch(() => {});

  // 4. Default Weekend Availability (90 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    if (d.getDay() === 0 || d.getDay() === 6) {
      await prisma.availability.upsert({
        where: { date: d },
        update: {},
        create: {
          date: d,
          isAvailable: true,
          startTime: "08:00",
          endTime: "22:00",
          maxSlots: 4,
        },
      });
    }
  }

  // 5. Settings
  await prisma.setting.upsert({
    where: { key: "stampsRequired" },
    update: {},
    create: { key: "stampsRequired", value: "9", description: "Stamps required for free nail set" },
  });
  await prisma.setting.upsert({
    where: { key: "stampExpiryMonths" },
    update: {},
    create: { key: "stampExpiryMonths", value: "12", description: "Stamp expiry in months" },
  });
  await prisma.setting.upsert({
    where: { key: "stampPerService" },
    update: {},
    create: { key: "stampPerService", value: "true", description: "1 stamp per nail set service" },
  });
  await prisma.setting.upsert({
    where: { key: "stampPerAmount" },
    update: {},
    create: { key: "stampPerAmount", value: "50000", description: "1 stamp per ₱500 spent (in centavos)" },
  });

  // 6. Seed Sample Gallery
  const sampleGallery = [
    {
      title: "Pink Ombre Soft Gel",
      description: "Delicate pink to white gradient with high-shine top coat",
      imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
      category: "GEL",
    },
    {
      title: "French Tip with Pearl Accents",
      description: "Classic clean French tips adorned with dainty freshwater pearl details",
      imageUrl: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&auto=format&fit=crop&q=80",
      category: "NAIL_ART",
    },
    {
      title: "Cat Eye Velvet Blush",
      description: "Magnetic cat eye shimmer in romantic blush rose",
      imageUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&auto=format&fit=crop&q=80",
      category: "EXTENSION",
    },
    {
      title: "3D Floral Embossed Art",
      description: "Handcrafted 3D acrylic petals on baby pink soft gel base",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      category: "NAIL_ART",
    },
    {
      title: "Pastel Pedicure Perfection",
      description: "Soothing neutral gel pedicure with glossy top seal",
      imageUrl: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80",
      category: "PEDICURE",
    },
  ];

  for (const img of sampleGallery) {
    const existing = await prisma.gallery.findFirst({ where: { title: img.title } });
    if (!existing) {
      await prisma.gallery.create({ data: img });
    }
  }
  console.log("[SUCCESS] Gallery items loaded");

  // 7. Seed Sample Bookings (Queue demonstration)
  // Find upcoming Saturday
  const nextSat = new Date(today);
  const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
  nextSat.setDate(today.getDate() + daysUntilSat);
  nextSat.setHours(0, 0, 0, 0);

  const nailGelSvc = await prisma.service.findFirst({ where: { name: "Nail Gel" }, include: { variants: true } });
  const extSvc = await prisma.service.findFirst({ where: { name: "Soft Gel Extension" }, include: { variants: true } });
  const pedSvc = await prisma.service.findFirst({ where: { name: "Nail Gel Pedicure" }, include: { variants: true } });

  if (nailGelSvc && extSvc && pedSvc) {
    // Clear previous sample bookings for that date to avoid duplicate runs
    const existingB = await prisma.booking.findMany({ where: { appointmentDate: nextSat } });
    if (existingB.length === 0) {
      // Booking 1 (Queue #1): 10:00 AM - 1:00 PM (Confirmed)
      const b1 = await prisma.booking.create({
        data: {
          userId: client.id,
          appointmentDate: nextSat,
          startTime: "10:00",
          endTime: "13:00",
          status: "CONFIRMED",
          totalPrice: 35000,
          downpayment: 10000,
          notes: "Nail gel medium with glossy finish.",
          services: {
            create: [
              {
                serviceId: nailGelSvc.id,
                variantId: nailGelSvc.variants[1]?.id,
                quantity: 1,
                price: 35000,
              },
            ],
          },
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: b1.id,
          userId: client.id,
          amount: 10000,
          status: "PAID",
          method: "GCASH",
          reference: "GCASH-982143001",
          verifiedAt: new Date(),
        },
      });

      // Booking 2 (Queue #2): 13:00 - 17:00 (Pending, 4-hour extension)
      const b2 = await prisma.booking.create({
        data: {
          userId: client.id,
          appointmentDate: nextSat,
          startTime: "13:00",
          endTime: "17:00",
          status: "PENDING",
          totalPrice: 50000,
          downpayment: 10000,
          notes: "Soft gel extension long. Requesting French tips.",
          services: {
            create: [
              {
                serviceId: extSvc.id,
                variantId: extSvc.variants[2]?.id,
                quantity: 1,
                price: 50000,
              },
            ],
          },
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: b2.id,
          userId: client.id,
          amount: 10000,
          status: "PAID",
          method: "GCASH",
          reference: "GCASH-881204912",
        },
      });

      // Booking 3 (Queue #3): 14:00 - 17:00 (Pending - overlaps with Booking 2! Illustrates conflict queue system)
      await prisma.booking.create({
        data: {
          userId: client.id,
          appointmentDate: nextSat,
          startTime: "14:00",
          endTime: "17:00",
          status: "PENDING",
          totalPrice: 30000,
          downpayment: 10000,
          notes: "Pedicure appointment. Notice: potential time overlap with 13:00-17:00 slot.",
          services: {
            create: [
              {
                serviceId: pedSvc.id,
                variantId: pedSvc.variants[0]?.id,
                quantity: 1,
                price: 30000,
              },
            ],
          },
        },
      });

      console.log(`[SUCCESS] Sample queue bookings created for ${nextSat.toDateString()}`);
    }
  }

  console.log("[DONE] Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error("[ERROR] Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
