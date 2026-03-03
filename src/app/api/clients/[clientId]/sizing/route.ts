import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sizeScales = await prisma.sizeScale.findMany({
    where: { clientId: params.clientId },
    include: { sizes: { orderBy: { index: "asc" } } },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(sizeScales);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await request.json();

    const sizeScale = await prisma.sizeScale.create({
      data: {
        clientId: params.clientId,
        code: body.code,
        description: body.description,
        brandCode: body.brandCode || "CC",
        divisionCode: body.divisionCode || null,
        enabled: true,
        sizes: {
          create: body.sizes.map((size: any, index: number) => ({
            code: size.code,
            description: size.description || size.code,
            index: index,
            sizeTypes: size.sizeTypes ? JSON.stringify(size.sizeTypes) : null,
            enabled: true,
          })),
        },
      },
      include: { sizes: true },
    });

    return NextResponse.json(sizeScale);
  } catch (error) {
    console.error("Error creating size scale:", error);
    return NextResponse.json({ error: "Failed to create size scale" }, { status: 500 });
  }
}
