"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  Loader2,
  Trash2,
  Upload,
  Plus,
  Check,
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

interface Decoration {
  id: string;
  productNumber: string;
  productName: string | null;
  productType: number;
  wholesalePrice: number;
  imageUrl: string | null;
  league: string | null;
  teamCode: string | null;
  teamName: string | null;
}

interface LicensedConfig {
  id: string;
  decorationId: string;
  decoration: Decoration;
  placement: string;
  colorChoice: string;
  finishedGoodName: string | null;
  finishedGoodImageUrl: string | null;
  finishedGoodShortDesc: string | null;
  finishedGoodLongDesc: string | null;
  wholesalePrice: number | null;
  retailPrice: number | null;
  dateRangeBegin: string | null;
  dateRangeEnd: string | null;
  enabled: boolean;
}

interface Product {
  id: string;
  productNumber: string;
  productName: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  wholesalePrice: number;
  retailPrice: number;
  discountedPrice: number;
  standardCost: number;
  seasonCode: string | null;
  colorCode: string | null;
  genderCode: string | null;
  categoryCode: string | null;
  divisionCode: string | null;
  brandCode: string;
  catalogCode: string | null;
  dimensionCode: string | null;
  marketingSeasonCode: string | null;
  styleGroupCode: string | null;
  productType: number;
  enabled: boolean;
  weight: number;
  ignoreDiscounts: boolean;
  imageUrl: string | null;
  options: string | null;
  insigniaEnabled: boolean;
  allowedPlacements: string | null;
  finishPlacementRules: string | null;
  insigniaColorOptions: string | null;
  inventory: {
    sizeCode: string;
    availableQuantity: number;
    availableDate: string;
    replenishmentQuantity: number;
    infiniteAvailability: boolean;
  }[];
  licensedConfigs?: LicensedConfig[];
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  const [productNumber, setProductNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [standardCost, setStandardCost] = useState("");

  const [seasonCode, setSeasonCode] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [genderCode, setGenderCode] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [divisionCode, setDivisionCode] = useState("");

  const [brandCode, setBrandCode] = useState("CC");
  const [catalogCode, setCatalogCode] = useState("");
  const [dimensionCode, setDimensionCode] = useState("");
  const [marketingSeasonCode, setMarketingSeasonCode] = useState("");
  const [styleGroupCode, setStyleGroupCode] = useState("");
  const [productType, setProductType] = useState("2");

  const [enabled, setEnabled] = useState(true);
  const [weight, setWeight] = useState("");
  const [ignoreDiscounts, setIgnoreDiscounts] = useState(false);

  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [newOptionName, setNewOptionName] = useState("");

  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [bulkQty, setBulkQty] = useState("");
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);

  const [newOptions, setNewOptions] = useState<{ elementType: string; keyCode: string; stringValue: string }[]>([]);

  // Insignia state
  const [insigniaEnabled, setInsigniaEnabled] = useState(false);
  const [allowedPlacements, setAllowedPlacements] = useState<string[]>([]);
  const [allowedFinishTypes, setAllowedFinishTypes] = useState<string[]>([]);
  const [finishPlacementRules, setFinishPlacementRules] = useState<{ finish: string; placement: string }[]>([]);
  
  // Inline creation for insignia
  const [showNewPlacement, setShowNewPlacement] = useState(false);
  const [newPlacementCode, setNewPlacementCode] = useState("");
  const [newPlacementName, setNewPlacementName] = useState("");
  const [showNewFinish, setShowNewFinish] = useState(false);
  const [newFinishCode, setNewFinishCode] = useState("");
  const [newFinishName, setNewFinishName] = useState("");

