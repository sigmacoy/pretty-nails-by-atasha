import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateEndTime } from "@/lib/utils";

const bookingSchema = z.object({
  appointmentDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().nullable().optional(),
  totalPrice: z.number().nonnegative(),
  downpayment: z.number().nonnegative().default(10000),
  notes: z.string().nullable().optional(),
  inspirationImage: z.string().nullable().optional(),
  paymentReference: z.string().nullable().optional(),
  services: z.array(z.object({
    serviceId: z.string().min(1),
    variantId: z.string().nullable().optional(),
    quantity: z.number().positive().default(1),
  })).min(1),
  addOns: z.array(z.object({
    addOnId: z.string(),
    quantity: z.number().nonnegative().optional(),
  })).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to book." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      const details = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      console.warn("Booking validation issue:", details);
      return NextResponse.json({ error: `Invalid booking input: ${details}` }, { status: 400 });
    }

    const data = parsed.data;

    // Check availability
    const bookingDate = new Date(data.appointmentDate);
    const startOfDay = new Date(data.appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const availability = await prisma.availability.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (availability && !availability.isAvailable) {
      return NextResponse.json({ error: "The owner is not available on this date (marked as holiday or break)." }, { status: 400 });
    }

    // Count existing active bookings for that date
    const existingBookings = await prisma.booking.count({
      where: {
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    const maxSlots = availability?.maxSlots || 4;
    if (existingBookings >= maxSlots) {
      return NextResponse.json({ error: "This day has reached its maximum queue capacity (4 clients max)." }, { status: 400 });
    }

    // Resolve real DB Service and Variant IDs to prevent foreign key errors
    const resolvedServices = [];
    for (const s of data.services) {
      let svc = await prisma.service.findUnique({
        where: { id: s.serviceId },
        include: { variants: true },
      });

      if (!svc) {
        const idLower = s.serviceId.toLowerCase();
        if (idLower.includes("clean")) {
          svc = await prisma.service.findFirst({ where: { name: "Nail Cleaning" }, include: { variants: true } });
        } else if (idLower.includes("gel") && !idLower.includes("ext") && !idLower.includes("ped")) {
          svc = await prisma.service.findFirst({ where: { name: "Nail Gel" }, include: { variants: true } });
        } else if (idLower.includes("ext")) {
          svc = await prisma.service.findFirst({ where: { name: "Soft Gel Extension" }, include: { variants: true } });
        } else if (idLower.includes("ped")) {
          svc = await prisma.service.findFirst({ where: { name: "Nail Gel Pedicure" }, include: { variants: true } });
        } else {
          svc = await prisma.service.findFirst({ include: { variants: true } });
        }
      }

      if (svc) {
        const variant = svc.variants.find(
          (v) => v.id === s.variantId || v.name.toLowerCase().includes((s.variantId || "").toLowerCase())
        );
        resolvedServices.push({
          serviceId: svc.id,
          variantId: variant ? variant.id : (svc.variants[0]?.id || null),
          quantity: s.quantity || 1,
          price: variant ? variant.price : svc.basePrice,
        });
      }
    }

    if (resolvedServices.length === 0) {
      const defaultSvc = await prisma.service.findFirst({ include: { variants: true } });
      if (defaultSvc) {
        resolvedServices.push({
          serviceId: defaultSvc.id,
          variantId: defaultSvc.variants[0]?.id || null,
          quantity: 1,
          price: defaultSvc.basePrice,
        });
      }
    }

    // Create booking
    const resolvedEndTime = data.endTime || calculateEndTime(data.startTime, 180);

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        appointmentDate: bookingDate,
        startTime: data.startTime,
        endTime: resolvedEndTime,
        totalPrice: data.totalPrice,
        downpayment: data.downpayment,
        notes: data.notes,
        inspirationImg: data.inspirationImage,
        status: "PENDING",
        services: {
          create: resolvedServices,
        },
      },
      include: {
        services: { include: { service: true } },
      },
    });

    // Create payment record with reference if provided
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: session.user.id,
        amount: data.downpayment,
        status: data.paymentReference ? "PAID" : "PENDING",
        method: "GCASH",
        reference: data.paymentReference || null,
        verifiedAt: data.paymentReference ? new Date() : null,
      },
    });

    return NextResponse.json({
      bookingId: booking.id,
      message: "Appointment request submitted. Awaiting owner confirmation.",
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Booking submission failed. Please try again." }, { status: 500 });
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
