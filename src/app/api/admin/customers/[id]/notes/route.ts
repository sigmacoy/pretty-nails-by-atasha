import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const noteSchema = z.object({
  content: z.string().min(1),
  nickname: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Update customer nickname if provided
    if (parsed.data.nickname) {
      await prisma.user.update({
        where: { id: params.id },
        data: { name: parsed.data.nickname }, // Using name field for nickname display
      });
    }

    const note = await prisma.customerNote.create({
      data: {
        userId: params.id,
        adminId: session.user.id,
        content: parsed.data.content,
        nickname: parsed.data.nickname,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}