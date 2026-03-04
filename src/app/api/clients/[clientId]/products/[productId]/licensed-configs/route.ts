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

    const config = await prisma.licensedConfiguration.create({
      data: {
        client: { connect: { id: params.clientId } },
        product: { connect: { id: params.productId } },
        decoration: { connect: { id: body.decorationId } },
        placement: body.placement,
        colorChoice: body.colorChoice,
        finishedGoodName: body.finishedGoodName || null,
        finishedGoodImageUrl: body.finishedGoodImageUrl || null,
        finishedGoodShortDesc: body.finishedGoodShortDesc || null,
        finishedGoodLongDesc: body.finishedGoodLongDesc || null,
        wholesalePrice: body.wholesalePrice || null,
        retailPrice: body.retailPrice || null,
        dateRangeBegin: body.dateRangeBegin ? new Date(body.dateRangeBegin) : null,
        dateRangeEnd: body.dateRangeEnd ? new Date(body.dateRangeEnd) : null,
        enabled: body.enabled ?? true,
      },
      include: {
        decoration: {
          select: {
            id: true,
            productNumber: true,
            productName: true,
            imageUrl: true,
            league: true,
            teamCode: true,
            teamName: true,
          },
        },
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error creating licensed config:", error);
    return NextResponse.json({ error: "Failed to create configuration" }, { status: 500 });
  }
}
