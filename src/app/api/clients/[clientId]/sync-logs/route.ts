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

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const entityType = searchParams.get("entityType");
  const environment = searchParams.get("environment");

  const where: Record<string, unknown> = { clientId: params.clientId };
  if (entityType) where.entityType = entityType;
  if (environment) where.environment = environment;

const logs = await prisma.syncLog.findMany({
  where,
  orderBy: { id: "desc" },
  take: limit,
});
  return NextResponse.json(logs);
}
