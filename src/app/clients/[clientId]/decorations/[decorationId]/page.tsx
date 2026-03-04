"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

interface Decoration {
  id: string;
  productNumber: string;
  productName: string;
  productType: number;
  wholesalePrice: number;
  retailPrice: number;
  imageUrl: string | null;
  enabled: boolean;
  brandCode: string;
  league: string | null;
  teamCode: string | null;
  teamName: string | null;
  teamDescription: string | null;
  customerRestrictions: string | null;
  decorationConfigs: {
    id: string;
    product: {
      id: string;
      productNumber: string;
      productName: string | null;
    };
  }[];
}

export default function EditDecorationPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [decoration, setDecoration] = useState<Decoration | null>(null);

  const [form, setForm] = useState({
    productName: "",
    wholesalePrice: "",
    retailPrice: "",
    imageUrl: "",
    enabled: true,
    brandCode: "CC",
    league: "",
    teamCode: "",
    teamName: "",
    teamDescription: "",
  });

  useEffect(() => {
    fetchDecoration();
  }, [params.clientId, params.decorationId]);

  async function fetchDecoration() {
    setLoading(true);
    const res = await fetch(
      `/api/clients/${params.clientId}/decorations/${params.decorationId}`
    );
    if (res.ok) {
      const data = await res.json();
      setDecoration(data);
      setForm({
        productName: data.productName || "",
        wholesalePrice: data.wholesalePrice?.toString() || "",
        retailPrice: data.retailPrice?.toString() || "",
        imageUrl: data.imageUrl || "",
        enabled: data.enabled,
        brandCode: data.brandCode || "CC",
        league: data.league || "",
        teamCode: data.teamCode || "",
        teamName: data.teamName || "",
        teamDescription: data.teamDescription || "",
      });
    } else {
      setError("Decoration not found");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch(
      `/api/clients/${params.clientId}/decorations/${params.decorationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );

    if (res.ok) {
      router.push(`/clients/${params.clientId}/decorations`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update decoration");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this decoration? This cannot be undone.")) return;

    const res = await fetch(
      `/api/clients/${params.clientId}/decorations/${params.decorationId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      router.push(`/clients/${params.clientId}/decorations`);
    } else {
      setError("Failed to delete decoration");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!decoration) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Decoration not found</p>
        <Link
          href={`/clients/${params.clientId}/decorations`}
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          Back to decorations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.clientId}/decorations`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {decoration.productName || decoration.productNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {decoration.productType === 3 ? "Insignia" : "Licensed"} • {decoration.productNumber}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Number
            </label>
            <input
              type="text"
              value={decoration.productNumber}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Product number cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="https://..."
            />
            {form.imageUrl && (
              <div className="mt-2">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-20 w-20 object-contain rounded bg-gray-100"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Pricing</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wholesale Price
              </label>
              <input
                type="number"
                step="0.01"
                value={form.wholesalePrice}
                onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retail Price
              </label>
              <input
                type="number"
                step="0.01"
                value={form.retailPrice}
                onChange={(e) => setForm({ ...form, retailPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {decoration.productType === 4 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-medium text-gray-900">Licensed Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  League
                </label>
                <input
                  type="text"
                  value={form.league}
                  onChange={(e) => setForm({ ...form, league: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g., NCAA, MLB, NFL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Code
                </label>
                <input
                  type="text"
                  value={form.teamCode}
                  onChange={(e) => setForm({ ...form, teamCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g., ALA, UGA, NYY"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Name
              </label>
              <input
                type="text"
                value={form.teamName}
                onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Description
              </label>
              <input
                type="text"
                value={form.teamDescription}
                onChange={(e) => setForm({ ...form, teamDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
        )}

        {decoration.decorationConfigs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-medium text-gray-900">Used On Products</h2>
            <div className="space-y-2">
              {decoration.decorationConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {config.product.productName || config.product.productNumber}
                    </div>
                    <div className="text-xs text-gray-500">{config.product.productNumber}</div>
                  </div>
                  <Link
                    href={`/clients/${params.clientId}/products/${config.product.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View product
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Inactive decorations won't be synced to RepSpark
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/clients/${params.clientId}/decorations`}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
