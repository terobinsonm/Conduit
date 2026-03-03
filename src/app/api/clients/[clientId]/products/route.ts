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

  const products = await prisma.product.findMany({
    where: { clientId: params.clientId },
    include: {
      sizeScale: true,
      _count: { select: { inventory: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
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

    // Check for duplicate product number
    const existing = await prisma.product.findFirst({
      where: { clientId: params.clientId, productNumber: body.productNumber },
    });
    if (existing) {
      return NextResponse.json({ error: "Product number already exists" }, { status: 400 });
    }

    // Create any new options that were specified
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

    // Create the product
    const product = await prisma.product.create({
      data: {
        clientId: params.clientId,
        productNumber: body.productNumber,
        productName: body.productName || null,
        shortDescription: body.shortDescription || null,
        longDescription: body.longDescription || null,
        wholesalePrice: parseFloat(body.wholesalePrice) || 0,
        retailPrice: parseFloat(body.retailPrice) || 0,
        discountedPrice: parseFloat(body.discountedPrice) || 0,
        standardCost: parseFloat(body.standardCost) || 0,
        seasonCode: body.seasonCode || null,
        colorCode: body.colorCode || null,
        genderCode: body.genderCode || null,
        categoryCode: body.categoryCode || null,
        divisionCode: body.divisionCode || null,
        brandCode: body.brandCode || "CC",
        catalogCode: body.catalogCode || null,
        dimensionCode: body.dimensionCode || null,
        marketingSeasonCode: body.marketingSeasonCode || null,
        styleGroupCode: body.styleGroupCode || null,
        productType: parseInt(body.productType) || 2,
        enabled: body.enabled ?? true,
        ignoreDiscounts: body.ignoreDiscounts ?? false,
        weight: parseFloat(body.weight) || 0,
        imageUrl: body.imageUrl || null,
        options: body.options ? JSON.stringify(body.options) : null,
      },
    });

    // Create inventory records if provided
    if (body.inventory && Array.isArray(body.inventory)) {
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

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
