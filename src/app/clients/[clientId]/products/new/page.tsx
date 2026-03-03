"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Package,
} from "lucide-react";
import { ClassificationCombobox } from "../_components/classification-combobox";

interface ProductOption {
  name: string;
  values: string[];
  isProductLevel: boolean;
}

interface InventoryRecord {
  sizeCode: string;
  availableQuantity: number;
  availableDate: string;
  replenishmentQuantity: number;
  infiniteAvailability: boolean;
}

interface Option {
  id: string;
  elementType: string;
  keyCode: string;
  stringValue: string;
}

export default function NewProductPage() {
  const params = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  // Basic info
  const [productNumber, setProductNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  // Pricing
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [standardCost, setStandardCost] = useState("");

  // Classification
  const [seasonCode, setSeasonCode] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [genderCode, setGenderCode] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [divisionCode, setDivisionCode] = useState("");

  // Organization
  const [brandCode, setBrandCode] = useState("CC");
  const [catalogCode, setCatalogCode] = useState("");
  const [dimensionCode, setDimensionCode] = useState("");
  const [marketingSeasonCode, setMarketingSeasonCode] = useState("");
  const [styleGroupCode, setStyleGroupCode] = useState("");
  const [productType, setProductType] = useState("2");

  // Settings
  const [enabled, setEnabled] = useState(true);
  const [weight, setWeight] = useState("");
  const [ignoreDiscounts, setIgnoreDiscounts] = useState(false);

  // Flexible options
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [newOptionName, setNewOptionName] = useState("");

  // Inventory
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [bulkQty, setBulkQty] = useState("");
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);

  // New option creation
  const [newOptions, setNewOptions] = useState<{ elementType: string; keyCode: string; stringValue: string }[]>([]);

  useEffect(() => {
    fetchOptions();
  }, [params.clientId]);

  async function fetchOptions() {
    const res = await fetch(`/api/clients/${params.clientId}/options`);
    const data = await res.json();
    setOptions(data);
    setLoading(false);
  }

  function generateVariants(): string[] {
    const sizeLevelOptions = productOptions.filter((o) => !o.isProductLevel);
    if (sizeLevelOptions.length === 0) return [];

    function cartesian(arrays: string[][]): string[][] {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restCartesian = cartesian(rest);
      return first.flatMap((val) => restCartesian.map((r) => [val, ...r]));
    }

    const valueArrays = sizeLevelOptions.map((o) => o.values);
    const combinations = cartesian(valueArrays);
    return combinations.map((combo) => combo.join(" / "));
  }

  useEffect(() => {
    const variants = generateVariants();
    const today = new Date().toISOString().split("T")[0];
    
    setInventory((prev) => {
      const existing = new Map(prev.map((inv) => [inv.sizeCode, inv]));
      return variants.map((variant) => {
        if (existing.has(variant)) {
          return existing.get(variant)!;
        }
        return {
          sizeCode: variant,
          availableQuantity: 0,
          availableDate: today,
          replenishmentQuantity: 0,
          infiniteAvailability: false,
        };
      });
    });
  }, [productOptions]);

  function addOption() {
    if (!newOptionName.trim()) return;
    setProductOptions([
      ...productOptions,
      { name: newOptionName.trim(), values: [], isProductLevel: false },
    ]);
    setNewOptionName("");
  }

  function removeOption(index: number) {
    setProductOptions(productOptions.filter((_, i) => i !== index));
  }

  function addOptionValue(optionIndex: number, value: string) {
    if (!value.trim()) return;
    const updated = [...productOptions];
    if (!updated[optionIndex].values.includes(value.trim())) {
      updated[optionIndex].values.push(value.trim());
    }
    setProductOptions(updated);
  }

  function removeOptionValue(optionIndex: number, valueIndex: number) {
    const updated = [...productOptions];
    updated[optionIndex].values.splice(valueIndex, 1);
    setProductOptions(updated);
  }

  function toggleProductLevel(optionIndex: number) {
    const updated = [...productOptions];
    updated[optionIndex].isProductLevel = !updated[optionIndex].isProductLevel;
    setProductOptions(updated);
  }

  function applyBulkInventory() {
    const qty = parseInt(bulkQty) || 0;
    setInventory((prev) =>
      prev.map((inv) => ({
        ...inv,
        availableQuantity: qty,
        availableDate: bulkDate,
      }))
    );
  }

  function updateInventory(index: number, field: keyof InventoryRecord, value: any) {
    setInventory((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  const seasons = options.filter((o) => o.elementType === "Season");
  const colors = options.filter((o) => o.elementType === "Color");
  const genders = options.filter((o) => o.elementType === "Gender");
  const categories = options.filter((o) => o.elementType === "ProductCategory");
  const divisions = options.filter((o) => o.elementType === "Division");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productNumber.trim()) {
      alert("Product number is required");
      return;
    }
    if (!wholesalePrice) {
      alert("Wholesale price is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${params.clientId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productNumber: productNumber.trim(),
          productName: productName.trim() || null,
          shortDescription: shortDescription.trim() || null,
          longDescription: longDescription.trim() || null,
          wholesalePrice: parseFloat(wholesalePrice) || 0,
          retailPrice: parseFloat(retailPrice) || 0,
          discountedPrice: parseFloat(discountedPrice) || 0,
          standardCost: parseFloat(standardCost) || 0,
          seasonCode: seasonCode || null,
          colorCode: colorCode || null,
          genderCode: genderCode || null,
          categoryCode: categoryCode || null,
          divisionCode: divisionCode || null,
          brandCode: brandCode || "CC",
          catalogCode: catalogCode || null,
          dimensionCode: dimensionCode || null,
          marketingSeasonCode: marketingSeasonCode || null,
          styleGroupCode: styleGroupCode || null,
          productType: parseInt(productType) || 2,
          enabled,
          weight: parseFloat(weight) || 0,
          ignoreDiscounts,
          options: productOptions.length > 0 ? productOptions : null,
          inventory: inventory.length > 0 ? inventory : null,
          newOptions,
        }),
      });

      if (res.ok) {
        const product = await res.json();
        router.push(`/clients/${params.clientId}/products/${product.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create product");
      }
    } catch (error) {
      alert("Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const variants = generateVariants();

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.clientId}/products`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Add product</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${params.clientId}/products`}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Discard
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productNumber}
                  onChange={(e) => setProductNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="e.g., CNC-P1001"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Used as image filename and unique identifier</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="e.g., Classic Polo Shirt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="Brief one-line description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Long description</label>
                <textarea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="Full product description"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Media</h2>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <Package className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-1">Image upload coming soon</p>
              <p className="text-xs text-gray-400">Will be saved as {productNumber || "PRODUCT_NUMBER"}.jpg</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wholesale price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retail price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discounted price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={standardCost}
                    onChange={(e) => setStandardCost(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Options</h2>
            <p className="text-sm text-gray-500 mb-4">
              Define product options like size, color, material, etc. Options marked as "Creates separate products" will generate individual products in RepSpark for each value.
            </p>

            {productOptions.length > 0 && (
              <div className="space-y-4 mb-4">
                {productOptions.map((option, optionIndex) => (
                  <div key={optionIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{option.name}</span>
                        <label className="flex items-center gap-2 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={option.isProductLevel}
                            onChange={() => toggleProductLevel(optionIndex)}
                            className="rounded border-gray-300"
                          />
                          Creates separate products
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOption(optionIndex)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {option.values.map((value, valueIndex) => (
                        <span
                          key={valueIndex}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                        >
                          {value}
                          <button
                            type="button"
                            onClick={() => removeOptionValue(optionIndex, valueIndex)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add value and press Enter"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          addOptionValue(optionIndex, input.value);
                          input.value = "";
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Option name (e.g., Size, Color, Material)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
              />
              <button
                type="button"
                onClick={addOption}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
              >
                Add option
              </button>
            </div>
          </div>

          {variants.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Inventory ({variants.length} variants)
              </h2>

              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Bulk set:</span>
                <input
                  type="number"
                  value={bulkQty}
                  onChange={(e) => setBulkQty(e.target.value)}
                  placeholder="Qty"
                  className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                />
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={applyBulkInventory}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Apply to all
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Variant</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Available Qty</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Available Date</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Replenish Qty</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">Infinite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventory.map((inv, index) => (
                      <tr key={inv.sizeCode}>
                        <td className="px-4 py-2 font-medium">{inv.sizeCode}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={inv.availableQuantity}
                            onChange={(e) =>
                              updateInventory(index, "availableQuantity", parseInt(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={inv.availableDate}
                            onChange={(e) => updateInventory(index, "availableDate", e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={inv.replenishmentQuantity}
                            onChange={(e) =>
                              updateInventory(index, "replenishmentQuantity", parseInt(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={inv.infiniteAvailability}
                            onChange={(e) =>
                              updateInventory(index, "infiniteAvailability", e.target.checked)
                            }
                            className="rounded border-gray-300"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Status</h2>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Classification</h2>
            <div className="space-y-4">
              <ClassificationCombobox
                label="Season"
                value={seasonCode}
                options={seasons}
                onChange={setSeasonCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Season" || o.keyCode !== keyCode),
                    { elementType: "Season", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create season..."
                multiple={true}
              />
              <ClassificationCombobox
                label="Color"
                value={colorCode}
                options={colors}
                onChange={setColorCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Color" || o.keyCode !== keyCode),
                    { elementType: "Color", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create color..."
              />
              <ClassificationCombobox
                label="Gender"
                value={genderCode}
                options={genders}
                onChange={setGenderCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Gender" || o.keyCode !== keyCode),
                    { elementType: "Gender", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create gender..."
              />
              <ClassificationCombobox
                label="Category"
                value={categoryCode}
                options={categories}
                onChange={setCategoryCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "ProductCategory" || o.keyCode !== keyCode),
                    { elementType: "ProductCategory", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create category..."
              />
              <ClassificationCombobox
                label="Division"
                value={divisionCode}
                options={divisions}
                onChange={setDivisionCode}
                onCreateNew={(keyCode, stringValue) => {
                  setNewOptions((prev) => [
                    ...prev.filter((o) => o.elementType !== "Division" || o.keyCode !== keyCode),
                    { elementType: "Division", keyCode, stringValue },
                  ]);
                }}
                placeholder="Select or create division..."
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand code</label>
                <input
                  type="text"
                  value={brandCode}
                  onChange={(e) => setBrandCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catalog code</label>
                <input
                  type="text"
                  value={catalogCode}
                  onChange={(e) => setCatalogCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style group</label>
                <input
                  type="text"
                  value={styleGroupCode}
                  onChange={(e) => setStyleGroupCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product type</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="2">Regular</option>
                  <option value="3">Customization</option>
                  <option value="4">Bundle</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="0.00"
                />
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={ignoreDiscounts}
                  onChange={(e) => setIgnoreDiscounts(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Ignore discounts</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
