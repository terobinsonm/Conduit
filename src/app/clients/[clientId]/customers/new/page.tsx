"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Store } from "lucide-react";

interface StoreInput {
  id: string;
  storeCode: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  phoneNumber: string;
  enabled: boolean;
}

export default function NewCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [customerCode, setCustomerCode] = useState("");
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [salesPersonCode, setSalesPersonCode] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [divisionCode, setDivisionCode] = useState("");
  const [termsCode, setTermsCode] = useState("");

  const [discountPercentage, setDiscountPercentage] = useState("");
  const [pricePlanCode, setPricePlanCode] = useState("");
  const [customerGroupCode, setCustomerGroupCode] = useState("");
  const [classificationCode, setClassificationCode] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [creditStatusCode, setCreditStatusCode] = useState("");

  const [stores, setStores] = useState<StoreInput[]>([]);

  function addStore() {
    setStores([
      ...stores,
      {
        id: crypto.randomUUID(),
        storeCode: "",
        name: "",
        address1: "",
        city: "",
        state: "",
        zip: "",
        phoneNumber: "",
        enabled: true,
      },
    ]);
  }

  function updateStore(id: string, field: keyof StoreInput, value: string | boolean) {
    setStores(stores.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function removeStore(id: string) {
    setStores(stores.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: string[] = [];
    if (!customerCode.trim()) errors.push("Customer code is required");
    if (!name.trim()) errors.push("Name is required");

    for (const store of stores) {
      if (!store.storeCode.trim()) errors.push("All stores must have a store code");
      if (!store.name.trim()) errors.push("All stores must have a name");
    }

    const storeCodes = stores.map((s) => s.storeCode.trim().toUpperCase());
    if (new Set(storeCodes).size !== storeCodes.length) {
      errors.push("Store codes must be unique");
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${params.clientId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCode: customerCode.trim().toUpperCase(),
          name: name.trim(),
          enabled,
          address1: address1.trim() || null,
          address2: address2.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip: zip.trim() || null,
          country,
          phoneNumber: phoneNumber.trim() || null,
          salesPersonCode: salesPersonCode.trim() || null,
          brandCode: brandCode.trim() || null,
          divisionCode: divisionCode.trim() || null,
          termsCode: termsCode.trim() || null,
          discountPercentage: discountPercentage || 0,
          pricePlanCode: pricePlanCode.trim() || null,
          customerGroupCode: customerGroupCode.trim() || null,
          classificationCode: classificationCode.trim() || null,
          channelCode: channelCode.trim() || null,
          typeCode: typeCode.trim() || null,
          creditStatusCode: creditStatusCode.trim() || null,
          stores: stores.map((s) => ({
            storeCode: s.storeCode.trim().toUpperCase(),
            name: s.name.trim(),
            address1: s.address1.trim() || null,
            city: s.city.trim() || null,
            state: s.state.trim() || null,
            zip: s.zip.trim() || null,
            phoneNumber: s.phoneNumber.trim() || null,
            enabled: s.enabled,
          })),
        }),
      });

      if (res.ok) {
        const customer = await res.json();
        router.push(`/clients/${params.clientId}/customers/${customer.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create customer");
      }
    } catch {
      alert("Failed to create customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.clientId}/customers`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Add customer</h1>
            <p className="text-sm text-gray-500">Create a new customer account</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${params.clientId}/customers`}
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
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Account information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 uppercase"
                  placeholder="e.g., ACME"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier shared across all stores</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Billing address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address line 1</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address line 2</label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Pricing & Terms</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                <input
                  type="number"
                  step="0.01"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price plan</label>
                <input
                  type="text"
                  value={pricePlanCode}
                  onChange={(e) => setPricePlanCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment terms</label>
                <input
                  type="text"
                  value={termsCode}
                  onChange={(e) => setTermsCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g., NET30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit status</label>
                <input
                  type="text"
                  value={creditStatusCode}
                  onChange={(e) => setCreditStatusCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Ship-to locations</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Optional. If no stores are added, the billing address will also be used for shipping.
                </p>
              </div>
              <button
                type="button"
                onClick={addStore}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Add store
              </button>
            </div>

            {stores.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Store className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No separate shipping locations</p>
                <p className="text-xs text-gray-400">Billing address will be used for shipping</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stores.map((store, index) => (
                  <div key={store.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Store {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeStore(store.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Store code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={store.storeCode}
                          onChange={(e) => updateStore(store.id, "storeCode", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 uppercase"
                          placeholder="e.g., STORE01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Store name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={store.name}
                          onChange={(e) => updateStore(store.id, "name", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="e.g., Downtown Location"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                        <input
                          type="text"
                          value={store.address1}
                          onChange={(e) => updateStore(store.id, "address1", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                        <input
                          type="text"
                          value={store.city}
                          onChange={(e) => updateStore(store.id, "city", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                          <input
                            type="text"
                            value={store.state}
                            onChange={(e) => updateStore(store.id, "state", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">ZIP</label>
                          <input
                            type="text"
                            value={store.zip}
                            onChange={(e) => updateStore(store.id, "zip", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={store.enabled}
                          onChange={(e) => updateStore(store.id, "enabled", e.target.checked)}
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-xs text-gray-600">Active (included in sync)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              <div>
                <span className="text-sm">Active</span>
                <p className="text-xs text-gray-500">
                  {enabled ? "Included in sync to RepSpark" : "Excluded from sync"}
                </p>
              </div>
            </label>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales rep</label>
                <input
                  type="text"
                  value={salesPersonCode}
                  onChange={(e) => setSalesPersonCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brandCode}
                  onChange={(e) => setBrandCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                <input
                  type="text"
                  value={divisionCode}
                  onChange={(e) => setDivisionCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Classification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer group</label>
                <input
                  type="text"
                  value={customerGroupCode}
                  onChange={(e) => setCustomerGroupCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
                <input
                  type="text"
                  value={classificationCode}
                  onChange={(e) => setClassificationCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <input
                  type="text"
                  value={channelCode}
                  onChange={(e) => setChannelCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
