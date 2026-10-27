import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "this-month";

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case "this-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last-month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case "this-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "last-year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      payments,
      bookings,
      monthlyCustomers,
      monthlyStamps,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.booking.findMany({
        where: {
          appointmentDate: { gte: startDate, lte: endDate },
        },
        include: {
          services: {
            include: {
              service: true,
            },
          },
          payment: true,
        },
      }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          bookings: { some: { appointmentDate: { gte: startDate, lte: endDate } } },
        },
      }),
      prisma.loyaltyStamp.count({
        where: { earnedAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    const monthlyRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    // Group revenue by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap: Record<string, { month: string; revenue: number; bookings: number }> = {};

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const mName = monthNames[d.getMonth()];
      monthMap[mName] = { month: mName, revenue: 0, bookings: 0 };
    }

    // Add current period payments/bookings to monthMap
    payments.forEach(p => {
      const mName = monthNames[new Date(p.createdAt).getMonth()];
      if (monthMap[mName]) {
        monthMap[mName].revenue += p.amount;
      }
    });

    bookings.forEach(b => {
      const mName = monthNames[new Date(b.appointmentDate).getMonth()];
      if (monthMap[mName]) {
        monthMap[mName].bookings += 1;
      }
    });

    const revenueByMonth = Object.values(monthMap);

    // Top services
    const serviceCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    bookings.forEach(b => {
      b.services.forEach(bs => {
        const name = bs.service?.name || "Service";
        if (!serviceCounts[name]) {
          serviceCounts[name] = { name, count: 0, revenue: 0 };
        }
        serviceCounts[name].count += bs.quantity;
        serviceCounts[name].revenue += bs.price || (b.totalPrice / (b.services.length || 1));
      });
    });

    const topServices = Object.values(serviceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Bookings by day of week
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts: Record<string, number> = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    bookings.forEach(b => {
      const dayName = daysOfWeek[new Date(b.appointmentDate).getDay()];
      if (dayCounts[dayName] !== undefined) {
        dayCounts[dayName] += 1;
      }
    });

    const bookingsByDay = daysOfWeek.map(day => ({
      day,
      count: dayCounts[day],
    }));

    return NextResponse.json({
      monthlyRevenue,
      monthlyCustomers,
      monthlyBookings: bookings.length,
      monthlyStamps,
      revenueByMonth,
      topServices,
      bookingsByDay,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
