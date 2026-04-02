"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignUpTab } from "./_components/sign-up-tab";
import { SignInTab } from "./_components/sign-in-tab";
import { Separator } from "@/components/ui/separator";
import { SocialAuthButtons } from "./_components/social-auth-buttons";
import { useEffect, useState, Suspense } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { EmailVerification } from "./_components/email-verification";
import { ForgotPassword } from "./_components/forgot-password";
import { toast } from "sonner";

type Tab = "signin" | "signup" | "email-verification" | "forgot-password";

const STEAM_ERROR_MESSAGES: Record<string, string> = {
  csrf_validation_failed: "Authentication failed: CSRF validation error. Please try again.",
  state_expired_or_invalid: "Authentication session expired. Please try again.",
  steam_openid_validation_failed: "Steam authentication failed. Please try again.",
  invalid_steamid: "Invalid Steam ID received. Please try again.",
  steam_profile_fetch_failed: "Failed to fetch Steam profile. Please try again.",
  session_required_for_linking: "You must be logged in to link a Steam account.",
  account_already_linked_to_different_user: "This Steam account is already linked to another user.",
  account_creation_failed: "Failed to link Steam account. Please try again.",
  user_creation_failed: "Failed to create user account. Please try again.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState<Tab>("signin");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(STEAM_ERROR_MESSAGES[error] || `Authentication error: ${error}`);
      router.push("/auth/login");
    }
  }, [searchParams, router]);

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data != null) router.push("/");
    });
  }, [router]);

  function openEmailVerificationTab(email: string) {
    setEmail(email);
    setSelectedTab("email-verification");
  }

  return (
    <div className="w-lg mx-auto">
      <Tabs value={selectedTab} onValueChange={(t) => setSelectedTab(t as Tab)} className="max-auto w-full my-6 px-4">
        {(selectedTab === "signin" || selectedTab === "signup") && (
          <TabsList>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="signin">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <SignInTab
                openEmailVerificationTab={openEmailVerificationTab}
                openForgotPassword={() => setSelectedTab("forgot-password")}
              />
            </CardContent>

            <Separator />

            <CardFooter className="grid">
              <SocialAuthButtons />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              <SignUpTab openEmailVerificationTab={openEmailVerificationTab} />
            </CardContent>

            <Separator />

            <CardFooter className="grid">
              <SocialAuthButtons />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="email-verification">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Verify Your Email</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailVerification email={email} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forgot-password">
          <Card>
            <CardHeader className="text-2xl font-bold">
              <CardTitle>Forgot Password</CardTitle>
            </CardHeader>
            <CardContent>
              <ForgotPassword openSignInTab={() => setSelectedTab("signin")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
