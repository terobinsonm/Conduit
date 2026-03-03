import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string; productId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const product = await prisma.product.findFirst({
    where: { id: params.productId, clientId: params.clientId },
    include: {
      sizeScale: { include: { sizes: true } },
      inventory: true,
      images: true,
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
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

    // Create any new options
    if (body.newOptions && Array.isArray(body.newOptions)) {
      for (const opt of body.newOptions) {
        await prisma.option.upsert({
          where: {
            clientId_elementType_keyCode: {
              clientId: params.clientId,
              elementType: opt.elementType,
              keyCode: opt.keyCode,
            },
          },
          update: {},
          create: {
            clientId: params.clientId,
            elementType: opt.elementType,
            keyCode: opt.keyCode,
            stringValue: opt.stringValue,
            enabled: true,
          },
        });
      }
    }

    const product = await prisma.product.update({
      where: { id: params.productId },
      data: {
        productNumber: body.productNumber,
        productName: body.productName,
        shortDescription: body.shortDescription,
        longDescription: body.longDescription,
        wholesalePrice: body.wholesalePrice !== undefined ? parseFloat(body.wholesalePrice) : undefined,
        retailPrice: body.retailPrice !== undefined ? parseFloat(body.retailPrice) : undefined,
        discountedPrice: body.discountedPrice !== undefined ? parseFloat(body.discountedPrice) : undefined,
        standardCost: body.standardCost !== undefined ? parseFloat(body.standardCost) : undefined,
        seasonCode: body.seasonCode,
        colorCode: body.colorCode,
        genderCode: body.genderCode,
        categoryCode: body.categoryCode,
        divisionCode: body.divisionCode,
        brandCode: body.brandCode,
        catalogCode: body.catalogCode,
        dimensionCode: body.dimensionCode,
        marketingSeasonCode: body.marketingSeasonCode,
        styleGroupCode: body.styleGroupCode,
        productType: body.productType !== undefined ? parseInt(body.productType) : undefined,
        enabled: body.enabled,
        ignoreDiscounts: body.ignoreDiscounts,
        weight: body.weight !== undefined ? parseFloat(body.weight) : undefined,
        imageUrl: body.imageUrl,
        options: body.options !== undefined ? JSON.stringify(body.options) : undefined,
      },
    });

    // Update inventory if provided
    if (body.inventory && Array.isArray(body.inventory)) {
      // Delete existing inventory
      await prisma.inventory.deleteMany({ where: { productId: params.productId } });
      
      // Create new inventory
      if (body.inventory.length > 0) {
        await prisma.inventory.createMany({
          data: body.inventory.map((inv: any) => ({
            clientId: params.clientId,
            productId: product.id,
            productNumber: product.productNumber,
            sizeCode: inv.sizeCode,
            colorCode: product.colorCode,
            genderCode: product.genderCode,
            seasonCode: product.seasonCode,
            divisionCode: product.divisionCode,
            brandCode: product.brandCode,
            availableDate: new Date(inv.availableDate),
            availableQuantity: parseInt(inv.availableQuantity) || 0,
            replenishmentQuantity: parseInt(inv.replenishmentQuantity) || 0,
            infiniteAvailability: inv.infiniteAvailability ?? false,
          })),
        });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.product.delete({ where: { id: params.productId } });
  return NextResponse.json({ success: true });
}
