import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalCustomers,
      todayBookings,
      pendingBookings,
      monthlyRevenue,
      monthlyCustomers,
      stampsThisMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.booking.count({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.payment.aggregate({
        where: {
          status: "PAID",
          verifiedAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          bookings: { some: { appointmentDate: { gte: startOfMonth } } },
        },
      }),
      prisma.loyaltyStamp.count({
        where: { earnedAt: { gte: startOfMonth } },
      }),
    ]);

    return NextResponse.json({
      totalCustomers,
      todayBookings,
      pendingBookings,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      monthlyCustomers,
      stampsThisMonth,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}