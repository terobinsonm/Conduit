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
    where: {
      clientId: params.clientId,
      userId,
    },
    include: { client: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(membership.client);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.clientMember.findFirst({
    where: {
      clientId: params.clientId,
      userId,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Only owners and admins can update settings
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const client = await prisma.client.update({
      where: { id: params.clientId },
      data: {
        name: body.name,
        devClientKey: body.devClientKey || null,
        devEnvironmentKey: body.devEnvironmentKey || null,
        uatClientKey: body.uatClientKey || null,
        uatEnvironmentKey: body.uatEnvironmentKey || null,
        prodClientKey: body.prodClientKey || null,
        prodEnvironmentKey: body.prodEnvironmentKey || null,
        sftpHost: body.sftpHost || null,
        sftpPort: body.sftpPort || 22,
        sftpUsername: body.sftpUsername || null,
        sftpPassword: body.sftpPassword || null,
        sftpBasePath: body.sftpBasePath || null,
        defaultEnvironment: body.defaultEnvironment || "dev",
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.clientMember.findFirst({
    where: {
      clientId: params.clientId,
      userId,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Only owners can delete
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Only owners can delete clients" }, { status: 403 });
  }

  try {
    await prisma.client.delete({
      where: { id: params.clientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
