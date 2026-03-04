"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SyncLog {
  id: string;
  entityType: string;
  environment: string;
  syncMode: string;
  recordCount: number;
  success: boolean;
  error: string | null;
  details: string | null;
  createdAt: string;
}

export default function SyncLogsPage() {
  const params = useParams();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterEnv, setFilterEnv] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [params.clientId, filterEntity, filterEnv]);

  async function fetchLogs() {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (filterEntity) queryParams.set("entityType", filterEntity);
    if (filterEnv) queryParams.set("environment", filterEnv);

    const res = await fetch(
      `/api/clients/${params.clientId}/sync-logs?${queryParams.toString()}`
    );
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
    setLoading(false);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatEntityType(type: string) {
    const labels: Record<string, string> = {
      options: "Options",
      sizing: "Sizing",
      products: "Products",
      inventory: "Inventory",
      customers: "Customers",
      images: "Images",
    };
    return labels[type] || type;
  }

  function formatEnvironment(env: string) {
    return env.toUpperCase();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sync logs</h1>
          <p className="text-sm text-gray-500">History of data syncs to RepSpark</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4">
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
        >
          <option value="">All entities</option>
          <option value="options">Options</option>
          <option value="sizing">Sizing</option>
          <option value="products">Products</option>
          <option value="inventory">Inventory</option>
          <option value="customers">Customers</option>
          <option value="images">Images</option>
        </select>

        <select
          value={filterEnv}
          onChange={(e) => setFilterEnv(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
        >
          <option value="">All environments</option>
          <option value="dev">DEV</option>
          <option value="uat">UAT</option>
          <option value="prod">PROD</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No sync logs yet</p>
          <p className="text-sm text-gray-400 mt-1">Logs will appear here after you run a sync</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Environment</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Records</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {log.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatEntityType(log.entityType)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                        log.environment === "prod"
                          ? "bg-red-100 text-red-700"
                          : log.environment === "uat"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {formatEnvironment(log.environment)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.recordCount}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate">
                    {log.error || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
