import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (date) {
      where.appointmentDate = new Date(date);
    } else if (start && end) {
      where.appointmentDate = { gte: new Date(start), lte: new Date(end) };
    }
    if (status && status !== "ALL") {
      const statuses = status.split(",");
      where.status = { in: statuses };
    }
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, nickname: true, email: true, phone: true } },
        services: { include: { service: true } },
        payment: true,
      },
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
      take: limit,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}