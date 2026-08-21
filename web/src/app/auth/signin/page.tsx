import { Suspense } from "react";
import { SignInForm } from "@/src/components/SignInForm";
import { Spinner } from "@/src/components/Skeletons";

export const metadata = {
  title: "Sign In — Thrift & Co.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<Spinner label="Loading sign-in…" />}>
      <SignInForm />
    </Suspense>
  );
}
