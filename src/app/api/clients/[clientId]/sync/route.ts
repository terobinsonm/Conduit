import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  syncToRepSpark,
  transformOptions,
  transformSizing,
  transformProducts,
  transformInventory,
  transformCustomers,
  transformProductGroups,
} from "@/lib/repspark";

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { entity, environment } = await request.json();

    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    let result;
    let entityType = entity;

    switch (entity) {
      case "options": {
        const options = await prisma.option.findMany({
          where: { clientId: params.clientId },
        });
        const payload = transformOptions(options);
        result = await syncToRepSpark(client, environment, "option", payload);
        break;
      }

      case "sizing": {
        const sizeScales = await prisma.sizeScale.findMany({
          where: { clientId: params.clientId },
          include: { sizes: true },
        });
        const payload = transformSizing(sizeScales);
        result = await syncToRepSpark(client, environment, "sizing", payload);
        break;
      }

      case "products": {
        const products = await prisma.product.findMany({
          where: { clientId: params.clientId },
        });
        const payload = transformProducts(products);
        result = await syncToRepSpark(client, environment, "product", payload);
        break;
      }

      case "inventory": {
        const inventory = await prisma.inventory.findMany({
          where: { clientId: params.clientId },
        });
        const payload = transformInventory(inventory);
        result = await syncToRepSpark(client, environment, "inventory", payload);
        break;
      }

      case "customers": {
        const customers = await prisma.customer.findMany({
          where: { clientId: params.clientId },
        });
        const payload = transformCustomers(customers);
        result = await syncToRepSpark(client, environment, "customer", payload);
        break;
      }

case "productgroups": {
        // First get all product IDs for this client
        const clientProducts = await prisma.product.findMany({
          where: { clientId: params.clientId },
          select: { id: true },
        });
        const productIds = clientProducts.map(p => p.id);

        const configs = await prisma.licensedConfiguration.findMany({
          where: { 
            baseProductId: { in: productIds },
            enabled: true,
          },
          include: {
            baseProduct: true,
            decoration: true,
          },
        });
        const payload = transformProductGroups(configs);
        result = await syncToRepSpark(client, environment, "productgroup", payload);
        break;
      }

      case "images": {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : request.nextUrl.origin;

        const imagesResponse = await fetch(
          `${baseUrl}/api/clients/${params.clientId}/sync/images`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
        result = await imagesResponse.json();
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown entity: ${entity}` },
          { status: 400 }
        );
    }

    // Log the sync result
    await prisma.syncLog.create({
      data: {
        client: { connect: { id: params.clientId } },
        entityType,
        environment,
        syncMode: "Full",
        recordCount: result.recordCount || 0,
        status: result.success ? "success" : "failed",
        errorMessage: result.error || null,
        errorDetails: result.details ? JSON.stringify(result.details) : null,
        triggeredBy: "manual",
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
