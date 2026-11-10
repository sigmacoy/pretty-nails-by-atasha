import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "ADMIN" || session.user.email === "owner@prettynails.com") {
      return NextResponse.json({
        stampCount: 0,
        lastStampAt: null,
        expiresAt: null,
        isExpired: false,
        stamps: [],
        isAdmin: true,
      });
    }

    let card = await prisma.loyaltyCard.findUnique({
      where: { userId: session.user.id },
      include: {
        stamps: { orderBy: { earnedAt: "desc" } },
      },
    });

    if (!card) {
      // Create card if doesn't exist
      card = await prisma.loyaltyCard.create({
        data: {
          userId: session.user.id,
          stampCount: 0,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        include: { stamps: true },
      });
    }

    // Check expiry
    const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();

    return NextResponse.json({
      stampCount: card.stampCount,
      lastStampAt: card.lastStampAt,
      expiresAt: card.expiresAt,
      isExpired,
      stamps: card.stamps.map(s => ({
        earnedAt: s.earnedAt,
        source: s.source,
        amount: s.amount,
      })),
    });
  } catch (error) {
    console.error("Fetch loyalty card error:", error);
    return NextResponse.json({ error: "Failed to fetch loyalty card" }, { status: 500 });
  }
}