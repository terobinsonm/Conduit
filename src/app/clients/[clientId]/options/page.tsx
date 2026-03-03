"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Filter } from "lucide-react";

interface Option {
  id: string;
  elementType: string;
  keyCode: string;
  stringValue: string;
  enabled: boolean;
}

const ELEMENT_TYPES = [
  "Season",
  "Color",
  "Gender",
  "ProductCategory",
  "SalesPerson",
  "CustomerTerms",
  "ShippingOption",
  "Division",
  "State",
  "Country",
];

export default function OptionsPage() {
  const params = useParams();
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, [params.clientId]);

  async function fetchOptions() {
    const response = await fetch(`/api/clients/${params.clientId}/options`);
    const data = await response.json();
    setOptions(data);
    setLoading(false);
  }

  const filteredOptions = filter
    ? options.filter((o) => o.elementType === filter)
    : options;

  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.elementType]) {
      acc[option.elementType] = [];
    }
    acc[option.elementType].push(option);
    return acc;
  }, {} as Record<string, Option[]>);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      elementType: formData.get("elementType") as string,
      keyCode: formData.get("keyCode") as string,
      stringValue: formData.get("stringValue") as string,
      enabled: formData.get("enabled") === "on",
    };

    try {
      const url = editingOption
        ? `/api/clients/${params.clientId}/options/${editingOption.id}`
        : `/api/clients/${params.clientId}/options`;

      const response = await fetch(url, {
        method: editingOption ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchOptions();
        setShowModal(false);
        setEditingOption(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(option: Option) {
    if (!confirm(`Delete ${option.keyCode}?`)) return;

    await fetch(`/api/clients/${params.clientId}/options/${option.id}`, {
      method: "DELETE",
    });
    fetchOptions();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Options</h2>
          <p className="text-muted-foreground">
            Manage lookup tables (colors, seasons, etc.)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Option
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="">All Types</option>
          {ELEMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {filter && (
          <span className="text-sm text-muted-foreground">
            {filteredOptions.length} options
          </span>
        )}
      </div>

      {/* Options by Type */}
      <div className="space-y-6">
        {Object.entries(groupedOptions).map(([type, typeOptions]) => (
          <div key={type} className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold">{type}</h3>
              <p className="text-sm text-muted-foreground">
                {typeOptions.length} options
              </p>
            </div>
            <div className="divide-y">
              {typeOptions.map((option) => (
                <div
                  key={option.id}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {option.keyCode}
                    </code>
                    <span>{option.stringValue}</span>
                    {!option.enabled && (
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingOption(option);
                        setShowModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(option)}
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingOption ? "Edit Option" : "Add Option"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  name="elementType"
                  defaultValue={editingOption?.elementType || ""}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select type...</option>
                  {ELEMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  type="text"
                  name="keyCode"
                  defaultValue={editingOption?.keyCode || ""}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., NAV, SP25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  name="stringValue"
                  defaultValue={editingOption?.stringValue || ""}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Navy, Spring 2025"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enabled"
                  id="enabled"
                  defaultChecked={editingOption?.enabled ?? true}
                />
                <label htmlFor="enabled" className="text-sm">
                  Enabled
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOption(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
