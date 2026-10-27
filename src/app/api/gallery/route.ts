import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const gallerySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category && category !== "All") {
      const legacyMap: Record<string, string> = {
        "Nail Gel": "GEL",
        "Soft Gel Extension": "EXTENSION",
        "Pedicure": "PEDICURE",
        "Nail Art": "NAIL_ART",
      };
      const legacyVal = legacyMap[category];
      where.category = legacyVal ? { in: [category, legacyVal] } : category;
    }

    const images = await prisma.gallery.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("Fetch gallery error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = gallerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const image = await prisma.gallery.create({
      data: parsed.data,
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Create gallery error:", error);
    return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 });
  }
}