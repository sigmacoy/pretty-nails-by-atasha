import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Must be either the owner or admin
    if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "CANCEL") {
      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        return NextResponse.json({ error: "Booking cannot be cancelled in its current state" }, { status: 400 });
      }

      // Check cancellation policy cutoff: 8:00 PM the day before appointment
      const apptDate = new Date(booking.appointmentDate);
      const cutoff = new Date(apptDate);
      cutoff.setDate(cutoff.getDate() - 1);
      cutoff.setHours(20, 0, 0, 0); // 8:00 PM day before

      const isLateCancel = new Date() > cutoff;

      const updated = await prisma.booking.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
        },
      });

      // Update payment record if exists
      if (booking.payment) {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: isLateCancel ? "FORFEITED" : "REFUND_PENDING",
          },
        });
      }

      return NextResponse.json({
        booking: updated,
        isLateCancel,
        message: isLateCancel
          ? "Booking cancelled. Downpayment is forfeited per cancellation policy (after 8:00 PM day prior)."
          : "Booking cancelled successfully ahead of schedule.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Booking patch error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
