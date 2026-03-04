import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string; decorationId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const decoration = await prisma.product.findFirst({
    where: {
      id: params.decorationId,
      clientId: params.clientId,
      productType: { in: [3, 4] },
    },
    include: {
      decorationConfigs: {
        include: {
          product: {
            select: { id: true, productNumber: true, productName: true },
          },
        },
      },
    },
  });

  if (!decoration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(decoration);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await request.json();

    const decoration = await prisma.product.update({
      where: { id: params.decorationId },
      data: {
        productName: body.productName,
        wholesalePrice: body.wholesalePrice !== undefined 
          ? parseFloat(body.wholesalePrice) 
          : undefined,
        retailPrice: body.retailPrice !== undefined 
          ? parseFloat(body.retailPrice) 
          : undefined,
        imageUrl: body.imageUrl,
        enabled: body.enabled,
        brandCode: body.brandCode,
        categoryCode: body.categoryCode,
        league: body.league,
        teamCode: body.teamCode,
        teamName: body.teamName,
        teamDescription: body.teamDescription,
        customerRestrictions: body.customerRestrictions
          ? JSON.stringify(body.customerRestrictions)
          : null,
      },
    });

    return NextResponse.json(decoration);
  } catch (error) {
    console.error("Error updating decoration:", error);
    return NextResponse.json({ error: "Failed to update decoration" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.product.delete({
      where: { id: params.decorationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting decoration:", error);
    return NextResponse.json({ error: "Failed to delete decoration" }, { status: 500 });
  }
}
