import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cards = await prisma.loyaltyCard.findMany({
      where: {
        user: {
          role: { not: "ADMIN" },
          email: { not: "owner@prettynails.com" },
          name: { not: { contains: "Atasha" } },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        stamps: { orderBy: { earnedAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Fetch loyalty error:", error);
    return NextResponse.json({ error: "Failed to fetch loyalty cards" }, { status: 500 });
  }
}