"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Button } from "./Button";
import { TextField } from "./Field";
import { mapAuthError, safeRedirectPath } from "./authErrors";

export function SignInForm() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(mapAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-page">
        <div className="auth-box">
          <h2>🔐 Welcome back</h2>
          <p>Sign in to post listings and reach sellers</p>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              required
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              required
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="Your password"
            />
            <Button type="submit" size="block" loading={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
          </form>
          <div className="auth-alt">
            <Link href="/auth/signup" className="btn btn-outline btn-block">
              New here? Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
