import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bookingSchema = z.object({
  appointmentDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalPrice: z.number().positive(),
  downpayment: z.number().positive(),
  notes: z.string().optional(),
  inspirationImage: z.string().optional(),
  services: z.array(z.object({
    serviceId: z.string(),
    variantId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
  addOns: z.array(z.object({
    addOnId: z.string(),
    quantity: z.number().positive(),
  })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;

    // Check availability
    const availability = await prisma.availability.findUnique({
      where: { date: new Date(data.appointmentDate) },
    });

    if (availability && !availability.isAvailable) {
      return NextResponse.json({ error: "Date not available" }, { status: 400 });
    }

    // Count existing bookings for that date
    const existingBookings = await prisma.booking.count({
      where: {
        appointmentDate: new Date(data.appointmentDate),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    const maxSlots = availability?.maxSlots || 4;
    if (existingBookings >= maxSlots) {
      return NextResponse.json({ error: "Fully booked for this date" }, { status: 400 });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        appointmentDate: new Date(data.appointmentDate),
        startTime: data.startTime,
        endTime: data.endTime,
        totalPrice: data.totalPrice,
        downpayment: data.downpayment,
        notes: data.notes,
        inspirationImg: data.inspirationImage,
        status: "PENDING",
        services: {
          create: data.services.map(s => ({
            serviceId: s.serviceId,
            variantId: s.variantId,
            quantity: s.quantity,
            price: 0, // Will be calculated from service/variant
          })),
        },
      },
      include: {
        services: { include: { service: true } },
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: session.user.id,
        amount: data.downpayment,
        status: "PENDING",
        method: "GCASH",
      },
    });

    return NextResponse.json({ bookingId: booking.id });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        services: { include: { service: true } },
        payment: true,
        loyaltyStamps: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}