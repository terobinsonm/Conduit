import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string; productId: string };
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
    let decorationId = body.decorationId;
    let placementCode = body.placement;
    let colorChoiceCode = body.colorChoice;

    // Create new logo (Type 4 product) if requested
    if (body.createNewLogo && body.newLogo) {
      const newLogo = await prisma.product.create({
        data: {
          client: { connect: { id: params.clientId } },
          productNumber: body.newLogo.productNumber,
          productName: body.newLogo.productName,
          productType: 4,
          wholesalePrice: body.newLogo.wholesalePrice || 0,
          retailPrice: body.newLogo.retailPrice || 0,
          league: body.newLogo.league || null,
          teamCode: body.newLogo.teamCode || null,
          teamName: body.newLogo.teamName || null,
          teamDescription: body.newLogo.teamDescription || null,
          enabled: true,
          brandCode: "CC",
        },
      });
      decorationId = newLogo.id;
    }

    // Create new placement option if requested
    if (body.createNewPlacement && body.newPlacement) {
      await prisma.option.upsert({
        where: {
          clientId_elementType_keyCode: {
            clientId: params.clientId,
            elementType: "Placement",
            keyCode: body.newPlacement.keyCode,
          },
        },
        update: {},
        create: {
          clientId: params.clientId,
          elementType: "Placement",
          keyCode: body.newPlacement.keyCode,
          stringValue: body.newPlacement.stringValue,
          enabled: true,
        },
      });
      placementCode = body.newPlacement.keyCode;
    }

    // Create new color choice option if requested
    if (body.createNewColorChoice && body.newColorChoice) {
      await prisma.option.upsert({
        where: {
          clientId_elementType_keyCode: {
            clientId: params.clientId,
            elementType: "ColorChoice",
            keyCode: body.newColorChoice.keyCode,
          },
        },
        update: {},
        create: {
          clientId: params.clientId,
          elementType: "ColorChoice",
          keyCode: body.newColorChoice.keyCode,
          stringValue: body.newColorChoice.stringValue,
          enabled: true,
        },
      });
      colorChoiceCode = body.newColorChoice.keyCode;
    }

    // Create the licensed configuration
    const config = await prisma.licensedConfiguration.create({
      data: {
        client: { connect: { id: params.clientId } },
        product: { connect: { id: params.productId } },
        decoration: { connect: { id: decorationId } },
        placement: placementCode,
        colorChoice: colorChoiceCode,
        finishedGoodName: body.finishedGoodName || null,
        finishedGoodImageUrl: body.finishedGoodImageUrl || null,
        finishedGoodShortDesc: body.finishedGoodShortDesc || null,
        finishedGoodLongDesc: body.finishedGoodLongDesc || null,
        wholesalePrice: body.wholesalePrice || null,
        retailPrice: body.retailPrice || null,
        dateRangeBegin: body.dateRangeBegin ? new Date(body.dateRangeBegin) : null,
        dateRangeEnd: body.dateRangeEnd ? new Date(body.dateRangeEnd) : null,
        enabled: body.enabled ?? true,
      },
      include: {
        decoration: {
          select: {
            id: true,
            productNumber: true,
            productName: true,
            imageUrl: true,
            league: true,
            teamCode: true,
            teamName: true,
            wholesalePrice: true,
          },
        },
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error creating licensed config:", error);
    return NextResponse.json({ error: "Failed to create configuration" }, { status: 500 });
  }
}
