import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.clientMember.findMany({
    where: { userId },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(memberships.map((m) => m.client));
}

export async function POST(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existing = await prisma.client.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 400 }
      );
    }

    // Create client and membership in a transaction
    const client = await prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: { name, slug },
      });

      await tx.clientMember.create({
        data: {
          clientId: newClient.id,
          userId,
          role: "owner",
        },
      });

      return newClient;
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
