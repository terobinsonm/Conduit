import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const schedule = await prisma.syncSchedule.findUnique({
      where: { clientId: params.clientId },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error fetching sync schedule:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const data = await request.json();

    const schedule = await prisma.syncSchedule.upsert({
      where: { clientId: params.clientId },
      update: {
        optionsCron: data.optionsCron || null,
        sizingCron: data.sizingCron || null,
        productsCron: data.productsCron || null,
        inventoryCron: data.inventoryCron || null,
        customersCron: data.customersCron || null,
        imagesCron: data.imagesCron || null,
        environment: data.environment || "dev",
        enabled: data.enabled ?? false,
      },
      create: {
        clientId: params.clientId,
        optionsCron: data.optionsCron || null,
        sizingCron: data.sizingCron || null,
        productsCron: data.productsCron || null,
        inventoryCron: data.inventoryCron || null,
        customersCron: data.customersCron || null,
        imagesCron: data.imagesCron || null,
        environment: data.environment || "dev",
        enabled: data.enabled ?? false,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error saving sync schedule:", error);
    return NextResponse.json({ error: "Failed to save schedule" }, { status: 500 });
  }
}
