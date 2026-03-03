import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = auth();

  if (userId) {
    redirect("/clients");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Demo Data Manager</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Manage your RepSpark integration data with ease. Create products, manage inventory,
          and sync to RepSpark environments.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
