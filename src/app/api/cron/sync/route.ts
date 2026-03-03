import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import cronParser from "cron-parser";

// Vercel cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { clientId: string; entity: string; success: boolean; error?: string }[] = [];

  try {
    // Get all enabled sync schedules
    const schedules = await prisma.syncSchedule.findMany({
      where: { enabled: true },
      include: { client: true },
    });

    const now = new Date();

    for (const schedule of schedules) {
      const entities = [
        { key: "options", cron: schedule.optionsCron, lastSync: schedule.lastSyncOptions },
        { key: "sizing", cron: schedule.sizingCron, lastSync: schedule.lastSyncSizing },
        { key: "products", cron: schedule.productsCron, lastSync: schedule.lastSyncProducts },
        { key: "inventory", cron: schedule.inventoryCron, lastSync: schedule.lastSyncInventory },
        { key: "customers", cron: schedule.customersCron, lastSync: schedule.lastSyncCustomers },
        { key: "images", cron: schedule.imagesCron, lastSync: schedule.lastSyncImages },
      ];

      for (const entity of entities) {
        if (!entity.cron) continue;

        try {
          const interval = cronParser.parseExpression(entity.cron, {
            currentDate: entity.lastSync || new Date(0),
          });

          const nextRun = interval.next().toDate();

          // If next scheduled run is in the past or now, run the sync
          if (nextRun <= now) {
            // Call the sync endpoint
            const baseUrl = process.env.VERCEL_URL 
              ? `https://${process.env.VERCEL_URL}` 
              : "http://localhost:3000";

            const response = await fetch(`${baseUrl}/api/clients/${schedule.clientId}/sync`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                entity: entity.key,
                environment: schedule.environment,
              }),
            });

            const result = await response.json();

            if (result.success) {
              // Update last sync timestamp
              const updateField = `lastSync${entity.key.charAt(0).toUpperCase() + entity.key.slice(1)}`;
              await prisma.syncSchedule.update({
                where: { id: schedule.id },
                data: { [updateField]: now },
              });
            }

            results.push({
              clientId: schedule.clientId,
              entity: entity.key,
              success: result.success,
              error: result.error,
            });
          }
        } catch (err) {
          results.push({
            clientId: schedule.clientId,
            entity: entity.key,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      { success: false, error: "Cron execution failed" },
      { status: 500 }
    );
  }
}
