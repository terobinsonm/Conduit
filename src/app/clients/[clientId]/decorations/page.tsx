"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface Decoration {
  id: string;
  productNumber: string;
  productName: string;
  productType: number;
  wholesalePrice: number;
  retailPrice: number;
  imageUrl: string | null;
  enabled: boolean;
  league: string | null;
  teamCode: string | null;
  teamName: string | null;
  _count: {
    decorationConfigs: number;
  };
}

export default function DecorationsPage() {
  const params = useParams();
  const router = useRouter();
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "insignia" | "licensed">("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDecorations();
  }, [params.clientId, typeFilter]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchDecorations() {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (typeFilter) queryParams.set("type", typeFilter);

    const res = await fetch(
      `/api/clients/${params.clientId}/decorations?${queryParams.toString()}`
    );
    if (res.ok) {
      const data = await res.json();
      setDecorations(data);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this decoration? This cannot be undone.")) return;

    const res = await fetch(`/api/clients/${params.clientId}/decorations/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setDecorations(decorations.filter((d) => d.id !== id));
    }
    setMenuOpen(null);
  }

  const filtered = decorations.filter((d) => {
    const searchLower = search.toLowerCase();
    return (
      d.productNumber.toLowerCase().includes(searchLower) ||
      d.productName?.toLowerCase().includes(searchLower) ||
      d.teamName?.toLowerCase().includes(searchLower) ||
      d.league?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Decorations</h1>
          <p className="text-sm text-gray-500">
            Manage Insignia and Licensed logos
          </p>
        </div>
        <Link
          href={`/clients/${params.clientId}/decorations/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add decoration
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search decorations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "" | "insignia" | "licensed")}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
        >
          <option value="">All types</option>
          <option value="insignia">Insignia (Type 3)</option>
          <option value="licensed">Licensed (Type 4)</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No decorations found</p>
          <p className="text-sm text-gray-400 mt-1">
            Add your first decoration to get started
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Image</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">League/Team</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Used On</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((decoration) => (
                <tr key={decoration.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {decoration.imageUrl ? (
                      <img
                        src={decoration.imageUrl}
                        alt={decoration.productName || ""}
                        className="h-10 w-10 object-contain rounded bg-gray-100"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {decoration.productName || decoration.productNumber}
                    </div>
                    <div className="text-gray-500 text-xs">{decoration.productNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                        decoration.productType === 3
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {decoration.productType === 3 ? "Insignia" : "Licensed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {decoration.productType === 4 ? (
                      <div>
                        <div>{decoration.teamName || "—"}</div>
                        <div className="text-xs text-gray-400">{decoration.league}</div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    ${decoration.wholesalePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {decoration._count.decorationConfigs > 0 ? (
                      <span className="text-blue-600">
                        {decoration._count.decorationConfigs} products
                      </span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                        decoration.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {decoration.enabled ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative" ref={menuOpen === decoration.id ? menuRef : null}>
                      <button
                        onClick={() => setMenuOpen(menuOpen === decoration.id ? null : decoration.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </button>
                      {menuOpen === decoration.id && (
                        <div className="absolute right-0 top-8 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <button
                            onClick={() => {
                              router.push(`/clients/${params.clientId}/decorations/${decoration.id}`);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(decoration.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
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
