import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilities = await prisma.availability.findMany({
      where: {
        date: { gte: today },
      },
      select: {
        id: true,
        date: true,
        isAvailable: true,
        startTime: true,
        endTime: true,
        maxSlots: true,
        note: true,
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Fetch public availability error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
