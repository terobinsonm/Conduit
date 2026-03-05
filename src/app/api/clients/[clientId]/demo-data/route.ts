import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - fetch current demo data stats
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const [orderCount, invoiceCount, lineCount] = await Promise.all([
    prisma.demoOrder.count({ where: { clientId: params.clientId } }),
    prisma.demoInvoice.count({ where: { clientId: params.clientId } }),
    prisma.demoOrderLine.count({
      where: { order: { clientId: params.clientId } },
    }),
  ]);

  return NextResponse.json({ orderCount, invoiceCount, lineCount });
}

// DELETE - clear all demo data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  // Delete in order due to foreign keys
  await prisma.demoInvoice.deleteMany({ where: { clientId: params.clientId } });
  await prisma.demoOrder.deleteMany({ where: { clientId: params.clientId } });

  return NextResponse.json({ success: true });
}

// POST - generate demo data
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const body = await request.json();
    const {
      orderCount = 100,
      dateRange = "6months",
      statusMix = "realistic",
      customStatusMix = null,
      linesPerOrderMin = 1,
      linesPerOrderMax = 5,
      qtyPerLineMin = 1,
      qtyPerLineMax = 12,
      respectDivisions = true,
    } = body;

    // Clear existing demo data first
    await prisma.demoInvoice.deleteMany({ where: { clientId: params.clientId } });
    await prisma.demoOrder.deleteMany({ where: { clientId: params.clientId } });

    // Fetch source data
    const [customers, products, options] = await Promise.all([
      prisma.customer.findMany({
        where: { clientId: params.clientId, enabled: true, isBillTo: true },
        include: { stores: { where: { enabled: true } } },
      }),
      prisma.product.findMany({
        where: { clientId: params.clientId, enabled: true, productType: 2 },
      }),
      prisma.option.findMany({
        where: { clientId: params.clientId },
      }),
    ]);

    if (customers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No enabled customers found" },
        { status: 400 }
      );
    }

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "No enabled products found" },
        { status: 400 }
      );
    }

    // Build option lookup maps for descriptions
    const optionMap = new Map<string, Map<string, string>>();
    for (const opt of options) {
      if (!optionMap.has(opt.elementType)) {
        optionMap.set(opt.elementType, new Map());
      }
      optionMap.get(opt.elementType)!.set(opt.keyCode, opt.stringValue);
    }

    const getDescription = (elementType: string, keyCode: string | null): string | null => {
      if (!keyCode) return null;
      return optionMap.get(elementType)?.get(keyCode) || keyCode;
    };

    // Get shipping methods
    const shippingMethods = options
      .filter((o) => o.elementType === "ShippingMethod")
      .map((o) => o.keyCode);

    // Calculate date range
    const now = new Date();
    const dateRangeMap: Record<string, number> = {
      "3months": 90,
      "6months": 180,
      "1year": 365,
      "2years": 730,
    };
    const daysBack = dateRangeMap[dateRange] || 180;

    // Calculate status distribution
    let statusDistribution: { open: number; shipped: number; invoiced: number };
    if (statusMix === "realistic") {
      statusDistribution = { open: 0.2, shipped: 0.3, invoiced: 0.5 };
    } else if (statusMix === "allInvoiced") {
      statusDistribution = { open: 0, shipped: 0, invoiced: 1 };
    } else if (customStatusMix) {
      statusDistribution = customStatusMix;
    } else {
      statusDistribution = { open: 0.2, shipped: 0.3, invoiced: 0.5 };
    }

    // Get client for brand code
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });
    const brandPrefix = client?.slug?.toUpperCase().slice(0, 2) || "CC";

    // Helper functions
    function randomInt(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomElement<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function randomDate(daysBack: number): Date {
      const date = new Date(now);
      // Weight toward more recent dates
      const weight = Math.random() * Math.random(); // Quadratic bias toward recent
      const daysAgo = Math.floor(weight * daysBack);
      date.setDate(date.getDate() - daysAgo);
      return date;
    }

    function pickStatus(): string {
      const rand = Math.random();
      if (rand < statusDistribution.open) return "OPEN";
      if (rand < statusDistribution.open + statusDistribution.shipped) return "SHIPPED";
      return "INVOICED";
    }

    function generateUPSTracking(): string {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let tracking = "1Z";
      for (let i = 0; i < 6; i++) {
        tracking += chars[Math.floor(Math.random() * chars.length)];
      }
      for (let i = 0; i < 10; i++) {
        tracking += Math.floor(Math.random() * 10);
      }
      return tracking;
    }

    function generateFedExTracking(): string {
      let tracking = "";
      for (let i = 0; i < 15; i++) {
        tracking += Math.floor(Math.random() * 10);
      }
      return tracking;
    }

    function getSizesForProduct(product: typeof products[0]): string[] {
      if (product.options) {
        try {
          const opts = JSON.parse(product.options) as { name: string; values: string[]; isProductLevel: boolean }[];
          const sizeOpts = opts.filter((o) => !o.isProductLevel);
          if (sizeOpts.length > 0) {
            // Generate combinations
            function cartesian(arrays: string[][]): string[] {
              if (arrays.length === 0) return [];
              if (arrays.length === 1) return arrays[0];
              return arrays.reduce((acc, curr) =>
                acc.flatMap((a) => curr.map((c) => `${a} / ${c}`))
              );
            }
            const valueArrays = sizeOpts.map((o) => o.values);
            return cartesian(valueArrays);
          }
        } catch {
          // Fall through to default
        }
      }
      // Default sizes if no options defined
      return ["S", "M", "L", "XL"];
    }

    // Generate orders
    const ordersToCreate: {
      clientId: string;
      orderNumber: string;
      orderDate: Date;
      entryDate: Date;
      billingCustomerId: string;
      shippingCustomerId: string | null;
      purchaseOrder: string | null;
      statusCode: string;
      shippingMethodCode: string | null;
      shippingCarrierName: string | null;
      trackingNumber: string | null;
    }[] = [];

    const linesToCreate: {
      orderNumber: string;
      lineNumber: number;
      productId: string;
      productNumber: string;
      productName: string | null;
      colorCode: string | null;
      colorDescription: string | null;
      genderCode: string | null;
      genderDescription: string | null;
      seasonCode: string | null;
      seasonDescription: string | null;
      categoryCode: string | null;
      categoryDescription: string | null;
      sizeScaleCode: string | null;
      divisionCode: string | null;
      divisionDescription: string | null;
      brandCode: string;
      sizeCode: string;
      orderedQuantity: number;
      invoicedQuantity: number;
      retailPrice: number;
      wholesalePrice: number;
      sellPrice: number;
      cost: number;
      statusCode: string;
    }[] = [];

    const invoicesToCreate: {
      clientId: string;
      invoiceNumber: string;
      orderNumber: string;
      invoiceCreatedDate: Date;
      invoiceSentDate: Date | null;
      invoiceDueDate: Date;
      invoiceAmount: number;
      freightAmount: number;
      taxAmount: number;
    }[] = [];

    for (let i = 0; i < orderCount; i++) {
      const orderNumber = `${brandPrefix}-${String(i + 1).padStart(5, "0")}`;
      const orderDate = randomDate(daysBack);
      const entryDate = new Date(orderDate);
      entryDate.setHours(entryDate.getHours() + randomInt(1, 8));

      const billingCustomer = randomElement(customers);
      const shippingCustomer =
        billingCustomer.stores.length > 0 && Math.random() > 0.3
          ? randomElement(billingCustomer.stores)
          : null;

      const statusCode = pickStatus();

      // Shipping details for shipped/invoiced orders
      let shippingMethodCode: string | null = null;
      let shippingCarrierName: string | null = null;
      let trackingNumber: string | null = null;

      if (statusCode !== "OPEN") {
        shippingMethodCode =
          billingCustomer.shippingMethodCode ||
          (shippingMethods.length > 0 ? randomElement(shippingMethods) : "GROUND");

        shippingCarrierName = Math.random() > 0.3 ? "UPS" : "FedEx";
        trackingNumber =
          shippingCarrierName === "UPS"
            ? generateUPSTracking()
            : generateFedExTracking();
      }

      ordersToCreate.push({
        clientId: params.clientId,
        orderNumber,
        orderDate,
        entryDate,
        billingCustomerId: billingCustomer.id,
        shippingCustomerId: shippingCustomer?.id || null,
        purchaseOrder: Math.random() > 0.5 ? `PO-${randomInt(10000, 99999)}` : null,
        statusCode,
        shippingMethodCode,
        shippingCarrierName,
        trackingNumber,
      });

      // Generate lines for this order
      const lineCount = randomInt(linesPerOrderMin, linesPerOrderMax);
      const usedProductIds = new Set<string>();
      let orderTotal = 0;

      for (let j = 0; j < lineCount; j++) {
        // Pick a product (optionally matching division)
        let eligibleProducts = products.filter((p) => !usedProductIds.has(p.id));

        if (respectDivisions && billingCustomer.divisionCode) {
          const divisionMatches = eligibleProducts.filter(
            (p) => p.divisionCode === billingCustomer.divisionCode
          );
          if (divisionMatches.length > 0) {
            eligibleProducts = divisionMatches;
          }
        }

        if (eligibleProducts.length === 0) {
          eligibleProducts = products;
        }

        const product = randomElement(eligibleProducts);
        usedProductIds.add(product.id);

        const sizes = getSizesForProduct(product);
        const sizeCode = randomElement(sizes);
        const quantity = randomInt(qtyPerLineMin, qtyPerLineMax);
        const lineTotal = product.wholesalePrice * quantity;
        orderTotal += lineTotal;

        linesToCreate.push({
          orderNumber,
          lineNumber: j + 1,
          productId: product.id,
          productNumber: product.productNumber,
          productName: product.productName,
          colorCode: product.colorCode,
          colorDescription: getDescription("Color", product.colorCode),
          genderCode: product.genderCode,
          genderDescription: getDescription("Gender", product.genderCode),
          seasonCode: product.seasonCode,
          seasonDescription: getDescription("Season", product.seasonCode),
          categoryCode: product.categoryCode,
          categoryDescription: getDescription("ProductCategory", product.categoryCode),
          sizeScaleCode: null, // Would need to look up from product
          divisionCode: product.divisionCode,
          divisionDescription: getDescription("Division", product.divisionCode),
          brandCode: product.brandCode,
          sizeCode,
          orderedQuantity: quantity,
          invoicedQuantity: statusCode === "INVOICED" ? quantity : 0,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          sellPrice: product.wholesalePrice,
          cost: product.standardCost,
          statusCode,
        });
      }

      // Create invoice for invoiced orders
      if (statusCode === "INVOICED") {
        const invoiceCreatedDate = new Date(orderDate);
        invoiceCreatedDate.setDate(invoiceCreatedDate.getDate() + randomInt(1, 7));

        const invoiceSentDate = new Date(invoiceCreatedDate);
        invoiceSentDate.setDate(invoiceSentDate.getDate() + randomInt(0, 2));

        const invoiceDueDate = new Date(invoiceCreatedDate);
        invoiceDueDate.setDate(invoiceDueDate.getDate() + 30);

        const freightAmount = Math.random() > 0.3 ? randomInt(5, 25) : 0;
        const taxAmount = Math.round(orderTotal * 0.07 * 100) / 100;

        invoicesToCreate.push({
          clientId: params.clientId,
          invoiceNumber: `INV-${orderNumber}`,
          orderNumber,
          invoiceCreatedDate,
          invoiceSentDate,
          invoiceDueDate,
          invoiceAmount: orderTotal + freightAmount + taxAmount,
          freightAmount,
          taxAmount,
        });
      }
    }

    // Bulk insert orders
    await prisma.demoOrder.createMany({ data: ordersToCreate });

    // Fetch created orders to get IDs
    const createdOrders = await prisma.demoOrder.findMany({
      where: { clientId: params.clientId },
      select: { id: true, orderNumber: true },
    });
    const orderIdMap = new Map(createdOrders.map((o) => [o.orderNumber, o.id]));

    // Bulk insert lines
    await prisma.demoOrderLine.createMany({
      data: linesToCreate.map((line) => ({
        orderId: orderIdMap.get(line.orderNumber)!,
        lineNumber: line.lineNumber,
        productId: line.productId,
        productNumber: line.productNumber,
        productName: line.productName,
        colorCode: line.colorCode,
        colorDescription: line.colorDescription,
        genderCode: line.genderCode,
        genderDescription: line.genderDescription,
        seasonCode: line.seasonCode,
        seasonDescription: line.seasonDescription,
        categoryCode: line.categoryCode,
        categoryDescription: line.categoryDescription,
        sizeScaleCode: line.sizeScaleCode,
        divisionCode: line.divisionCode,
        divisionDescription: line.divisionDescription,
        brandCode: line.brandCode,
        sizeCode: line.sizeCode,
        orderedQuantity: line.orderedQuantity,
        invoicedQuantity: line.invoicedQuantity,
        retailPrice: line.retailPrice,
        wholesalePrice: line.wholesalePrice,
        sellPrice: line.sellPrice,
        cost: line.cost,
        statusCode: line.statusCode,
      })),
    });

    // Bulk insert invoices
    await prisma.demoInvoice.createMany({
      data: invoicesToCreate.map((inv) => ({
        clientId: inv.clientId,
        invoiceNumber: inv.invoiceNumber,
        orderId: orderIdMap.get(inv.orderNumber)!,
        invoiceCreatedDate: inv.invoiceCreatedDate,
        invoiceSentDate: inv.invoiceSentDate,
        invoiceDueDate: inv.invoiceDueDate,
        invoiceAmount: inv.invoiceAmount,
        freightAmount: inv.freightAmount,
        taxAmount: inv.taxAmount,
      })),
    });

    return NextResponse.json({
      success: true,
      orderCount: ordersToCreate.length,
      invoiceCount: invoicesToCreate.length,
      lineCount: linesToCreate.length,
    });
  } catch (error) {
    console.error("Demo data generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate demo data" },
      { status: 500 }
    );
  }
}
