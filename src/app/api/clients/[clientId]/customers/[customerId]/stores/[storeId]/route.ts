import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string; customerId: string; storeId: string };
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

    const store = await prisma.customer.update({
      where: { id: params.storeId },
      data: {
        name: body.name,
        storeCode: body.storeCode,
        enabled: body.enabled,
        address1: body.address1 || null,
        address2: body.address2 || null,
        city: body.city || null,
        state: body.state || null,
        zip: body.zip || null,
        country: body.country || "US",
        phoneNumber: body.phoneNumber || null,
        salesPersonCode: body.salesPersonCode || null,
        shippingMethodCode: body.shippingMethodCode || null,
        channelCode: body.channelCode || null,
      },
    });

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
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
    await prisma.customer.delete({
      where: { id: params.storeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting store:", error);
    return NextResponse.json({ error: "Failed to delete store" }, { status: 500 });
  }
}
