"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
    };

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create client");
      }

      const client = await response.json();
      router.push(`/clients/${client.id}/settings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const slugInput = document.getElementById("slug") as HTMLInputElement;
    if (slugInput) {
      slugInput.value = slug;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/clients"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-6">Create New Client</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Client Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                onChange={handleNameChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Club & Coast"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-1">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9-]+"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., club-coast"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL-friendly identifier (lowercase, hyphens only)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Client"}
              </button>
              <Link
                href="/clients"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
