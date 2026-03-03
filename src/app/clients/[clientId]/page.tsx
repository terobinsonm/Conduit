import { auth } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Package,
  Users,
  List,
  Layers,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface DashboardPageProps {
  params: { clientId: string };
}

export default async function ClientDashboardPage({ params }: DashboardPageProps) {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const membership = await prisma.clientMember.findFirst({
    where: { clientId: params.clientId, userId },
    include: {
      client: {
        include: {
          _count: {
            select: {
              products: true,
              customers: true,
              options: true,
              inventory: true,
              sizeScales: true,
            },
          },
          syncLogs: {
            take: 10,
            orderBy: { startedAt: "desc" },
          },
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const { client } = membership;
  const counts = client._count;

  const stats = [
    { name: "Products", value: counts.products, icon: Package, href: `/clients/${client.id}/products` },
    { name: "Customers", value: counts.customers, icon: Users, href: `/clients/${client.id}/customers` },
    { name: "Options", value: counts.options, icon: List, href: `/clients/${client.id}/options` },
    { name: "Inventory Records", value: counts.inventory, icon: Layers, href: `/clients/${client.id}/inventory` },
  ];

  const recentSyncs = client.syncLogs;

  function getStatusIcon(status: string) {
    switch (status) {
      case "Success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "InProgress":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{client.name}</h2>
        <p className="text-muted-foreground">Dashboard overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-lg border p-6 hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Environment Status */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Environment Configuration</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                client.devClientKey ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span>Development</span>
            {!client.devClientKey && (
              <Link
                href={`/clients/${client.id}/settings`}
                className="text-xs text-primary hover:underline"
              >
                Configure
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                client.uatClientKey ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span>UAT</span>
            {!client.uatClientKey && (
              <Link
                href={`/clients/${client.id}/settings`}
                className="text-xs text-primary hover:underline"
              >
                Configure
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                client.prodClientKey ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span>Production</span>
            {!client.prodClientKey && (
              <Link
                href={`/clients/${client.id}/settings`}
                className="text-xs text-primary hover:underline"
              >
                Configure
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Syncs */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Recent Syncs</h3>
          <Link
            href={`/clients/${client.id}/sync`}
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>

        {recentSyncs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No syncs yet</p>
        ) : (
          <div className="space-y-2">
            {recentSyncs.map((sync) => (
              <div
                key={sync.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(sync.status)}
                  <div>
                    <span className="font-medium">{sync.entityType}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      ({sync.syncMode})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{sync.recordCount} records</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(sync.startedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/clients/${client.id}/products?action=new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            <Package className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            href={`/clients/${client.id}/sync`}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
            Sync to RepSpark
          </Link>
          <Link
            href={`/clients/${client.id}/options?action=import`}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-accent"
          >
            <List className="h-4 w-4" />
            Import Options
          </Link>
        </div>
      </div>
    </div>
  );
}
