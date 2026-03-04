import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string; customerId: string };
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

    // Get parent customer
    const parent = await prisma.customer.findFirst({
      where: { id: params.customerId, clientId: params.clientId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check for duplicate store code
    const existing = await prisma.customer.findFirst({
      where: {
        clientId: params.clientId,
        customerCode: parent.customerCode,
        storeCode: body.storeCode,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Store with this code already exists" },
        { status: 400 }
      );
    }

    const store = await prisma.customer.create({
      data: {
        clientId: params.clientId,
        parentId: params.customerId,
        customerCode: parent.customerCode, // Inherit from parent
        name: body.name,
        isBillTo: false, // Stores are never Bill-To
        enabled: body.enabled ?? true,
        storeCode: body.storeCode, // Required for Ship-To
        address1: body.address1 || null,
        address2: body.address2 || null,
        city: body.city || null,
        state: body.state || null,
        zip: body.zip || null,
        country: body.country || "US",
        phoneNumber: body.phoneNumber || null,
        faxNumber: body.faxNumber || null,
        salesPersonCode: body.salesPersonCode || parent.salesPersonCode,
        brandCode: parent.brandCode,
        divisionCode: body.divisionCode || parent.divisionCode,
        termsCode: parent.termsCode, // Inherit billing terms
        shippingMethodCode: body.shippingMethodCode || null,
        discountPercentage: parent.discountPercentage, // Inherit
        pricePlanCode: parent.pricePlanCode, // Inherit
        customerGroupCode: parent.customerGroupCode,
        classificationCode: parent.classificationCode,
        channelCode: body.channelCode || parent.channelCode,
        typeCode: parent.typeCode,
        creditStatusCode: parent.creditStatusCode,
      },
    });

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }
}
