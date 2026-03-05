"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Trash2, Zap, ChevronDown, ChevronUp } from "lucide-react";

interface Stats {
  orderCount: number;
  invoiceCount: number;
  lineCount: number;
}

interface PreviewOrder {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  lineCount: number;
  statusCode: string;
}

export default function DemoDataPage() {
  const params = useParams();
  const [stats, setStats] = useState<Stats>({ orderCount: 0, invoiceCount: 0, lineCount: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generation settings
  const [orderCount, setOrderCount] = useState(100);
  const [dateRange, setDateRange] = useState("6months");
  const [statusMix, setStatusMix] = useState("realistic");
  const [linesPerOrderMin, setLinesPerOrderMin] = useState(1);
  const [linesPerOrderMax, setLinesPerOrderMax] = useState(5);
  const [qtyPerLineMin, setQtyPerLineMin] = useState(1);
  const [qtyPerLineMax, setQtyPerLineMax] = useState(12);
  const [respectDivisions, setRespectDivisions] = useState(true);

  // Preview
  const [preview, setPreview] = useState<PreviewOrder[]>([]);

  useEffect(() => {
    fetchStats();
  }, [params.clientId]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${params.clientId}/demo-data`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }

      // Fetch preview if we have data
      const previewRes = await fetch(`/api/clients/${params.clientId}/demo-data/preview`);
      if (previewRes.ok) {
        const previewData = await previewRes.json();
        setPreview(previewData.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/clients/${params.clientId}/demo-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCount,
          dateRange,
          statusMix,
          linesPerOrderMin,
          linesPerOrderMax,
          qtyPerLineMin,
          qtyPerLineMax,
          respectDivisions,
        }),
      });

      if (res.ok) {
        await fetchStats();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to generate demo data");
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate demo data");
    } finally {
      setGenerating(false);
    }
  }

  async function handleClear() {
    if (!confirm("Clear all demo data? This cannot be undone.")) return;

    setClearing(true);
    try {
      const res = await fetch(`/api/clients/${params.clientId}/demo-data`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStats({ orderCount: 0, invoiceCount: 0, lineCount: 0 });
        setPreview([]);
      }
    } catch (error) {
      console.error("Clear error:", error);
    } finally {
      setClearing(false);
    }
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    INVOICED: "bg-green-100 text-green-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate Demo Data</h1>
        <p className="text-gray-500 mt-1">
          Create realistic order and invoice data for demo environments
        </p>
      </div>

      {/* Current Data Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Current Data</h2>
          {stats.orderCount > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.orderCount}</div>
            <div className="text-sm text-gray-500">Orders</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.invoiceCount}</div>
            <div className="text-sm text-gray-500">Invoices</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.lineCount}</div>
            <div className="text-sm text-gray-500">Line Items</div>
          </div>
        </div>
      </div>

      {/* Generation Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Generation Settings</h2>

        <div className="space-y-6">
          {/* Order Count Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Number of orders</label>
              <span className="text-sm font-semibold text-gray-900">{orderCount}</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={orderCount}
              onChange={(e) => setOrderCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10</span>
              <span>500</span>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="3months">Last 3 months</option>
              <option value="6months">Last 6 months</option>
              <option value="1year">Last 1 year</option>
              <option value="2years">Last 2 years</option>
            </select>
          </div>

          {/* Status Mix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status mix</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="statusMix"
                  value="realistic"
                  checked={statusMix === "realistic"}
                  onChange={(e) => setStatusMix(e.target.value)}
                  className="text-gray-900"
                />
                <span className="text-sm">
                  Realistic{" "}
                  <span className="text-gray-400">(20% open, 30% shipped, 50% invoiced)</span>
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="statusMix"
                  value="allInvoiced"
                  checked={statusMix === "allInvoiced"}
                  onChange={(e) => setStatusMix(e.target.value)}
                  className="text-gray-900"
                />
                <span className="text-sm">All invoiced</span>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lines per order (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={linesPerOrderMin}
                      onChange={(e) => setLinesPerOrderMin(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lines per order (max)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={linesPerOrderMax}
                      onChange={(e) => setLinesPerOrderMax(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity per line (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={qtyPerLineMin}
                      onChange={(e) => setQtyPerLineMin(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity per line (max)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={qtyPerLineMax}
                      onChange={(e) => setQtyPerLineMax(parseInt(e.target.value) || 12)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={respectDivisions}
                    onChange={(e) => setRespectDivisions(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    Respect division restrictions{" "}
                    <span className="text-gray-400">(match products to customer divisions)</span>
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Generate {orderCount} Orders
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            This will replace any existing demo data
          </p>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Preview{" "}
            <span className="font-normal text-gray-400">
              (showing {Math.min(10, preview.length)} of {stats.orderCount})
            </span>
          </h2>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Order</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Lines</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preview.slice(0, 10).map((order) => (
                  <tr key={order.orderNumber}>
                    <td className="px-4 py-2 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{order.customerName}</td>
                    <td className="px-4 py-2">{order.lineCount}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                          statusColors[order.statusCode] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.statusCode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
