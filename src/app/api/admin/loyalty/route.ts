import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cards = await prisma.loyaltyCard.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
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