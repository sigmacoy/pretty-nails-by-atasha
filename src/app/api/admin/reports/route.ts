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
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "last-year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      monthlyRevenue,
      monthlyCustomers,
      monthlyBookings,
      monthlyStamps,
      revenueByMonth,
      topServices,
      bookingsByDay,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "PAID", verifiedAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          bookings: { some: { appointmentDate: { gte: startDate, lte: endDate } } },
        },
      }),
      prisma.booking.count({
        where: { appointmentDate: { gte: startDate, lte: endDate } },
      }),
      prisma.loyaltyStamp.count({ where: { earnedAt: { gte: startDate, lte: endDate } } }),
      prisma.$queryRaw`
        SELECT to_char("verifiedAt", 'Mon') as month, SUM(amount) as revenue, COUNT(*) as bookings
        FROM "Payment"
        WHERE status = 'PAID' AND "verifiedAt" >= ${startDate} AND "verifiedAt" <= ${endDate}
        GROUP BY to_char("verifiedAt", 'Mon'), EXTRACT(MONTH FROM "verifiedAt")
        ORDER BY EXTRACT(MONTH FROM "verifiedAt")
      `,
      prisma.$queryRaw`
        SELECT s.name, COUNT(*) as count, SUM(bs.price) as revenue
        FROM "BookingService" bs
        JOIN "Service" s ON bs."serviceId" = s.id
        JOIN "Booking" b ON bs."bookingId" = b.id
        WHERE b."appointmentDate" >= ${startDate} AND b."appointmentDate" <= ${endDate}
        GROUP BY s.name
        ORDER BY count DESC
        LIMIT 5
      `,
      prisma.$queryRaw`
        SELECT to_char("appointmentDate", 'Day') as day, COUNT(*) as count
        FROM "Booking"
        WHERE "appointmentDate" >= ${startDate} AND "appointmentDate" <= ${endDate}
        GROUP BY to_char("appointmentDate", 'Day'), EXTRACT(DOW FROM "appointmentDate")
        ORDER BY EXTRACT(DOW FROM "appointmentDate")
      `,
    ]);

    return NextResponse.json({
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      monthlyCustomers,
      monthlyBookings,
      monthlyStamps,
      revenueByMonth: revenueByMonth || [],
      topServices: topServices || [],
      bookingsByDay: bookingsByDay || [],
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}