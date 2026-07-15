"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useT } from "@/components/common/i18n-provider";
import { Logo } from "@/components/common/logo";

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? t("auth.failed"));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Logo className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">OpenPanel</h1>
          <p className="text-xs text-muted-foreground">
            {t("app.signInPrompt")}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-medium">
            {t("auth.email")}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-medium">
            {t("auth.password")}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </main>
  );
}
