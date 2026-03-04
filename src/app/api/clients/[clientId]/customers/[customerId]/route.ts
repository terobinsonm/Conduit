import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string; customerId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customer = await prisma.customer.findFirst({
    where: { id: params.customerId, clientId: params.clientId },
    include: {
      stores: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
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

    const customer = await prisma.customer.update({
      where: { id: params.customerId },
      data: {
        customerCode: body.customerCode,
        name: body.name,
        enabled: body.enabled,
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
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
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
    // This will cascade delete all stores too
    await prisma.customer.delete({
      where: { id: params.customerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
