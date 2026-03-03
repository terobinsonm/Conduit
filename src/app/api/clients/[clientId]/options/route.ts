import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { clientId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });

  if (!membership) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const options = await prisma.option.findMany({
    where: { clientId: params.clientId },
    orderBy: [{ elementType: "asc" }, { keyCode: "asc" }],
  });

  return NextResponse.json(options);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
  });

  if (!membership) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    const option = await prisma.option.create({
      data: {
        clientId: params.clientId,
        elementType: body.elementType,
        keyCode: body.keyCode,
        stringValue: body.stringValue,
        stringValue2: body.stringValue2 || null,
        numericValue: body.numericValue || null,
        booleanValue: body.booleanValue ?? null,
        dateValue: body.dateValue ? new Date(body.dateValue) : null,
        enabled: body.enabled ?? true,
      },
    });

    return NextResponse.json(option);
  } catch (error) {
    console.error("Error creating option:", error);
    
    // Check for unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "An option with this type and code already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create option" },
      { status: 500 }
    );
  }
}
