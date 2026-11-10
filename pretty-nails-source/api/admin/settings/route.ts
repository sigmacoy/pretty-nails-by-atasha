import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const settingsSchema = z.object({
  stampsRequired: z.number().min(1).default(9),
  stampExpiryMonths: z.number().min(1).default(12),
  stampPerService: z.boolean().default(true),
  stampPerAmount: z.number().min(100).default(50000),
});

const DEFAULT_SETTINGS = {
  stampsRequired: 9,
  stampExpiryMonths: 12,
  stampPerService: true,
  stampPerAmount: 50000,
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["stampsRequired", "stampExpiryMonths", "stampPerService", "stampPerAmount"] } },
    });

    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    return NextResponse.json({
      stampsRequired: parseInt(settingsMap.stampsRequired || String(DEFAULT_SETTINGS.stampsRequired)),
      stampExpiryMonths: parseInt(settingsMap.stampExpiryMonths || String(DEFAULT_SETTINGS.stampExpiryMonths)),
      stampPerService: settingsMap.stampPerService === "true" || DEFAULT_SETTINGS.stampPerService,
      stampPerAmount: parseInt(settingsMap.stampPerAmount || String(DEFAULT_SETTINGS.stampPerAmount)),
    });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await Promise.all(
      Object.entries(parsed.data).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value), description: `Loyalty setting: ${key}` },
        })
      )
    );

    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}