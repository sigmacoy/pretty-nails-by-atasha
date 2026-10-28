import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  basePrice: z.number().nonnegative().optional(),
  duration: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().nonnegative(),
      })
    )
    .optional(),
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
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { variants, ...data } = parsed.data;

    const service = await prisma.$transaction(async (tx) => {
      if (variants !== undefined) {
        await tx.serviceVariant.deleteMany({ where: { serviceId: params.id } });
        if (variants.length > 0) {
          await tx.serviceVariant.createMany({
            data: variants.map((v) => ({
              serviceId: params.id,
              name: v.name,
              price: v.price,
            })),
          });
        }
      }

      return tx.service.update({
        where: { id: params.id },
        data,
        include: { variants: true },
      });
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingCount = await prisma.bookingService.count({
      where: { serviceId: params.id },
    });

    if (bookingCount > 0) {
      // Soft-delete / deactivate so customer booking histories are not corrupted
      await prisma.service.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: "Service deactivated because it has linked booking history.",
      });
    }

    await prisma.serviceVariant.deleteMany({ where: { serviceId: params.id } });
    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}