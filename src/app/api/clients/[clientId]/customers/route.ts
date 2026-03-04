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

  // Only fetch Bill-To accounts (parents), include store count
  const customers = await prisma.customer.findMany({
    where: { 
      clientId: params.clientId,
      isBillTo: true,
      parentId: null,
    },
    include: {
      _count: { select: { stores: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
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

    // Check for duplicate Bill-To
    const existing = await prisma.customer.findFirst({
      where: {
        clientId: params.clientId,
        customerCode: body.customerCode,
        isBillTo: true,
        parentId: null,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Customer with this code already exists" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        clientId: params.clientId,
        customerCode: body.customerCode,
        name: body.name,
        isBillTo: true, // Always true for parent customers
        enabled: body.enabled ?? true,
        storeCode: null, // Bill-To accounts don't have store codes
        parentId: null,
        address1: body.address1 || null,
        address2: body.address2 || null,
        city: body.city || null,
        state: body.state || null,
        zip: body.zip || null,
        country: body.country || "US",
        phoneNumber: body.phoneNumber || null,
        faxNumber: body.faxNumber || null,
        salesPersonCode: body.salesPersonCode || null,
        brandCode: body.brandCode || "CC",
        divisionCode: body.divisionCode || null,
        termsCode: body.termsCode || null,
        shippingMethodCode: body.shippingMethodCode || null,
        discountPercentage: parseFloat(body.discountPercentage) || 0,
        pricePlanCode: body.pricePlanCode || null,
        customerGroupCode: body.customerGroupCode || null,
        classificationCode: body.classificationCode || null,
        channelCode: body.channelCode || null,
        typeCode: body.typeCode || null,
        creditStatusCode: body.creditStatusCode || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
