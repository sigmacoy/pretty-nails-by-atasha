import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const availabilitySchema = z.object({
  date: z.string(),
  isAvailable: z.boolean(),
  startTime: z.string().default("08:00"),
  endTime: z.string().default("22:00"),
  maxSlots: z.number().min(1).max(8).default(4),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: any = {};
    if (start && end) {
      where.date = { gte: new Date(start), lte: new Date(end) };
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Fetch availability error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = availabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const availability = await prisma.availability.upsert({
      where: { date: new Date(parsed.data.date) },
      update: {
        isAvailable: parsed.data.isAvailable,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        maxSlots: parsed.data.maxSlots,
        note: parsed.data.note,
      },
      create: {
        date: new Date(parsed.data.date),
        isAvailable: parsed.data.isAvailable,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        maxSlots: parsed.data.maxSlots,
        note: parsed.data.note,
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Create availability error:", error);
    return NextResponse.json({ error: "Failed to create availability" }, { status: 500 });
  }
}