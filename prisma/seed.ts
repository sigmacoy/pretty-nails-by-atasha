import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create services
  const services = [
    {
      name: "Nail Gel",
      category: "GEL",
      description: "Classic gel nail polish with long-lasting shine",
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
      description: "Soft gel nail extensions for length and strength",
      basePrice: 40000,
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
      description: "Gel polish pedicure for beautiful toes",
      basePrice: 30000,
      duration: 180,
      variants: [
        { name: "Standard", price: 30000 },
      ],
    },
  ];

  for (const service of services) {
    const { variants, ...serviceData } = service;
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: {
        ...serviceData,
        variants: { create: variants },
      },
    });
    console.log(`✅ Created service: ${service.name}`);
  }

  // Create add-on services
  const addOns = [
    { name: "Nail Art", category: "ADDON", basePrice: 5000, duration: 30, variants: [{ name: "Per Nail", price: 5000 }] },
    { name: "French Tip", category: "ADDON", basePrice: 1000, duration: 15, variants: [{ name: "Per Nail", price: 1000 }] },
    { name: "Ombre", category: "ADDON", basePrice: 1000, duration: 20, variants: [{ name: "Per Nail", price: 1000 }] },
    { name: "Marble", category: "ADDON", basePrice: 2000, duration: 25, variants: [{ name: "Per Nail", price: 2000 }] },
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
      update: {},
      create: {
        ...addonData,
        variants: { create: variants },
      },
    });
    console.log(`✅ Created add-on: ${addon.name}`);
  }

  // Create default availability for weekends (next 3 months)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Only weekends (Saturday = 6, Sunday = 0)
    if (date.getDay() === 0 || date.getDay() === 6) {
      await prisma.availability.upsert({
        where: { date },
        update: {},
        create: {
          date,
          isAvailable: true,
          startTime: "08:00",
          endTime: "22:00",
          maxSlots: 4,
        },
      });
    }
  }
  console.log("✅ Created default weekend availability for 3 months");

  // Create default loyalty settings
  await prisma.setting.upsert({
    where: { key: "stampsRequired" },
    update: {},
    create: { key: "stampsRequired", value: "9", description: "Stamps required for free service" },
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
  console.log("✅ Created default loyalty settings");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });