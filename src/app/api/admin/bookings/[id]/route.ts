import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: parsed.data.status! },
      include: { user: true, loyaltyStamps: true },
    });

    // If completed, award loyalty stamps per salon policy
    if (parsed.data.status === "COMPLETED") {
      let card = await prisma.loyaltyCard.findUnique({ where: { userId: booking.userId } });
      if (!card) {
        card = await prisma.loyaltyCard.create({
          data: {
            userId: booking.userId,
            stampCount: 0,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }

      const existingStamps = await prisma.loyaltyStamp.findMany({ where: { bookingId: booking.id } });
      if (existingStamps.length === 0) {
        // 1 stamp per nail set / ₱500; ₱1,000 or more earns 2 stamps
        const stampsToAward = booking.totalPrice >= 100000 ? 2 : 1;
        for (let i = 0; i < stampsToAward; i++) {
          await prisma.loyaltyStamp.create({
            data: {
              cardId: card.id,
              bookingId: booking.id,
              source: "SERVICE",
              amount: booking.totalPrice,
            },
          });
        }
        await prisma.loyaltyCard.update({
          where: { id: card.id },
          data: {
            stampCount: card.stampCount + stampsToAward,
            lastStampAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 12 months validity
          },
        });
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.booking.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}