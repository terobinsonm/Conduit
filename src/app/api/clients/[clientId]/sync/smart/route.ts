import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  syncToRepSpark,
  transformOptions,
  transformSizing,
  transformProducts,
  transformInventory,
} from "@/lib/repspark";

interface SmartSyncResult {
  step: string;
  success: boolean;
  recordCount?: number;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const results: SmartSyncResult[] = [];

  try {
    const { environment } = await request.json();

    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // Step 1: Get all products
    const products = await prisma.product.findMany({
      where: { clientId: params.clientId },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No products to sync",
        results,
      });
    }

    // Step 2: Extract and create Options from products
    const optionsToCreate: { elementType: string; keyCode: string; stringValue: string }[] = [];

    for (const product of products) {
      // Extract seasons (comma-separated)
      if (product.seasonCode) {
        const seasons = product.seasonCode.split(",").filter(Boolean);
        for (const season of seasons) {
          const trimmed = season.trim();
          if (!optionsToCreate.some((o) => o.elementType === "Season" && o.keyCode === trimmed)) {
            optionsToCreate.push({ elementType: "Season", keyCode: trimmed, stringValue: trimmed });
          }
        }
      }

      // Extract color
      if (product.colorCode) {
        if (!optionsToCreate.some((o) => o.elementType === "Color" && o.keyCode === product.colorCode)) {
          optionsToCreate.push({ elementType: "Color", keyCode: product.colorCode, stringValue: product.colorCode });
        }
      }

      // Extract gender
      if (product.genderCode) {
        if (!optionsToCreate.some((o) => o.elementType === "Gender" && o.keyCode === product.genderCode)) {
          optionsToCreate.push({ elementType: "Gender", keyCode: product.genderCode, stringValue: product.genderCode });
        }
      }

      // Extract category
      if (product.categoryCode) {
        if (!optionsToCreate.some((o) => o.elementType === "ProductCategory" && o.keyCode === product.categoryCode)) {
          optionsToCreate.push({ elementType: "ProductCategory", keyCode: product.categoryCode, stringValue: product.categoryCode });
        }
      }

      // Extract division
      if (product.divisionCode) {
        if (!optionsToCreate.some((o) => o.elementType === "Division" && o.keyCode === product.divisionCode)) {
          optionsToCreate.push({ elementType: "Division", keyCode: product.divisionCode, stringValue: product.divisionCode });
        }
      }
    }

    // Upsert options
    for (const opt of optionsToCreate) {
      await prisma.option.upsert({
        where: {
          clientId_elementType_keyCode: {
            clientId: params.clientId,
            elementType: opt.elementType,
            keyCode: opt.keyCode,
          },
        },
        update: { stringValue: opt.stringValue },
        create: {
          clientId: params.clientId,
          elementType: opt.elementType,
          keyCode: opt.keyCode,
          stringValue: opt.stringValue,
          enabled: true,
        },
      });
    }

    // Sync options to RepSpark
    const allOptions = await prisma.option.findMany({
      where: { clientId: params.clientId },
    });
    const optionsPayload = transformOptions(allOptions);
    const optionsResult = await syncToRepSpark(client, environment, "option", optionsPayload);
    results.push({
      step: "Options",
      success: optionsResult.success,
      recordCount: optionsResult.recordCount,
      error: optionsResult.error,
    });

    if (!optionsResult.success) {
      return NextResponse.json({ success: false, results, error: "Options sync failed" });
    }

    // Step 3: Extract and create Size Scales from product options
    const sizeScalesToCreate: Map<string, { code: string; sizes: string[] }> = new Map();

    for (const product of products) {
      if (!product.options) continue;

      try {
        const productOptions = JSON.parse(product.options) as { name: string; values: string[]; isProductLevel: boolean }[];
        const sizeOptions = productOptions.filter((o) => !o.isProductLevel);

        if (sizeOptions.length === 0) continue;

        // Generate a size scale code based on the option values
        const allSizes = sizeOptions.flatMap((o) => o.values);
        const scaleCode = `SCALE-${product.productNumber}`;

        if (!sizeScalesToCreate.has(scaleCode)) {
          sizeScalesToCreate.set(scaleCode, { code: scaleCode, sizes: allSizes });
        }

        // Update product with size scale reference
        await prisma.product.update({
          where: { id: product.id },
          data: { sizeScaleId: null }, // Will link after creation
        });
      } catch {
        // Invalid JSON, skip
      }
    }

    // Create size scales and sizes
for (const [code, data] of Array.from(sizeScalesToCreate)) {
      const sizeScale = await prisma.sizeScale.upsert({
        where: {
          clientId_code: {
            clientId: params.clientId,
            code: data.code,
          },
        },
        update: { description: data.code },
        create: {
          clientId: params.clientId,
          code: data.code,
          description: data.code,
          brandCode: client.slug.toUpperCase().slice(0, 2) || "CC",
          enabled: true,
        },
      });

      // Create sizes
      for (let i = 0; i < data.sizes.length; i++) {
        await prisma.size.upsert({
          where: {
            sizeScaleId_code: {
              sizeScaleId: sizeScale.id,
              code: data.sizes[i],
            },
          },
          update: { description: data.sizes[i], index: i },
          create: {
            sizeScaleId: sizeScale.id,
            code: data.sizes[i],
            description: data.sizes[i],
            index: i,
            enabled: true,
          },
        });
      }

      // Link products that use this scale
      for (const product of products) {
        if (!product.options) continue;
        const scaleCodeForProduct = `SCALE-${product.productNumber}`;
        if (scaleCodeForProduct === code) {
          await prisma.product.update({
            where: { id: product.id },
            data: { sizeScaleId: sizeScale.id },
          });
        }
      }
    }

