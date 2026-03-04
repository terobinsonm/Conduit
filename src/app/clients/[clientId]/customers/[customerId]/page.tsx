"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  storeCode: string | null;
  isBillTo: boolean;
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
  shippingMethodCode: string | null;
  discountPercentage: number;
  pricePlanCode: string | null;
  customerGroupCode: string | null;
  classificationCode: string | null;
  channelCode: string | null;
  typeCode: string | null;
  creditStatusCode: string | null;
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
  const [storeCode, setStoreCode] = useState("");
  const [isBillTo, setIsBillTo] = useState(false);
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
  const [shippingMethodCode, setShippingMethodCode] = useState("");

  const [discountPercentage, setDiscountPercentage] = useState("");
  const [pricePlanCode, setPricePlanCode] = useState("");
  const [customerGroupCode, setCustomerGroupCode] = useState("");
  const [classificationCode, setClassificationCode] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [creditStatusCode, setCreditStatusCode] = useState("");

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
      setStoreCode(data.storeCode || "");
      setIsBillTo(data.isBillTo || false);
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
      setShippingMethodCode(data.shippingMethodCode || "");
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
          customerCode: customerCode.trim(),
          name: name.trim(),
          storeCode: storeCode.trim() || null,
          isBillTo,
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
          shippingMethodCode: shippingMethodCode.trim() || null,
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
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.clientId}/customers`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
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
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store code</label>
                  <input
                    type="text"
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
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
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Address</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
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
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isBillTo}
                  onChange={(e) => setIsBillTo(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm">Bill-to account</span>
              </label>
            </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping method</label>
                <input
                  type="text"
                  value={shippingMethodCode}
                  onChange={(e) => setShippingMethodCode(e.target.value)}
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
