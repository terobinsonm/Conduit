import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";
import { Plus, Settings, Database } from "lucide-react";

export default async function ClientsPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const memberships = await prisma.clientMember.findMany({
    where: { userId },
    include: {
      client: {
        include: {
          _count: {
            select: {
              products: true,
              customers: true,
              options: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Demo Data Manager</h1>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Your Clients</h2>
            <p className="text-muted-foreground">
              Manage RepSpark integration data for your clients
            </p>
          </div>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Client
          </Link>
        </div>

        {memberships.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first client to start managing RepSpark data
            </p>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Create Client
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ client, role }) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="block bg-white rounded-lg border p-6 hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.slug}</p>
                  </div>
                  <span className="text-xs bg-secondary px-2 py-1 rounded capitalize">
                    {role}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{client._count.products}</div>
                    <div className="text-xs text-muted-foreground">Products</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{client._count.customers}</div>
                    <div className="text-xs text-muted-foreground">Customers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{client._count.options}</div>
                    <div className="text-xs text-muted-foreground">Options</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {client.devClientKey && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Dev
                    </span>
                  )}
                  {client.uatClientKey && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      UAT
                    </span>
                  )}
                  {client.prodClientKey && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      Prod
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
