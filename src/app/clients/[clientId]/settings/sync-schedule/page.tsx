"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Clock, Save } from "lucide-react";

interface SyncSchedule {
  id?: string;
  optionsCron: string;
  sizingCron: string;
  productsCron: string;
  inventoryCron: string;
  customersCron: string;
  imagesCron: string;
  environment: string;
  enabled: boolean;
  lastSyncOptions?: string;
  lastSyncSizing?: string;
  lastSyncProducts?: string;
  lastSyncInventory?: string;
  lastSyncCustomers?: string;
  lastSyncImages?: string;
}

const CRON_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at 6am UTC", value: "0 6 * * *" },
  { label: "Daily at midnight UTC", value: "0 0 * * *" },
  { label: "Weekly (Sunday midnight)", value: "0 0 * * 0" },
  { label: "Custom", value: "custom" },
];

const ENTITIES = [
  { key: "optionsCron", name: "Options", lastKey: "lastSyncOptions" },
  { key: "sizingCron", name: "Sizing", lastKey: "lastSyncSizing" },
  { key: "productsCron", name: "Products", lastKey: "lastSyncProducts" },
  { key: "inventoryCron", name: "Inventory", lastKey: "lastSyncInventory" },
  { key: "customersCron", name: "Customers", lastKey: "lastSyncCustomers" },
  { key: "imagesCron", name: "Images (SFTP)", lastKey: "lastSyncImages" },
];

export default function SyncSchedulePage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<SyncSchedule>({
    optionsCron: "",
    sizingCron: "",
    productsCron: "",
    inventoryCron: "",
    customersCron: "",
    imagesCron: "",
    environment: "dev",
    enabled: false,
  });

  useEffect(() => {
    fetchSchedule();
  }, [params.clientId]);

  async function fetchSchedule() {
    try {
      const res = await fetch(`/api/clients/${params.clientId}/settings/sync-schedule`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSchedule(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${params.clientId}/settings/sync-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      if (res.ok) {
        alert("Schedule saved");
      } else {
        alert("Failed to save schedule");
      }
    } catch {
      alert("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  }

  function handleCronChange(key: string, value: string) {
    setSchedule((prev) => ({ ...prev, [key]: value === "custom" ? prev[key as keyof SyncSchedule] || "" : value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/clients/${params.clientId}/settings`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sync Schedule</h1>
            <p className="text-sm text-gray-500">Configure automatic sync schedules</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Schedule
        </button>
      </div>

      <div className="space-y-6">
        {/* Global Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Global Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => setSchedule((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm">Enable automatic sync</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
              <select
                value={schedule.environment}
                onChange={(e) => setSchedule((prev) => ({ ...prev, environment: e.target.value }))}
                className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="dev">Development</option>
                <option value="uat">UAT</option>
                <option value="prod">Production</option>
              </select>
            </div>
          </div>
        </div>

        {/* Entity Schedules */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Entity Schedules</h2>
          <p className="text-sm text-gray-500 mb-4">
            Leave blank to disable automatic sync for an entity. Times are in UTC.
          </p>

          <div className="space-y-6">
            {ENTITIES.map((entity) => {
              const currentValue = schedule[entity.key as keyof SyncSchedule] as string || "";
              const isPreset = CRON_PRESETS.some((p) => p.value === currentValue);
              const lastSync = schedule[entity.lastKey as keyof SyncSchedule] as string | undefined;

              return (
                <div key={entity.key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{entity.name}</label>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last: {formatDate(lastSync)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={isPreset ? currentValue : "custom"}
                      onChange={(e) => handleCronChange(entity.key, e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="">Disabled</option>
                      {CRON_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    {(!isPreset && currentValue) || currentValue === "custom" ? (
                      <input
                        type="text"
                        value={currentValue === "custom" ? "" : currentValue}
                        onChange={(e) =>
                          setSchedule((prev) => ({ ...prev, [entity.key]: e.target.value }))
                        }
                        placeholder="0 6 * * *"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Cron Expression Help</h2>
          <p className="text-sm text-gray-600 mb-3">
            Format: <code className="bg-gray-200 px-1 rounded">minute hour day month weekday</code>
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><code className="bg-gray-200 px-1 rounded">0 * * * *</code> — Every hour</li>
            <li><code className="bg-gray-200 px-1 rounded">0 6 * * *</code> — Daily at 6am UTC</li>
            <li><code className="bg-gray-200 px-1 rounded">0 */4 * * *</code> — Every 4 hours</li>
            <li><code className="bg-gray-200 px-1 rounded">0 6 * * 1-5</code> — Weekdays at 6am UTC</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
