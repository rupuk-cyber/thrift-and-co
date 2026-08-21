"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Button } from "./Button";
import { TextField } from "./Field";
import { mapAuthError, safeRedirectPath } from "./authErrors";

const MIN_PASSWORD_LENGTH = 8;

export function SignUpForm() {
  const { user, loading, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(displayName.trim(), email.trim(), password);
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
          <h2>🛍️ Join Thrift &amp; Co.</h2>
          <p>Create a free account to post your treasures</p>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Display name"
              required
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="e.g. Mike R."
            />
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
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              hint="Use at least 8 characters."
            />
            <TextField
              label="Confirm password"
              required
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
            />
            <Button type="submit" size="block" loading={submitting}>
              {submitting ? "Creating account…" : "Create Account"}
            </Button>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
          </form>
          <div className="auth-alt">
            <Link href="/auth/signin" className="btn btn-outline btn-block">
              Have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
