import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const stampSchema = z.object({
  qrCode: z.string(),
});

const SHOP_QR_CODE = "prettynails-shop-qr-code";
const STAMPS_REQUIRED = 9;
const STAMP_EXPIRY_MONTHS = 12;
const STAMP_PER_AMOUNT = 50000; // ₱500 in centavos

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = stampSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
    }

    if (parsed.data.qrCode !== SHOP_QR_CODE) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
    }

    // Find the user's latest completed booking without a stamp
    const latestBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        loyaltyStamps: { none: {} },
      },
      orderBy: { appointmentDate: "desc" },
      include: {
        services: { include: { service: true } },
      },
    });

    if (!latestBooking) {
      return NextResponse.json({ error: "No eligible completed booking found" }, { status: 400 });
    }

    // Calculate stamps earned
    let stampsEarned = 0;
    let source = "SERVICE";
    let amount = 0;

    // Check if booking qualifies for service-based stamp
    const hasNailSetService = latestBooking.services.some(s =>
      s.service.category === "GEL" || s.service.category === "EXTENSION"
    );

    if (hasNailSetService) {
      stampsEarned = 1;
      source = "SERVICE";
    } else {
      // Check amount-based
      if (latestBooking.totalPrice >= STAMP_PER_AMOUNT) {
        stampsEarned = Math.floor(latestBooking.totalPrice / STAMP_PER_AMOUNT);
        source = "AMOUNT";
        amount = latestBooking.totalPrice;
      }
    }

    if (stampsEarned === 0) {
      return NextResponse.json({ error: "Booking doesn't qualify for stamps" }, { status: 400 });
    }

    // Get or create loyalty card
    let card = await prisma.loyaltyCard.findUnique({
      where: { userId: session.user.id },
    });

    if (!card) {
      card = await prisma.loyaltyCard.create({
        data: {
          userId: session.user.id,
          stampCount: 0,
          expiresAt: new Date(Date.now() + STAMP_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Check if card is expired
    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      // Reset card
      await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stampCount: 0,
          expiresAt: new Date(Date.now() + STAMP_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000),
        },
      });
      card.stampCount = 0;
    }

    // Add stamps
    const newStampCount = card.stampCount + stampsEarned;
    const newExpiryAt = new Date(Date.now() + STAMP_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stampCount: newStampCount,
          lastStampAt: new Date(),
          expiresAt: newExpiryAt,
        },
      }),
      prisma.loyaltyStamp.create({
        data: {
          cardId: card.id,
          bookingId: latestBooking.id,
          source,
          amount,
        },
      }),
    ]);

    return NextResponse.json({
      stampCount: newStampCount,
      stampsEarned,
      message: `Earned ${stampsEarned} stamp${stampsEarned > 1 ? 's' : ''}!`,
    });
  } catch (error) {
    console.error("Add stamp error:", error);
    return NextResponse.json({ error: "Failed to add stamp" }, { status: 500 });
  }
}