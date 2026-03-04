import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string };
}

interface StoreInput {
  storeCode: string;
  name: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  phoneNumber?: string;
  shippingMethodCode?: string;
  enabled?: boolean;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
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
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
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
    const stores: StoreInput[] = body.stores || [];

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

    // Create bill-to customer using relation syntax
    const billTo = await prisma.customer.create({
      data: {
        client: { connect: { id: params.clientId } },
        customerCode: body.customerCode,
        name: body.name,
        isBillTo: true,
        enabled: body.enabled ?? true,
        address1: body.address1 || null,
        address2: body.address2 || null,
        city: body.city || null,
        state: body.state || null,
        zip: body.zip || null,
        country: body.country || "US",
        phoneNumber: body.phoneNumber || null,
        faxNumber: body.faxNumber || null,
        salesPersonCode: body.salesPersonCode || null,
        brandCode: body.brandCode || null,
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

    // Create stores using relation syntax
    for (const store of stores) {
      await prisma.customer.create({
        data: {
          client: { connect: { id: params.clientId } },
          parent: { connect: { id: billTo.id } },
          customerCode: body.customerCode,
          name: store.name,
          isBillTo: false,
          enabled: store.enabled ?? true,
          storeCode: store.storeCode,
          address1: store.address1 || null,
          city: store.city || null,
          state: store.state || null,
          zip: store.zip || null,
          country: body.country || "US",
          phoneNumber: store.phoneNumber || null,
          salesPersonCode: body.salesPersonCode || null,
          brandCode: body.brandCode || null,
          divisionCode: body.divisionCode || null,
          termsCode: body.termsCode || null,
          shippingMethodCode: store.shippingMethodCode || null,
          discountPercentage: parseFloat(body.discountPercentage) || 0,
          pricePlanCode: body.pricePlanCode || null,
          customerGroupCode: body.customerGroupCode || null,
          classificationCode: body.classificationCode || null,
          channelCode: body.channelCode || null,
          typeCode: body.typeCode || null,
          creditStatusCode: body.creditStatusCode || null,
        },
      });
    }

    return NextResponse.json(billTo);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
