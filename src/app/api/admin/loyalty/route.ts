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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cardId, action, amount } = await req.json();
    if (!cardId) {
      return NextResponse.json({ error: "Card ID required" }, { status: 400 });
    }

    const card = await prisma.loyaltyCard.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Loyalty card not found" }, { status: 404 });
    }

    let updated;
    if (action === "ADD_STAMP") {
      const newCount = card.stampCount + (amount || 1);
      await prisma.loyaltyStamp.create({
        data: {
          cardId: card.id,
          source: "ADMIN_AWARDED",
          amount: 50000,
        },
      });
      updated = await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stampCount: newCount,
          lastStampAt: new Date(),
        },
      });
    } else if (action === "RESET") {
      await prisma.loyaltyStamp.deleteMany({ where: { cardId: card.id } });
      updated = await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stampCount: 0,
          lastStampAt: null,
        },
      });
    } else if (action === "REDEEM") {
      const newCount = Math.max(0, card.stampCount - 9);
      updated = await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stampCount: newCount,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Loyalty action error:", error);
    return NextResponse.json({ error: "Failed to update loyalty card" }, { status: 500 });
  }
}