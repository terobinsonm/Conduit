import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const orders = await prisma.demoOrder.findMany({
    where: { clientId: params.clientId },
    include: {
      billingCustomer: { select: { name: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { orderDate: "desc" },
    take: 10,
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      orderDate: o.orderDate.toISOString(),
      customerName: o.billingCustomer.name,
      lineCount: o._count.lines,
      statusCode: o.statusCode,
    })),
  });
}
