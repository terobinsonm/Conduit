"use client";


import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Save, TestTube, Loader2, Clock } from "lucide-react";

interface Client {
  id: string;
  name: string;
  slug: string;
  devClientKey: string | null;
  devEnvironmentKey: string | null;
  uatClientKey: string | null;
  uatEnvironmentKey: string | null;
  prodClientKey: string | null;
  prodEnvironmentKey: string | null;
  sftpHost: string | null;
  sftpPort: number;
  sftpUsername: string | null;
  sftpPassword: string | null;
  sftpBasePath: string | null;
  defaultEnvironment: string;
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${params.clientId}`)
      .then((res) => res.json())
      .then((data) => {
        setClient(data);
        setLoading(false);
      });
  }, [params.clientId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | number | null> = {};

    formData.forEach((value, key) => {
      if (key === "sftpPort") {
        data[key] = value ? parseInt(value as string) : 22;
      } else {
        data[key] = value as string || null;
      }
    });

    try {
      const response = await fetch(`/api/clients/${params.clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      setMessage({ type: "success", text: "Settings saved successfully" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  async function testConnection(type: "dev" | "uat" | "prod" | "sftp") {
    setTesting(type);
    setTestResults((prev) => ({ ...prev, [type]: undefined as unknown as { success: boolean } }));

    try {
      const response = await fetch(`/api/clients/${params.clientId}/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();
      setTestResults((prev) => ({ ...prev, [type]: result }));
    } catch {
      setTestResults((prev) => ({ ...prev, [type]: { success: false, error: "Test failed" } }));
    } finally {
      setTesting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure API credentials and SFTP</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General */}
        <section className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">General</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Client Name</label>
              <input
                type="text"
                name="name"
                defaultValue={client.name}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={client.slug}
                disabled
                className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50"
              />
            </div>
          </div>
        </section>

        {/* Development Environment */}
        <section className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Development Environment</h3>
            <button
              type="button"
              onClick={() => testConnection("dev")}
              disabled={testing === "dev"}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-accent disabled:opacity-50"
            >
              {testing === "dev" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connection
            </button>
          </div>
          {testResults.dev && (
            <div
              className={`mb-4 px-3 py-2 rounded text-sm ${
                testResults.dev.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResults.dev.success ? "Connection successful!" : testResults.dev.error}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Client Key</label>
              <input
                type="text"
                name="devClientKey"
                defaultValue={client.devClientKey || ""}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Environment Key</label>
              <input
                type="password"
                name="devEnvironmentKey"
                defaultValue={client.devEnvironmentKey || ""}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </section>

        {/* UAT Environment */}
        <section className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">UAT Environment</h3>
            <button
              type="button"
              onClick={() => testConnection("uat")}
              disabled={testing === "uat"}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-accent disabled:opacity-50"
            >
              {testing === "uat" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connection
            </button>
          </div>
          {testResults.uat && (
            <div
              className={`mb-4 px-3 py-2 rounded text-sm ${
                testResults.uat.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResults.uat.success ? "Connection successful!" : testResults.uat.error}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Client Key</label>
              <input
                type="text"
                name="uatClientKey"
                defaultValue={client.uatClientKey || ""}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Environment Key</label>
              <input
                type="password"
                name="uatEnvironmentKey"
                defaultValue={client.uatEnvironmentKey || ""}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </section>

        {/* Production Environment */}
        <section className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-red-600">Production Environment</h3>
            <button
              type="button"
              onClick={() => testConnection("prod")}
              disabled={testing === "prod"}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-accent disabled:opacity-50"
            >
              {testing === "prod" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connection
            </button>
          </div>
          {testResults.prod && (
            <div
              className={`mb-4 px-3 py-2 rounded text-sm ${
                testResults.prod.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResults.prod.success ? "Connection successful!" : testResults.prod.error}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Client Key</label>
              <input
                type="text"
                name="prodClientKey"
                defaultValue={client.prodClientKey || ""}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Environment Key</label>
              <input
                type="password"
                name="prodEnvironmentKey"
                defaultValue={client.prodEnvironmentKey || ""}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </section>

        {/* SFTP Configuration */}
        <section className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">SFTP Configuration</h3>
            <button
              type="button"
              onClick={() => testConnection("sftp")}
              disabled={testing === "sftp"}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-accent disabled:opacity-50"
            >
              {testing === "sftp" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connection
            </button>
          </div>
          {testResults.sftp && (
            <div
              className={`mb-4 px-3 py-2 rounded text-sm ${
                testResults.sftp.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResults.sftp.success ? "Connection successful!" : testResults.sftp.error}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Host</label>
              <input
                type="text"
                name="sftpHost"
                defaultValue={client.sftpHost || ""}
                placeholder="ftp.example.com"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Port</label>
              <input
                type="number"
                name="sftpPort"
                defaultValue={client.sftpPort || 22}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                name="sftpUsername"
                defaultValue={client.sftpUsername || ""}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                name="sftpPassword"
                defaultValue={client.sftpPassword || ""}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Base Path</label>
              <input
                type="text"
                name="sftpBasePath"
                defaultValue={client.sftpBasePath || ""}
                placeholder="/images/products"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Images will be uploaded as {"{productNumber}.jpg"} in this directory
              </p>
            </div>
          </div>
        </section>

        {/* Sync Schedule */}
        <section className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Sync Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Configure automatic sync schedules for each entity
              </p>
            </div>
            <Link
              href={`/clients/${params.clientId}/settings/sync-schedule`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              <Clock className="h-4 w-4" />
              Configure Schedule
            </Link>
          </div>
        </section>

        {/* Save Button */}
        {message && (
          <div
            className={`px-4 py-2 rounded ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
