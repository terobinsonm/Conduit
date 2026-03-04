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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "insignia" | "licensed" | null

  const where: Record<string, unknown> = {
    clientId: params.clientId,
    productType: { in: [3, 4] },
  };

  if (type === "insignia") {
    where.productType = 3;
  } else if (type === "licensed") {
    where.productType = 4;
  }

  const decorations = await prisma.product.findMany({
    where,
    include: {
      _count: {
        select: { decorationConfigs: true },
      },
    },
    orderBy: { productName: "asc" },
  });

  return NextResponse.json(decorations);
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

    // Validate product type
    if (![3, 4].includes(body.productType)) {
      return NextResponse.json(
        { error: "Product type must be 3 (Insignia) or 4 (Licensed)" },
        { status: 400 }
      );
    }

    // Check for existing product number
    const existing = await prisma.product.findFirst({
      where: {
        clientId: params.clientId,
        productNumber: body.productNumber,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Product number already exists" },
        { status: 400 }
      );
    }

    const decoration = await prisma.product.create({
      data: {
        client: { connect: { id: params.clientId } },
        productNumber: body.productNumber,
        productName: body.productName,
        productType: body.productType,
        wholesalePrice: parseFloat(body.wholesalePrice) || 0,
        retailPrice: parseFloat(body.retailPrice) || 0,
        imageUrl: body.imageUrl || null,
        enabled: body.enabled ?? true,
        brandCode: body.brandCode || "CC",
        categoryCode: body.categoryCode || null,
        // Licensed-specific fields
        league: body.league || null,
        teamCode: body.teamCode || null,
        teamName: body.teamName || null,
        teamDescription: body.teamDescription || null,
        // Customer restrictions
        customerRestrictions: body.customerRestrictions
          ? JSON.stringify(body.customerRestrictions)
          : null,
      },
    });

    return NextResponse.json(decoration);
  } catch (error) {
    console.error("Error creating decoration:", error);
    return NextResponse.json({ error: "Failed to create decoration" }, { status: 500 });
  }
}
