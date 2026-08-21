import { Suspense } from "react";
import { SignUpForm } from "@/src/components/SignUpForm";
import { Spinner } from "@/src/components/Skeletons";

export const metadata = {
  title: "Create Account — Thrift & Co.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<Spinner label="Loading sign-up…" />}>
      <SignUpForm />
    </Suspense>
  );
}
