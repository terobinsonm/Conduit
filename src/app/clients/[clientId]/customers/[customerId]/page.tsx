"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Plus, Store, X } from "lucide-react";

interface StoreRecord {
  id: string;
  storeCode: string;
  name: string;
  address1: string | null;
  city: string | null;
  state: string | null;
  enabled: boolean;
}

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  enabled: boolean;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  phoneNumber: string | null;
  salesPersonCode: string | null;
  brandCode: string;
  divisionCode: string | null;
  termsCode: string | null;
  discountPercentage: number;
  pricePlanCode: string | null;
  customerGroupCode: string | null;
  classificationCode: string | null;
  channelCode: string | null;
  typeCode: string | null;
  creditStatusCode: string | null;
  stores: StoreRecord[];
}

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

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
  const [brandCode, setBrandCode] = useState("CC");
  const [divisionCode, setDivisionCode] = useState("");
  const [termsCode, setTermsCode] = useState("");

  const [discountPercentage, setDiscountPercentage] = useState("");
  const [pricePlanCode, setPricePlanCode] = useState("");
  const [customerGroupCode, setCustomerGroupCode] = useState("");
  const [classificationCode, setClassificationCode] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [creditStatusCode, setCreditStatusCode] = useState("");

  // Store modal state
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [storeCode, setStoreCode] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress1, setStoreAddress1] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storeState, setStoreState] = useState("");
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [params.clientId, params.customerId]);

  async function fetchCustomer() {
    const res = await fetch(`/api/clients/${params.clientId}/customers/${params.customerId}`);
    if (res.ok) {
      const data = await res.json();
      setCustomer(data);
      setCustomerCode(data.customerCode || "");
      setName(data.name || "");
      setEnabled(data.enabled ?? true);
      setAddress1(data.address1 || "");
      setAddress2(data.address2 || "");
      setCity(data.city || "");
      setState(data.state || "");
      setZip(data.zip || "");
      setCountry(data.country || "US");
      setPhoneNumber(data.phoneNumber || "");
      setSalesPersonCode(data.salesPersonCode || "");
      setBrandCode(data.brandCode || "CC");
      setDivisionCode(data.divisionCode || "");
      setTermsCode(data.termsCode || "");
      setDiscountPercentage(data.discountPercentage?.toString() || "");
      setPricePlanCode(data.pricePlanCode || "");
      setCustomerGroupCode(data.customerGroupCode || "");
      setClassificationCode(data.classificationCode || "");
      setChannelCode(data.channelCode || "");
      setTypeCode(data.typeCode || "");
      setCreditStatusCode(data.creditStatusCode || "");
    }
    setLoading(false);
  }

  function openAddStore() {
    setEditingStore(null);
    setStoreCode("");
    setStoreName("");
    setStoreAddress1("");
    setStoreCity("");
    setStoreState("");
    setStoreEnabled(true);
    setShowStoreModal(true);
  }

  function openEditStore(store: StoreRecord) {
    setEditingStore(store);
    setStoreCode(store.storeCode);
    setStoreName(store.name);
    setStoreAddress1(store.address1 || "");
    setStoreCity(store.city || "");
    setStoreState(store.state || "");
    setStoreEnabled(store.enabled);
    setShowStoreModal(true);
  }

  async function handleSaveStore() {
    if (!storeCode.trim() || !storeName.trim()) {
      alert("Store code and name are required");
      return;
    }

    setSavingStore(true);

    try {
      const url = editingStore
        ? `/api/clients/${params.clientId}/customers/${params.customerId}/stores/${editingStore.id}`
        : `/api/clients/${params.clientId}/customers/${params.customerId}/stores`;

      const res = await fetch(url, {
        method: editingStore ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeCode: storeCode.trim().toUpperCase(),
          name: storeName.trim(),
          address1: storeAddress1.trim() || null,
          city: storeCity.trim() || null,
          state: storeState.trim() || null,
          enabled: storeEnabled,
        }),
      });

      if (res.ok) {
        setShowStoreModal(false);
        fetchCustomer();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save store");
      }
    } catch {
      alert("Failed to save store");
    } finally {
      setSavingStore(false);
    }
  }

  async function handleDeleteStore(storeId: string) {
    if (!confirm("Delete this store?")) return;

    try {
      const res = await fetch(
        `/api/clients/${params.clientId}/customers/${params.customerId}/stores/${storeId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchCustomer();
      }
    } catch {
      alert("Failed to delete store");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: string[] = [];
    if (!customerCode.trim()) errors.push("Customer code is required");
    if (!name.trim()) errors.push("Name is required");

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${params.clientId}/customers/${params.customerId}`, {
        method: "PATCH",
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
          brandCode: brandCode.trim() || "CC",
          divisionCode: divisionCode.trim() || null,
          termsCode: termsCode.trim() || null,
          discountPercentage: discountPercentage || 0,
          pricePlanCode: pricePlanCode.trim() || null,
          customerGroupCode: customerGroupCode.trim() || null,
          classificationCode: classificationCode.trim() || null,
          channelCode: channelCode.trim() || null,
          typeCode: typeCode.trim() || null,
          creditStatusCode: creditStatusCode.trim() || null,
        }),
      });

      if (res.ok) {
        router.push(`/clients/${params.clientId}/customers`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update customer");
      }
    } catch {
      alert("Failed to update customer");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}" and all its stores? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${params.clientId}/customers/${params.customerId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/clients/${params.clientId}/customers`);
      } else {
        alert("Failed to delete customer");
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

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Link href={`/clients/${params.clientId}/customers`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <>
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
              <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-500">Bill-to account · {customer.customerCode}</p>
            </div>
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
                  />
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

            {/* Stores Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Ship-to locations</h2>
                  <p className="text-xs text-gray-500 mt-1">Stores and shipping addresses for this account</p>
                </div>
                <button
                  type="button"
                  onClick={openAddStore}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4" />
                  Add store
                </button>
              </div>

              {customer.stores.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Store className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No stores yet</p>
                  <p className="text-xs text-gray-400">Add ship-to locations for this customer</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Store</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Code</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Location</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Status</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customer.stores.map((store) => (
                        <tr key={store.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => openEditStore(store)}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {store.name}
                            </button>
                          </td>
                          <td className="px-4 py-2 text-gray-600 font-mono text-xs">
                            {store.storeCode}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {store.city && store.state
                              ? `${store.city}, ${store.state}`
                              : store.city || store.state || "—"}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              store.enabled
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {store.enabled ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteStore(store.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <span className="text-sm">Active</span>
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

      {/* Store Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingStore ? "Edit store" : "Add store"}
              </h3>
              <button
                onClick={() => setShowStoreModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 uppercase"
                  placeholder="e.g., STORE001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="e.g., Downtown Location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={storeAddress1}
                  onChange={(e) => setStoreAddress1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={storeState}
                    onChange={(e) => setStoreState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={storeEnabled}
                  onChange={(e) => setStoreEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowStoreModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStore}
                disabled={savingStore}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
              >
                {savingStore && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingStore ? "Update" : "Add"} store
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
