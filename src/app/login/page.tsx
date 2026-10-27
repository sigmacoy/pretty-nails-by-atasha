"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff, Facebook, Chrome, Sparkles, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"client" | "owner" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setErrorMessage("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: "client" | "owner") => {
    setDemoLoading(role);
    setErrorMessage("");

    const demoCredentials =
      role === "owner"
        ? { email: "owner@prettynails.com", password: "owner123" }
        : { email: "client@prettynails.com", password: "client123" };

    try {
      const result = await signIn("credentials", {
        ...demoCredentials,
        redirect: false,
        callbackUrl: role === "owner" ? "/admin/dashboard" : (callbackUrl || "/profile"),
      });

      if (result?.error) {
        setErrorMessage(`Failed to sign in as ${role}`);
      } else {
        router.push(role === "owner" ? "/admin/dashboard" : (callbackUrl || "/profile"));
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Demo sign-in failed. Please try again.");
    } finally {
      setDemoLoading(null);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-hero">
      <Card className="w-full max-w-md border-primary-100 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="font-display text-2xl font-bold text-gray-900 block leading-tight">Pretty Nails</span>
              <span className="text-xs text-primary-600 font-medium">by Atasha</span>
            </div>
          </Link>
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome</CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            "Life is too short to have naked nails"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prototype Quick Access */}
          <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-800">
                Prototype Quick Access
              </span>
              <span className="text-[10px] bg-primary-200 text-primary-900 px-2 py-0.5 rounded-full font-semibold">
                One-Click Test
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDemoSignIn("client")}
                disabled={loading || !!demoLoading}
                className="w-full h-11 border-primary-200 bg-white hover:bg-primary-100 text-primary-950 font-medium text-xs flex items-center justify-center gap-1.5"
              >
                {demoLoading === "client" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                ) : (
                  <User className="h-4 w-4 text-primary-600" />
                )}
                Sign in as Client
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => handleDemoSignIn("owner")}
                disabled={loading || !!demoLoading}
                className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs flex items-center justify-center gap-1.5"
              >
                {demoLoading === "owner" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-white" />
                )}
                Sign in as Owner
              </Button>
            </div>
            <p className="text-[11px] text-gray-500 text-center">
              Instant login for review: test client loyalty & booking or owner queue & approval.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error === "CredentialsSignin" ? "Invalid credentials" : "An error occurred during sign in"}
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading || !!demoLoading}
              className="gap-2 h-10 border-gray-200 hover:bg-gray-50"
            >
              <Chrome className="h-4 w-4 text-red-500" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("facebook")}
              disabled={loading || !!demoLoading}
              className="gap-2 h-10 border-gray-200 hover:bg-gray-50"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  required
                  disabled={loading || !!demoLoading}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-gray-700">Password</Label>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 h-10"
                  required
                  disabled={loading || !!demoLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 mt-2" disabled={loading || !!demoLoading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 pt-2">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary-600 hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
