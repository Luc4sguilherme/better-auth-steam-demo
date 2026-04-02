"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { ImpersonationIndicator } from "@/components/auth/impersonation-indicator";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasAdminPermission, setHasAdminPermission] = useState(false);
  const { data: session, isPending: loading } = authClient.useSession();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(`Authentication error: ${error.replaceAll("_", " ")}`);
      router.push("/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    authClient.admin.hasPermission({ permissions: { user: ["list"] } }).then(({ data }) => {
      setHasAdminPermission(data?.success ?? false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="my-6 px-4 max-w-md mx-auto">
      <div className="text-center space-y-6">
        {session?.session == null ? (
          <>
            <h1 className="text-3xl font-bold">Welcome to Better Auth</h1>
            <Button asChild size="lg">
              <Link href="/auth/login">Sign In / Sign Up</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Welcome {session.user.name}!</h1>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/profile">Profile</Link>
              </Button>
              {hasAdminPermission && (
                <Button variant="outline" asChild size="lg">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <BetterAuthActionButton size="lg" variant="destructive" action={() => authClient.signOut()}>
                Sign Out
              </BetterAuthActionButton>
            </div>
          </>
        )}
      </div>

      <ImpersonationIndicator />
    </div>
  );
}
