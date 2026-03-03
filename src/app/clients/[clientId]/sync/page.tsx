"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";

const ENTITIES = [
  { key: "options", name: "Options", description: "Lookup tables (colors, seasons, etc.)" },
  { key: "sizing", name: "Sizing", description: "Size scales and sizes" },
  { key: "products", name: "Products", description: "Product catalog" },
  { key: "customers", name: "Customers", description: "Customer accounts" },
  { key: "inventory", name: "Inventory", description: "Stock levels" },
];

export default function SyncPage() {
  const params = useParams();
  const [environment, setEnvironment] = useState<"dev" | "uat" | "prod">("dev");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

  async function handleSync(entity: string) {
    setSyncing(entity);
    setResults((prev) => ({ ...prev, [entity]: undefined as unknown as { success: boolean; message: string } }));

    try {
      const response = await fetch(`/api/clients/${params.clientId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, environment }),
      });

      const result = await response.json();
      setResults((prev) => ({
        ...prev,
        [entity]: {
          success: result.success,
message: result.success
  ? `Synced ${result.recordCount} records`
  : `${result.error || "Sync failed"}${result.details ? `: ${JSON.stringify(result.details)}` : ""}`,
        },
      }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [entity]: { success: false, message: "Network error" },
      }));
    } finally {
      setSyncing(null);
    }
  }

  async function handleFullSync() {
    for (const entity of ENTITIES) {
      await handleSync(entity.key);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Sync to RepSpark</h2>
          <p className="text-muted-foreground">
            Push data to RepSpark environments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as "dev" | "uat" | "prod")}
            className="border rounded px-3 py-2"
          >
            <option value="dev">Development</option>
            <option value="uat">UAT</option>
            <option value="prod">Production</option>
          </select>
          <button
            onClick={handleFullSync}
            disabled={syncing !== null}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Full Sync
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          <strong>Sync Order:</strong> Entities are synced in dependency order. Options and Sizing
          must be synced before Products. Products and Customers must be synced before Inventory.
        </p>
      </div>

      <div className="space-y-4">
        {ENTITIES.map((entity) => (
          <div
            key={entity.key}
            className="bg-white rounded-lg border p-4 flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold">{entity.name}</h3>
              <p className="text-sm text-muted-foreground">{entity.description}</p>
              {results[entity.key] && (
                <div
                  className={`flex items-center gap-2 mt-2 text-sm ${
                    results[entity.key].success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {results[entity.key].success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {results[entity.key].message}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSync(entity.key)}
              disabled={syncing !== null}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50"
            >
              {syncing === entity.key ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
