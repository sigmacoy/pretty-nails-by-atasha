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

    // Owner updates booking status (e.g. to CONFIRMED or COMPLETED).
    // Note: Per salon policy, owner completing an appointment does NOT auto-grant stamps.
    // The customer must scan the QR code themselves to collect their digital stamp.
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: parsed.data.status! },
      include: {
        user: true,
        services: { include: { service: true } },
        loyaltyStamps: true,
      },
    });

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

    await prisma.$transaction([
      prisma.bookingService.deleteMany({ where: { bookingId: params.id } }),
      prisma.payment.deleteMany({ where: { bookingId: params.id } }),
      prisma.loyaltyStamp.updateMany({
        where: { bookingId: params.id },
        data: { bookingId: null },
      }),
      prisma.booking.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
