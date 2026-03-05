import { auth } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Settings,
  List,
  Ruler,
  Package,
  Image,
  Layers,
  Users,
  RefreshCw,
  LayoutDashboard,
  ChevronLeft,
  History,
  Palette,
  Sparkles,
} from "lucide-react";

interface ClientLayoutProps {
  children: React.ReactNode;
  params: { clientId: string };
}

export default async function ClientLayout({ children, params }: ClientLayoutProps) {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const membership = await prisma.clientMember.findFirst({
    where: {
      clientId: params.clientId,
      userId,
    },
    include: {
      client: true,
    },
  });

  if (!membership) {
    notFound();
  }

  const { client } = membership;

const navigation = [
  { name: "Dashboard", href: `/clients/${client.id}`, icon: LayoutDashboard },
  { name: "Products", href: `/clients/${client.id}/products`, icon: Package },
  { name: "Decorations", href: `/clients/${client.id}/decorations`, icon: Palette },
  { name: "Options", href: `/clients/${client.id}/options`, icon: List },
  { name: "Size Scales", href: `/clients/${client.id}/sizing`, icon: Ruler },
  { name: "Images", href: `/clients/${client.id}/images`, icon: Image },
  { name: "Inventory", href: `/clients/${client.id}/inventory`, icon: Layers },
  { name: "Customers", href: `/clients/${client.id}/customers`, icon: Users },
  { name: "Demo Data", href: `/clients/${client.id}/demo-data`, icon: Sparkles },
  { name: "Sync", href: `/clients/${client.id}/sync`, icon: RefreshCw },
  { name: "Sync Logs", href: `/clients/${client.id}/sync-logs`, icon: History },
  { name: "Settings", href: `/clients/${client.id}/settings`, icon: Settings },
];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/clients"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Clients
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{client.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <select
              defaultValue={client.defaultEnvironment}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="dev">Development</option>
              <option value="uat">UAT</option>
              <option value="prod">Production</option>
            </select>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r min-h-[calc(100vh-3.5rem)] sticky top-14">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
