"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Store,
} from "lucide-react";

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  city: string | null;
  state: string | null;
  salesPersonCode: string | null;
  enabled: boolean;
  _count: { stores: number };
}

export default function CustomersPage() {
  const params = useParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [params.clientId]);

  async function fetchCustomers() {
    const res = await fetch(`/api/clients/${params.clientId}/customers`);
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase())) ||
      (c.salesPersonCode && c.salesPersonCode.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-muted-foreground">
            {customers.length} account{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/clients/${params.clientId}/customers/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add customer
        </Link>
      </div>

      {customers.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
          <p className="text-gray-500 mb-4">Add your first customer account to get started.</p>
          <Link
            href={`/clients/${params.clientId}/customers/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add customer
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">No customers match "{search}"</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Sales Rep</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Stores</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${params.clientId}/customers/${customer.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                    {customer.customerCode}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.city && customer.state
                      ? `${customer.city}, ${customer.state}`
                      : customer.city || customer.state || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.salesPersonCode || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {customer._count.stores > 0 ? (
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Store className="h-3.5 w-3.5" />
                        {customer._count.stores}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {customer.enabled ? (
                      <CheckCircle className="h-4 w-4 mx-auto text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 mx-auto text-gray-300" />
                    )}
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