  // Licensed configurations state
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [licensedConfigs, setLicensedConfigs] = useState<LicensedConfig[]>([]);
  const [showLicensedModal, setShowLicensedModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LicensedConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Licensed config form
  const [configForm, setConfigForm] = useState({
    decorationId: "",
    createNewLogo: false,
    newLogoName: "",
    newLogoNumber: "",
    newLogoLeague: "",
    newLogoTeamCode: "",
    newLogoTeamName: "",
    newLogoPrice: "",
    placement: "",
    createNewPlacement: false,
    newPlacementCode: "",
    newPlacementName: "",
    colorChoice: "",
    createNewColorChoice: false,
    newColorChoiceCode: "",
    newColorChoiceName: "",
    finishedGoodName: "",
    finishedGoodImageUrl: "",
    finishedGoodShortDesc: "",
    finishedGoodLongDesc: "",
    wholesalePrice: "",
    retailPrice: "",
    dateRangeBegin: "",
    dateRangeEnd: "",
    enabled: true,
  });

  useEffect(() => {
    fetchData();
  }, [params.clientId, params.productId]);

  async function fetchData() {
    const [productRes, optionsRes, decorationsRes] = await Promise.all([
      fetch(`/api/clients/${params.clientId}/products/${params.productId}`),
      fetch(`/api/clients/${params.clientId}/options`),
      fetch(`/api/clients/${params.clientId}/decorations?type=licensed`),
    ]);

    const [productData, optionsData, decorationsData] = await Promise.all([
      productRes.json(),
      optionsRes.json(),
      decorationsRes.json(),
    ]);

    if (productRes.ok) {
      setProduct(productData);
      
      setProductNumber(productData.productNumber || "");
      setProductName(productData.productName || "");
      setShortDescription(productData.shortDescription || "");
      setLongDescription(productData.longDescription || "");
      setWholesalePrice(productData.wholesalePrice?.toString() || "");
      setRetailPrice(productData.retailPrice?.toString() || "");
      setDiscountedPrice(productData.discountedPrice?.toString() || "");
      setStandardCost(productData.standardCost?.toString() || "");
      setSeasonCode(productData.seasonCode || "");
      setColorCode(productData.colorCode || "");
      setGenderCode(productData.genderCode || "");
      setCategoryCode(productData.categoryCode || "");
      setDivisionCode(productData.divisionCode || "");
      setBrandCode(productData.brandCode || "CC");
      setCatalogCode(productData.catalogCode || "");
      setDimensionCode(productData.dimensionCode || "");
      setMarketingSeasonCode(productData.marketingSeasonCode || "");
      setStyleGroupCode(productData.styleGroupCode || "");
      setProductType(productData.productType?.toString() || "2");
      setEnabled(productData.enabled ?? true);
      setWeight(productData.weight?.toString() || "");
      setIgnoreDiscounts(productData.ignoreDiscounts ?? false);

      // Insignia fields
      setInsigniaEnabled(productData.insigniaEnabled ?? false);
      if (productData.allowedPlacements) {
        try {
          setAllowedPlacements(JSON.parse(productData.allowedPlacements));
        } catch {
          setAllowedPlacements([]);
        }
      }
      if (productData.finishPlacementRules) {
        try {
          const rules = JSON.parse(productData.finishPlacementRules);
          setFinishPlacementRules(rules);
          const finishes = Array.from(new Set(rules.map((r: { finish: string }) => r.finish)));
          setAllowedFinishTypes(finishes as string[]);
        } catch {
          setFinishPlacementRules([]);
        }
      }

      // Licensed configs
      if (productData.licensedConfigs) {
        setLicensedConfigs(productData.licensedConfigs);
      }

      if (productData.options) {
        try {
          setProductOptions(JSON.parse(productData.options));
        } catch {
          setProductOptions([]);
        }
      }

      if (productData.inventory && Array.isArray(productData.inventory)) {
        setInventory(
          productData.inventory.map((inv: { sizeCode: string; availableQuantity?: number; availableDate?: string; replenishmentQuantity?: number; infiniteAvailability?: boolean }) => ({
            sizeCode: inv.sizeCode,
            availableQuantity: inv.availableQuantity || 0,
            availableDate: inv.availableDate ? inv.availableDate.split("T")[0] : new Date().toISOString().split("T")[0],
            replenishmentQuantity: inv.replenishmentQuantity || 0,
            infiniteAvailability: inv.infiniteAvailability || false,
          }))
        );
      }
    }

    setOptions(optionsData);
    if (decorationsRes.ok) {
      setDecorations(decorationsData);
    }
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
    if (variants.length === 0) return;
    
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

  function updateInventory(index: number, field: keyof InventoryRecord, value: unknown) {
    setInventory((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  // Insignia inline creation
  function addNewPlacement() {
    if (!newPlacementCode.trim() || !newPlacementName.trim()) return;
    const code = newPlacementCode.toUpperCase();
    
    setNewOptions((prev) => [
      ...prev.filter((o) => !(o.elementType === "Placement" && o.keyCode === code)),
      { elementType: "Placement", keyCode: code, stringValue: newPlacementName },
    ]);
    
    setOptions((prev) => [
      ...prev,
      { id: `new-${code}`, elementType: "Placement", keyCode: code, stringValue: newPlacementName },
    ]);
    
    setAllowedPlacements((prev) => [...prev, code]);
    
    setNewPlacementCode("");
    setNewPlacementName("");
    setShowNewPlacement(false);
  }

  function addNewFinishType() {
    if (!newFinishCode.trim() || !newFinishName.trim()) return;
    const code = newFinishCode.toUpperCase();
    
    setNewOptions((prev) => [
      ...prev.filter((o) => !(o.elementType === "FinishType" && o.keyCode === code)),
      { elementType: "FinishType", keyCode: code, stringValue: newFinishName },
    ]);
    
    setOptions((prev) => [
      ...prev,
      { id: `new-${code}`, elementType: "FinishType", keyCode: code, stringValue: newFinishName },
    ]);
    
    setAllowedFinishTypes((prev) => [...prev, code]);
    
    setNewFinishCode("");
    setNewFinishName("");
    setShowNewFinish(false);
  }

  // Licensed config functions
  function openAddConfigModal() {
    setEditingConfig(null);
    setConfigForm({
      decorationId: "",
      createNewLogo: false,
      newLogoName: "",
      newLogoNumber: "",
      newLogoLeague: "",
      newLogoTeamCode: "",
      newLogoTeamName: "",
      newLogoPrice: "",
      placement: "",
      createNewPlacement: false,
      newPlacementCode: "",
      newPlacementName: "",
      colorChoice: "",
      createNewColorChoice: false,
      newColorChoiceCode: "",
      newColorChoiceName: "",
      finishedGoodName: "",
      finishedGoodImageUrl: "",
      finishedGoodShortDesc: "",
      finishedGoodLongDesc: "",
      wholesalePrice: "",
      retailPrice: "",
      dateRangeBegin: "",
      dateRangeEnd: "",
      enabled: true,
    });
    setShowLicensedModal(true);
  }

  function openEditConfigModal(config: LicensedConfig) {
    setEditingConfig(config);
    setConfigForm({
      decorationId: config.decorationId,
      createNewLogo: false,
      newLogoName: "",
      newLogoNumber: "",
      newLogoLeague: "",
      newLogoTeamCode: "",
      newLogoTeamName: "",
      newLogoPrice: "",
      placement: config.placement,
      createNewPlacement: false,
      newPlacementCode: "",
      newPlacementName: "",
      colorChoice: config.colorChoice,
      createNewColorChoice: false,
      newColorChoiceCode: "",
      newColorChoiceName: "",
      finishedGoodName: config.finishedGoodName || "",
      finishedGoodImageUrl: config.finishedGoodImageUrl || "",
      finishedGoodShortDesc: config.finishedGoodShortDesc || "",
      finishedGoodLongDesc: config.finishedGoodLongDesc || "",
      wholesalePrice: config.wholesalePrice?.toString() || "",
      retailPrice: config.retailPrice?.toString() || "",
      dateRangeBegin: config.dateRangeBegin?.split("T")[0] || "",
      dateRangeEnd: config.dateRangeEnd?.split("T")[0] || "",
      enabled: config.enabled,
    });
    setShowLicensedModal(true);
  }

  async function saveConfig() {
    setSavingConfig(true);
    
    try {
      const needsLogo = configForm.createNewLogo 
        ? (configForm.newLogoName && configForm.newLogoNumber)
        : configForm.decorationId;
      const needsPlacement = configForm.createNewPlacement
        ? (configForm.newPlacementCode && configForm.newPlacementName)
        : configForm.placement;
      const needsColorChoice = configForm.createNewColorChoice
        ? (configForm.newColorChoiceCode && configForm.newColorChoiceName)
        : configForm.colorChoice;

      if (!needsLogo || !needsPlacement || !needsColorChoice) {
        alert("Logo, placement, and logo color are required");
        setSavingConfig(false);
        return;
      }

      const method = editingConfig ? "PATCH" : "POST";
      const url = editingConfig
        ? `/api/clients/${params.clientId}/products/${params.productId}/licensed-configs/${editingConfig.id}`
        : `/api/clients/${params.clientId}/products/${params.productId}/licensed-configs`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decorationId: configForm.createNewLogo ? null : configForm.decorationId,
          createNewLogo: configForm.createNewLogo,
          newLogo: configForm.createNewLogo ? {
            productNumber: configForm.newLogoNumber,
            productName: configForm.newLogoName,
            league: configForm.newLogoLeague,
            teamCode: configForm.newLogoTeamCode,
            teamName: configForm.newLogoTeamName,
            wholesalePrice: parseFloat(configForm.newLogoPrice) || 0,
          } : null,
          placement: configForm.createNewPlacement ? configForm.newPlacementCode.toUpperCase() : configForm.placement,
          createNewPlacement: configForm.createNewPlacement,
          newPlacement: configForm.createNewPlacement ? {
            keyCode: configForm.newPlacementCode.toUpperCase(),
            stringValue: configForm.newPlacementName,
          } : null,
          colorChoice: configForm.createNewColorChoice ? configForm.newColorChoiceCode.toUpperCase() : configForm.colorChoice,
          createNewColorChoice: configForm.createNewColorChoice,
          newColorChoice: configForm.createNewColorChoice ? {
            keyCode: configForm.newColorChoiceCode.toUpperCase(),
            stringValue: configForm.newColorChoiceName,
          } : null,
          finishedGoodName: configForm.finishedGoodName || null,
          finishedGoodImageUrl: configForm.finishedGoodImageUrl || null,
          finishedGoodShortDesc: configForm.finishedGoodShortDesc || null,
          finishedGoodLongDesc: configForm.finishedGoodLongDesc || null,
          wholesalePrice: configForm.wholesalePrice ? parseFloat(configForm.wholesalePrice) : null,
          retailPrice: configForm.retailPrice ? parseFloat(configForm.retailPrice) : null,
          dateRangeBegin: configForm.dateRangeBegin || null,
          dateRangeEnd: configForm.dateRangeEnd || null,
          enabled: configForm.enabled,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingConfig) {
          setLicensedConfigs((prev) =>
            prev.map((c) => (c.id === saved.id ? saved : c))
          );
        } else {
          setLicensedConfigs((prev) => [...prev, saved]);
        }
        if (configForm.createNewLogo) {
          const decRes = await fetch(`/api/clients/${params.clientId}/decorations?type=licensed`);
          if (decRes.ok) {
            setDecorations(await decRes.json());
          }
        }
        if (configForm.createNewPlacement || configForm.createNewColorChoice) {
          const optRes = await fetch(`/api/clients/${params.clientId}/options`);
          if (optRes.ok) {
            setOptions(await optRes.json());
          }
        }
        setShowLicensedModal(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  }

  async function deleteConfig(id: string) {
    if (!confirm("Delete this configuration?")) return;

    const res = await fetch(
      `/api/clients/${params.clientId}/products/${params.productId}/licensed-configs/${id}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setLicensedConfigs((prev) => prev.filter((c) => c.id !== id));
    }
  }

  async function handleImageUpload(file: File) {
    if (!product) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", product.id);

    try {
      const res = await fetch(`/api/clients/${params.clientId}/images`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setProduct({ ...product, imageUrl: url });
      } else {
        alert("Failed to upload image");
      }
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageDelete() {
    if (!product || !confirm("Delete this image?")) return;

    try {
      const res = await fetch(`/api/clients/${params.clientId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        setProduct({ ...product, imageUrl: null });
      }
    } catch {
      alert("Failed to delete image");
    }
  }

  const seasons = options.filter((o) => o.elementType === "Season");
  const colors = options.filter((o) => o.elementType === "Color");
  const genders = options.filter((o) => o.elementType === "Gender");
  const categories = options.filter((o) => o.elementType === "ProductCategory");
  const divisions = options.filter((o) => o.elementType === "Division");
  const placements = options.filter((o) => o.elementType === "Placement");
  const finishTypes = options.filter((o) => o.elementType === "FinishType");
  const colorChoices = options.filter((o) => o.elementType === "ColorChoice");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const errors: string[] = [];
    
    if (!productNumber.trim()) {
      errors.push("Product number is required");
    }
    if (!wholesalePrice) {
      errors.push("Wholesale price is required");
    }
    if (!seasonCode) {
      errors.push("Season is required");
    }
    if (!colorCode) {
      errors.push("Color is required");
    }
    if (!genderCode) {
      errors.push("Gender is required");
    }
    if (!categoryCode) {
      errors.push("Category is required");
    }
    
    const sizeOptions = productOptions.filter((o) => !o.isProductLevel);
    if (sizeOptions.length === 0 || sizeOptions.every((o) => o.values.length === 0)) {
      errors.push("At least one size option with values is required (e.g., Size: S, M, L)");
    }
    
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${params.clientId}/products/${params.productId}`, {
        method: "PATCH",
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
          insigniaEnabled,
          allowedPlacements: allowedPlacements.length > 0 ? allowedPlacements : null,
          finishPlacementRules: finishPlacementRules.length > 0 ? finishPlacementRules : null,
          insigniaColorOptions: allowedFinishTypes.length > 0 ? allowedFinishTypes : null,
        }),
      });

      if (res.ok) {
        router.push(`/clients/${params.clientId}/products`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update product");
      }
    } catch {
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${productNumber}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${params.clientId}/products/${params.productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/clients/${params.clientId}/products`);
      } else {
        alert("Failed to delete product");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
        <Link href={`/clients/${params.clientId}/products`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to products
        </Link>
      </div>
    );
  }

  const variants = generateVariants();
  const isBaseProduct = parseInt(productType) === 2;

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/clients/${params.clientId}/products`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{product.productNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
          <Link href={`/clients/${params.clientId}/products`} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
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
          {/* Basic Information */}
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Long description</label>
                <textarea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Media</h2>
            {product.imageUrl ? (
              <div className="relative">
                <img
                  src={product.imageUrl}
                  alt={productNumber}
                  className="w-full h-64 object-contain rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-red-50"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center block cursor-pointer hover:border-gray-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="h-10 w-10 mx-auto text-gray-400 animate-spin mb-3" />
                ) : (
                  <Upload className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                )}
                <p className="text-sm text-gray-500 mb-1">
                  {uploading ? "Uploading..." : "Click to upload image"}
                </p>
                <p className="text-xs text-gray-400">Will be saved as {productNumber}.jpg</p>
              </label>
            )}
          </div>

          {/* Pricing */}
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
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sizes / Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Sizes / Options <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Add at least one size option (e.g., Size: S, M, L, XL). This determines the available variants for ordering.
            </p>

            {productOptions.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  You must add at least one size option before saving.
                </p>
              </div>
            )}

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
                placeholder="Option name (e.g., Size)"
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

          {/* Inventory */}
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

          {/* Insignia Settings */}
          {isBaseProduct && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Insignia Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={insigniaEnabled}
                    onChange={(e) => setInsigniaEnabled(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Enable Insignia</span>
                </label>
                <p className="text-xs text-gray-500 -mt-2 ml-7">
                  Allow customers to add logo decorations to this product
                </p>

                {insigniaEnabled && (
                  <>
                    {/* Placements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allowed Placements
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {allowedPlacements.map((code) => {
                          const placement = placements.find((p) => p.keyCode === code);
                          return (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm"
                            >
                              {placement?.stringValue || code}
                              <button
                                type="button"
                                onClick={() => setAllowedPlacements(allowedPlacements.filter((p) => p !== code))}
                                className="hover:text-red-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                        {!showNewPlacement && (
                          <button
                            type="button"
                            onClick={() => setShowNewPlacement(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-lg text-sm hover:border-gray-400"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </button>
                        )}
                      </div>
                      
                      {showNewPlacement && (
                        <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                          <select
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            onChange={(e) => {
                              if (e.target.value === "__new__") {
                                // Keep form open for new creation
                              } else if (e.target.value) {
                                setAllowedPlacements([...allowedPlacements, e.target.value]);
                                setShowNewPlacement(false);
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>Select existing...</option>
                            {placements
                              .filter((p) => !allowedPlacements.includes(p.keyCode))
                              .map((p) => (
                                <option key={p.id} value={p.keyCode}>{p.stringValue}</option>
                              ))}
                            <option value="__new__">+ Create new placement</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowNewPlacement(false)}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      {showNewPlacement && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newPlacementCode}
                            onChange={(e) => setNewPlacementCode(e.target.value.toUpperCase())}
                            placeholder="Code (e.g., LC)"
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={newPlacementName}
                            onChange={(e) => setNewPlacementName(e.target.value)}
                            placeholder="Name (e.g., Left Chest)"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={addNewPlacement}
                            disabled={!newPlacementCode || !newPlacementName}
                            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Finish Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allowed Finish Types
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {allowedFinishTypes.map((code) => {
                          const finish = finishTypes.find((f) => f.keyCode === code);
                          return (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm"
                            >
                              {finish?.stringValue || code}
                              <button
                                type="button"
                                onClick={() => setAllowedFinishTypes(allowedFinishTypes.filter((f) => f !== code))}
                                className="hover:text-red-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                        {!showNewFinish && (
                          <button
                            type="button"
                            onClick={() => setShowNewFinish(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-lg text-sm hover:border-gray-400"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </button>
                        )}
                      </div>
                      
                      {showNewFinish && (
                        <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                          <select
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            onChange={(e) => {
                              if (e.target.value === "__new__") {
                                // Keep form open for new creation
                              } else if (e.target.value) {
                                setAllowedFinishTypes([...allowedFinishTypes, e.target.value]);
                                setShowNewFinish(false);
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>Select existing...</option>
                            {finishTypes
                              .filter((f) => !allowedFinishTypes.includes(f.keyCode))
                              .map((f) => (
                                <option key={f.id} value={f.keyCode}>{f.stringValue}</option>
                              ))}
                            <option value="__new__">+ Create new finish type</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowNewFinish(false)}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      {showNewFinish && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newFinishCode}
                            onChange={(e) => setNewFinishCode(e.target.value.toUpperCase())}
                            placeholder="Code (e.g., EMB)"
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={newFinishName}
                            onChange={(e) => setNewFinishName(e.target.value)}
                            placeholder="Name (e.g., Embroidery)"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={addNewFinishType}
                            disabled={!newFinishCode || !newFinishName}
                            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Finish + Placement Rules */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Finish + Placement Rules
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Optional: Restrict which finish types can be used at which placements
                      </p>
                      
                      {finishPlacementRules.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {finishPlacementRules.map((rule, index) => {
                            const finish = finishTypes.find((f) => f.keyCode === rule.finish);
                            const placement = placements.find((p) => p.keyCode === rule.placement);
                            return (
                              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <span className="text-sm">{finish?.stringValue || rule.finish}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-sm">{placement?.stringValue || rule.placement}</span>
                                <button
                                  type="button"
                                  onClick={() => setFinishPlacementRules(finishPlacementRules.filter((_, i) => i !== index))}
                                  className="ml-auto p-1 text-gray-400 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(allowedFinishTypes.length > 0 && allowedPlacements.length > 0) && (
                        <div className="flex gap-2">
                          <select
                            id="rule-finish"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            defaultValue=""
                          >
                            <option value="" disabled>Select finish...</option>
                            {allowedFinishTypes.map((code) => {
                              const finish = finishTypes.find((f) => f.keyCode === code);
                              return <option key={code} value={code}>{finish?.stringValue || code}</option>;
                            })}
                          </select>
                          <select
                            id="rule-placement"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            defaultValue=""
                          >
                            <option value="" disabled>Select placement...</option>
                            {allowedPlacements.map((code) => {
                              const placement = placements.find((p) => p.keyCode === code);
                              return <option key={code} value={code}>{placement?.stringValue || code}</option>;
                            })}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const finishSelect = document.getElementById("rule-finish") as HTMLSelectElement;
                              const placementSelect = document.getElementById("rule-placement") as HTMLSelectElement;
                              if (finishSelect.value && placementSelect.value) {
                                setFinishPlacementRules([
                                  ...finishPlacementRules,
                                  { finish: finishSelect.value, placement: placementSelect.value },
                                ]);
                                finishSelect.value = "";
                                placementSelect.value = "";
                              }
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Licensed Configurations */}
          {isBaseProduct && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Licensed Configurations</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Pre-configured licensed logos for this product (creates finished goods)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddConfigModal}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>

              {licensedConfigs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No licensed configurations yet
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Logo</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Placement</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Logo Color</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Date Range</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {licensedConfigs.map((config) => {
                        const placementLabel = placements.find((p) => p.keyCode === config.placement)?.stringValue || config.placement;
                        const colorLabel = colorChoices.find((c) => c.keyCode === config.colorChoice)?.stringValue || config.colorChoice;
                        return (
                          <tr key={config.id}>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {config.decoration?.imageUrl && (
                                  <img
                                    src={config.decoration.imageUrl}
                                    alt=""
                                    className="h-8 w-8 object-contain rounded"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">
                                    {config.decoration?.teamName || config.decoration?.productName}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {config.decoration?.league}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">{placementLabel}</td>
                            <td className="px-4 py-2">{colorLabel}</td>
                            <td className="px-4 py-2 text-xs text-gray-500">
                              {config.dateRangeBegin && config.dateRangeEnd
                                ? `${config.dateRangeBegin.split("T")[0]} - ${config.dateRangeEnd.split("T")[0]}`
                                : "—"}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                  config.enabled
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {config.enabled ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => openEditConfigModal(config)}
                                className="text-blue-600 hover:underline text-sm mr-3"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteConfig(config.id)}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
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
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Classification</h2>
            <p className="text-xs text-gray-500 mb-4">Required for RepSpark sync</p>
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
                required={true}
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
                required={true}
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
                required={true}
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
                required={true}
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
                  <option value="2">Base Product (Type 2)</option>
                  <option value="3">Insignia Logo (Type 3)</option>
                  <option value="4">Licensed Logo (Type 4)</option>
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

      {/* Licensed Configuration Modal */}
      {showLicensedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">
                {editingConfig ? "Edit Licensed Configuration" : "Add Licensed Configuration"}
              </h3>
              <button
                type="button"
                onClick={() => setShowLicensedModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Logo Selection */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Logo</h4>
                  <p className="text-xs text-gray-500">The licensed logo to apply to this product</p>
                </div>
                
                {!configForm.createNewLogo ? (
                  <select
                    value={configForm.decorationId}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setConfigForm({ ...configForm, createNewLogo: true, decorationId: "" });
                      } else {
                        setConfigForm({ ...configForm, decorationId: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">Select existing logo...</option>
                    {decorations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.teamName || d.productName} {d.league ? `(${d.league})` : ""}
                      </option>
                    ))}
                    <option value="__new__">+ Create new logo</option>
                  </select>
                ) : (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Create New Logo</span>
                      <button
                        type="button"
                        onClick={() => setConfigForm({ ...configForm, createNewLogo: false })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Select existing instead
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Logo Name *</label>
                        <input
                          type="text"
                          value={configForm.newLogoName}
                          onChange={(e) => setConfigForm({ ...configForm, newLogoName: e.target.value })}
                          placeholder="Alabama Crimson Tide"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Logo Product # *</label>
                        <input
                          type="text"
                          value={configForm.newLogoNumber}
                          onChange={(e) => setConfigForm({ ...configForm, newLogoNumber: e.target.value.toUpperCase() })}
                          placeholder="CC-NCAA-ALA-001"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">Unique identifier for this logo</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">League</label>
                        <input
                          type="text"
                          value={configForm.newLogoLeague}
                          onChange={(e) => setConfigForm({ ...configForm, newLogoLeague: e.target.value.toUpperCase() })}
                          placeholder="NCAA, MLB, NFL"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Team Code</label>
                        <input
                          type="text"
                          value={configForm.newLogoTeamCode}
                          onChange={(e) => setConfigForm({ ...configForm, newLogoTeamCode: e.target.value.toUpperCase() })}
                          placeholder="ALA, UGA, NYY"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Team Name</label>
                        <input
                          type="text"
                          value={configForm.newLogoTeamName}
                          onChange={(e) => setConfigForm({ ...configForm, newLogoTeamName: e.target.value })}
                          placeholder="Alabama"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Logo Upcharge</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={configForm.newLogoPrice}
                            onChange={(e) => setConfigForm({ ...configForm, newLogoPrice: e.target.value })}
                            placeholder="12.00"
                            className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Placement & Logo Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placement <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Where the logo appears on the product</p>
                  
                  {!configForm.createNewPlacement ? (
                    <select
                      value={configForm.placement}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setConfigForm({ ...configForm, createNewPlacement: true, placement: "" });
                        } else {
                          setConfigForm({ ...configForm, placement: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Select...</option>
                      {placements.map((p) => (
                        <option key={p.id} value={p.keyCode}>{p.stringValue}</option>
                      ))}
                      <option value="__new__">+ Create new</option>
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={configForm.newPlacementCode}
                          onChange={(e) => setConfigForm({ ...configForm, newPlacementCode: e.target.value.toUpperCase() })}
                          placeholder="LC"
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={configForm.newPlacementName}
                          onChange={(e) => setConfigForm({ ...configForm, newPlacementName: e.target.value })}
                          placeholder="Left Chest"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfigForm({ ...configForm, createNewPlacement: false })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Color <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Color variant of the logo (e.g., Red, White)</p>
                  
                  {!configForm.createNewColorChoice ? (
                    <select
                      value={configForm.colorChoice}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setConfigForm({ ...configForm, createNewColorChoice: true, colorChoice: "" });
                        } else {
                          setConfigForm({ ...configForm, colorChoice: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Select...</option>
                      {colorChoices.map((c) => (
                        <option key={c.id} value={c.keyCode}>{c.stringValue}</option>
                      ))}
                      <option value="__new__">+ Create new</option>
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={configForm.newColorChoiceCode}
                          onChange={(e) => setConfigForm({ ...configForm, newColorChoiceCode: e.target.value.toUpperCase() })}
                          placeholder="RED"
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={configForm.newColorChoiceName}
                          onChange={(e) => setConfigForm({ ...configForm, newColorChoiceName: e.target.value })}
                          placeholder="Team Red"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfigForm({ ...configForm, createNewColorChoice: false })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Finished Good Display */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Finished Good Display</h4>
                  <p className="text-xs text-gray-500">How this product + logo combination appears to customers</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={configForm.finishedGoodName}
                    onChange={(e) => setConfigForm({ ...configForm, finishedGoodName: e.target.value })}
                    placeholder="Auto-generated if blank (e.g., Seaside Polo - Alabama)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={configForm.finishedGoodImageUrl}
                    onChange={(e) => setConfigForm({ ...configForm, finishedGoodImageUrl: e.target.value })}
                    placeholder="https://... (falls back to base product image if blank)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={configForm.finishedGoodShortDesc}
                    onChange={(e) => setConfigForm({ ...configForm, finishedGoodShortDesc: e.target.value })}
                    placeholder="Brief description for product lists"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Long Description
                  </label>
                  <textarea
                    value={configForm.finishedGoodLongDesc}
                    onChange={(e) => setConfigForm({ ...configForm, finishedGoodLongDesc: e.target.value })}
                    placeholder="Detailed description shown on product detail page"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Pricing Overrides</h4>
                  <p className="text-xs text-gray-500">Override the default price (base + logo) for this combination</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wholesale Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={configForm.wholesalePrice}
                        onChange={(e) => setConfigForm({ ...configForm, wholesalePrice: e.target.value })}
                        placeholder="Default"
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retail Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={configForm.retailPrice}
                        onChange={(e) => setConfigForm({ ...configForm, retailPrice: e.target.value })}
                        placeholder="Default"
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Availability</h4>
                  <p className="text-xs text-gray-500">When this configuration is available for purchase</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={configForm.dateRangeBegin}
                      onChange={(e) => setConfigForm({ ...configForm, dateRangeBegin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={configForm.dateRangeEnd}
                      onChange={(e) => setConfigForm({ ...configForm, dateRangeEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={configForm.enabled}
                    onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setShowLicensedModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
              >
                {savingConfig && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingConfig ? "Save Changes" : "Add Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
