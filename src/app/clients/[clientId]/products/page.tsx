"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Package,
  Loader2,
  Copy,
  Trash2,
} from "lucide-react";
import { ClassificationCombobox } from "./_components/classification-combobox";

interface Product {
  id: string;
  productNumber: string;
  productName: string | null;
  wholesalePrice: number;
  categoryCode: string | null;
  seasonCode: string | null;
  imageUrl: string | null;
  enabled: boolean;
  options: string | null;
  parentProductId: string | null;
  _count?: { inventory: number };
}

interface Option {
  id: string;
  elementType: string;
  keyCode: string;
  stringValue: string;
}

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeason, setFilterSeason] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.clientId]);

  async function fetchData() {
    const [productsRes, optionsRes] = await Promise.all([
      fetch(`/api/clients/${params.clientId}/products`),
      fetch(`/api/clients/${params.clientId}/options`),
    ]);
    const [productsData, optionsData] = await Promise.all([
      productsRes.json(),
      optionsRes.json(),
    ]);
    setProducts(productsData);
    setOptions(optionsData);
    setLoading(false);
  }

  const seasons = options.filter((o) => o.elementType === "Season");
  const categories = options.filter((o) => o.elementType === "ProductCategory");
  const parentProducts = products.filter((p) => !p.parentProductId);

  const filteredProducts = parentProducts.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.productNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = !filterSeason || p.seasonCode === filterSeason;
    const matchesCategory = !filterCategory || p.categoryCode === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && p.enabled) ||
      (filterStatus === "inactive" && !p.enabled);
    return matchesSearch && matchesSeason && matchesCategory && matchesStatus;
  });

  const hasFilters = searchTerm || filterSeason || filterCategory || filterStatus !== "all";

  function clearFilters() {
    setSearchTerm("");
    setFilterSeason("");
    setFilterCategory("");
    setFilterStatus("all");
  }

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.productNumber}"? This will also delete all inventory records.`)) return;
    await fetch(`/api/clients/${params.clientId}/products/${product.id}`, { method: "DELETE" });
    fetchData();
    setActionMenuOpen(null);
  }

  async function handleDuplicate(product: Product) {
    const newNumber = prompt("Enter product number for the duplicate:", `${product.productNumber}-COPY`);
    if (!newNumber) return;
    const res = await fetch(`/api/clients/${params.clientId}/products/${product.id}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newProductNumber: newNumber }),
    });
    if (res.ok) {
      const newProduct = await res.json();
      router.push(`/clients/${params.clientId}/products/${newProduct.id}`);
    } else {
      const error = await res.json();
      alert(error.error || "Failed to duplicate product");
    }
    setActionMenuOpen(null);
  }

  async function bulkUpdateStatus(enabled: boolean) {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/clients/${params.clientId}/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        })
      )
    );
    setSelectedIds(new Set());
    fetchData();
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} products? This cannot be undone.`)) return;
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/clients/${params.clientId}/products/${id}`, { method: "DELETE" })
      )
    );
    setSelectedIds(new Set());
    fetchData();
  }

  function getVariantCount(product: Product): number {
    if (!product.options) return 0;
    try {
      const opts = JSON.parse(product.options) as { name: string; values: string[]; isProductLevel: boolean }[];
      const sizeLevelOpts = opts.filter((o) => !o.isProductLevel);
      if (sizeLevelOpts.length === 0) return 0;
      return sizeLevelOpts.reduce((acc, opt) => acc * opt.values.length, 1);
    } catch {
      return 0;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{parentProducts.length} products</p>
        </div>
        <Link
          href={`/clients/${params.clientId}/products/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="">All seasons</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.keyCode}>{s.stringValue}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.keyCode}>{c.stringValue}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
              Clear filters
            </button>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-4">
            <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
            <button onClick={() => bulkUpdateStatus(true)} className="text-sm text-gray-600 hover:text-gray-900">Enable</button>
            <button onClick={() => bulkUpdateStatus(false)} className="text-sm text-gray-600 hover:text-gray-900">Disable</button>
            <button onClick={bulkDelete} className="text-sm text-red-600 hover:text-red-700">Delete</button>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {hasFilters ? "No products match your filters" : "No products yet"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {hasFilters ? "Try adjusting your filters" : "Add your first product to get started"}
          </p>
          {!hasFilters && (
            <Link
              href={`/clients/${params.clientId}/products/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-14 px-2 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Season</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Wholesale</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/clients/${params.clientId}/products/${product.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{product.productNumber}</div>
                    {product.productName && <div className="text-sm text-gray-500">{product.productName}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.seasonCode || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.categoryCode || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">${product.wholesalePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-center">{getVariantCount(product) || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {product.enabled ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === product.id ? null : product.id)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-400" />
                      </button>
                      {actionMenuOpen === product.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button
                              onClick={() => handleDuplicate(product)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </>
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
