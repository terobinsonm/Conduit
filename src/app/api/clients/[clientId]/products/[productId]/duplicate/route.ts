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
    const { newProductNumber } = body;

    if (!newProductNumber) {
      return NextResponse.json({ error: "New product number is required" }, { status: 400 });
    }

    // Check if new product number exists
    const existing = await prisma.product.findFirst({
      where: { clientId: params.clientId, productNumber: newProductNumber },
    });
    if (existing) {
      return NextResponse.json({ error: "Product number already exists" }, { status: 400 });
    }

    // Get original product
    const original = await prisma.product.findFirst({
      where: { id: params.productId, clientId: params.clientId },
    });
    if (!original) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create duplicate
    const duplicate = await prisma.product.create({
      data: {
        clientId: params.clientId,
        productNumber: newProductNumber,
        productName: original.productName ? `${original.productName} (Copy)` : null,
        shortDescription: original.shortDescription,
        longDescription: original.longDescription,
        wholesalePrice: original.wholesalePrice,
        retailPrice: original.retailPrice,
        discountedPrice: original.discountedPrice,
        standardCost: original.standardCost,
        seasonCode: original.seasonCode,
        colorCode: original.colorCode,
        genderCode: original.genderCode,
        categoryCode: original.categoryCode,
        divisionCode: original.divisionCode,
        brandCode: original.brandCode,
        catalogCode: original.catalogCode,
        dimensionCode: original.dimensionCode,
        marketingSeasonCode: original.marketingSeasonCode,
        styleGroupCode: original.styleGroupCode,
        productType: original.productType,
        enabled: false, // Start as inactive
        ignoreDiscounts: original.ignoreDiscounts,
        weight: original.weight,
        options: original.options,
        // Don't copy imageUrl - user should upload new image
      },
    });

    return NextResponse.json(duplicate);
  } catch (error) {
    console.error("Error duplicating product:", error);
    return NextResponse.json({ error: "Failed to duplicate product" }, { status: 500 });
  }
}