    // Sync sizing to RepSpark
    const allSizeScales = await prisma.sizeScale.findMany({
      where: { clientId: params.clientId },
      include: { sizes: true },
    });
    const sizingPayload = transformSizing(allSizeScales);
    const sizingResult = await syncToRepSpark(client, environment, "sizing", sizingPayload);
    results.push({
      step: "Sizing",
      success: sizingResult.success,
      recordCount: sizingResult.recordCount,
      error: sizingResult.error,
    });

    if (!sizingResult.success) {
      return NextResponse.json({ success: false, results, error: "Sizing sync failed" });
    }

    // Step 4: Sync products with size scale codes
    const updatedProducts = await prisma.product.findMany({
      where: { clientId: params.clientId },
      include: { sizeScale: true },
    });

    const productsPayload = updatedProducts.map((p) => {
      const base: Record<string, unknown> = {
        ProductNumber: p.productNumber,
        WholesalePrice: p.wholesalePrice,
        RetailPrice: p.retailPrice,
        DiscountedPrice: p.discountedPrice,
        ProductType: p.productType,
        Enabled: p.enabled,
        IgnoreDiscounts: p.ignoreDiscounts,
        AssociationsPerGroup: p.associationsPerGroup,
        Weight: p.weight,
        StandardCost: p.standardCost,
        BrandCode: p.brandCode,
      };

      if (p.productName) base.ProductName = p.productName;
      if (p.longDescription) base.LongDescription = p.longDescription;
      if (p.shortDescription) base.ShortDescription = p.shortDescription;
      if (p.categoryCode) base.CategoryCode = p.categoryCode;
      if (p.colorCode) base.ColorCode = p.colorCode;
      if (p.genderCode) base.GenderCode = p.genderCode;
      if (p.seasonCode) base.SeasonCode = p.seasonCode.split(",")[0]; // Use first season
      if (p.divisionCode) base.DivisionCode = p.divisionCode;
      if (p.sizeScale) base.SizeScaleCode = p.sizeScale.code;
      if (p.catalogCode) base.CatalogCode = p.catalogCode;
      if (p.dimensionCode) base.DimensionCode = p.dimensionCode;
      if (p.marketingSeasonCode) base.MarketingSeasonCode = p.marketingSeasonCode;
      if (p.styleGroupCode) base.StyleGroupCode = p.styleGroupCode;
      if (p.imageUrl) base.ImageURL = p.imageUrl;

      return base;
    });

    const productsResult = await syncToRepSpark(client, environment, "product", productsPayload);
    results.push({
      step: "Products",
      success: productsResult.success,
      recordCount: productsResult.recordCount,
      error: productsResult.error,
    });

    if (!productsResult.success) {
      return NextResponse.json({ success: false, results, error: "Products sync failed" });
    }

    // Step 5: Generate and sync inventory
    const inventoryRecords: {
      productId: string;
      productNumber: string;
      sizeCode: string;
      colorCode?: string;
      genderCode?: string;
      seasonCode?: string;
      divisionCode?: string;
      brandCode: string;
      availableDate: Date;
      availableQuantity: number;
    }[] = [];

    for (const product of updatedProducts) {
      if (!product.options) continue;

      try {
        const productOptions = JSON.parse(product.options) as { name: string; values: string[]; isProductLevel: boolean }[];
        const sizeOptions = productOptions.filter((o) => !o.isProductLevel);

        if (sizeOptions.length === 0) continue;

        // Generate cartesian product of all size options
        function cartesian(arrays: string[][]): string[][] {
          if (arrays.length === 0) return [[]];
          const [first, ...rest] = arrays;
          const restCartesian = cartesian(rest);
          return first.flatMap((val) => restCartesian.map((r) => [val, ...r]));
        }

        const valueArrays = sizeOptions.map((o) => o.values);
        const combinations = cartesian(valueArrays);

        for (const combo of combinations) {
          const sizeCode = combo.join(" / ");

          // Upsert inventory record
          await prisma.inventory.upsert({
            where: {
              clientId_productId_sizeCode_availableDate: {
                clientId: params.clientId,
                productId: product.id,
                sizeCode,
                availableDate: new Date(),
              },
            },
            update: {},
            create: {
              clientId: params.clientId,
              productId: product.id,
              productNumber: product.productNumber,
              sizeCode,
              colorCode: product.colorCode,
              genderCode: product.genderCode,
              seasonCode: product.seasonCode?.split(",")[0],
              divisionCode: product.divisionCode,
              brandCode: product.brandCode,
              availableDate: new Date(),
              availableQuantity: 0,
              replenishmentQuantity: 0,
              infiniteAvailability: true,
            },
          });

          inventoryRecords.push({
            productId: product.id,
            productNumber: product.productNumber,
            sizeCode,
            colorCode: product.colorCode || undefined,
            genderCode: product.genderCode || undefined,
            seasonCode: product.seasonCode?.split(",")[0],
            divisionCode: product.divisionCode || undefined,
            brandCode: product.brandCode,
            availableDate: new Date(),
            availableQuantity: 0,
          });
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    // Sync inventory to RepSpark
    const allInventory = await prisma.inventory.findMany({
      where: { clientId: params.clientId },
    });
    const inventoryPayload = transformInventory(allInventory);
    const inventoryResult = await syncToRepSpark(client, environment, "inventory", inventoryPayload);
    results.push({
      step: "Inventory",
      success: inventoryResult.success,
      recordCount: inventoryResult.recordCount,
      error: inventoryResult.error,
    });

    const allSuccessful = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccessful,
      results,
    });
  } catch (error) {
    console.error("Smart sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Smart sync failed", results },
      { status: 500 }
    );
  }
}
