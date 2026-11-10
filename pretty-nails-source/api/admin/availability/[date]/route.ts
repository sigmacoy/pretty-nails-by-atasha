import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: { date: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.availability.delete({ where: { date: new Date(params.date) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete availability error:", error);
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 });
  }
}