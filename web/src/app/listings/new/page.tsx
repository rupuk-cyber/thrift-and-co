"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONDITIONS, CATEGORIES } from "@/src/lib/types";
import { createListing } from "@/src/lib/listings";
import { useAuth } from "@/src/components/AuthProvider";
import { useToast } from "@/src/components/ToastProvider";
import { Button } from "@/src/components/Button";
import { SelectField, TextField, TextareaField } from "@/src/components/Field";
import { ConfirmDialog } from "@/src/components/Modal";
import { PhotoDropzone, type SelectedPhoto } from "@/src/components/PhotoDropzone";
import { Spinner } from "@/src/components/Skeletons";
import { categoryMeta } from "@/src/components/categoryMeta";

const TITLE_MAX = 80;
const DESCRIPTION_MAX = 2000;

interface FormState {
  title: string;
  category: string;
  price: string;
  condition: string;
  location: string;
  description: string;
}

type FormErrors = Partial<Record<keyof FormState | "photo", string>>;

const INITIAL_FORM: FormState = {
  title: "",
  category: CATEGORIES[0] ?? "electronics",
  price: "",
  condition: CONDITIONS.includes("Good") ? "Good" : (CONDITIONS[0] ?? "Good"),
  location: "",
  description: "",
};

function validate(form: FormState, hasPhoto: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "Please give your item a name.";
  else if (form.title.trim().length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`;

  const price = Number.parseFloat(form.price);
  if (!form.price.trim() || Number.isNaN(price)) errors.price = "Please enter a price.";
  else if (price <= 0) errors.price = "Price must be greater than $0.";

  if (!CATEGORIES.includes(form.category)) errors.category = "Please choose a category.";
  if (!CONDITIONS.includes(form.condition)) errors.condition = "Please choose a condition.";
  if (!form.location.trim()) errors.location = "Please add a pickup location.";
  if (form.description.length > DESCRIPTION_MAX)
    errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  if (!hasPhoto) errors.photo = "Please add one photo of your item.";
  return errors;
}

export default function NewListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const gated = loading || !user;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/signin?next=%2Flistings%2Fnew");
    }
  }, [loading, user, router]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.previewUrl);
    };
  }, [photo]);

  if (gated) {
    return <Spinner label="Checking sign-in…" />;
  }

  const setField = (key: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const isDirty =
    form.title !== "" ||
    form.price !== "" ||
    form.location !== "" ||
    form.description !== "" ||
    photo !== null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !user) return;
    const nextErrors = validate(form, photo !== null);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      showToast("Please fix the highlighted fields", "error");
      return;
    }

    if (!photo) return;
    setSubmitting(true);
    try {
      const listingId = await createListing(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number.parseFloat(form.price),
          category: form.category,
          condition: form.condition,
          location: form.location.trim(),
          imageFile: photo.compressed,
          sellerEmail: user.email ?? "",
          sellerName: user.displayName || user.email?.split("@")[0] || "Seller",
        },
        user.uid
      );
      showToast(`✅ "${form.title.trim()}" added!`, "success");
      router.push(`/listings/${listingId}`);
    } catch {
      showToast("Could not publish your listing — please try again.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="detail-wrap">
        <div className="modal-box">
          <div className="modal-header">
            <h3>Post a Listing</h3>
            <Link href="/" className="detail-close" aria-label="Close and go back to listings">
              ✕
            </Link>
          </div>

          <p className="field-hint" style={{ marginBottom: "var(--space-4)" }}>
            Selling as <strong>{user.displayName || user.email}</strong> ({user.email})
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <TextField
                label="Product Name"
                required
                name="title"
                value={form.title}
                onChange={setField("title")}
                placeholder="e.g. Vintage Sony Stereo"
                maxLength={TITLE_MAX}
                error={errors.title}
              />
              <TextField
                label="Price ($)"
                required
                name="price"
                type="number"
                value={form.price}
                onChange={setField("price")}
                placeholder="0.00"
                min={0}
                step={0.01}
                error={errors.price}
              />
            </div>

            <div className="form-row">
              <SelectField
                label="Category"
                required
                name="category"
                value={form.category}
                onChange={setField("category")}
                options={CATEGORIES}
                renderOption={(value) => {
                  const meta = categoryMeta(value);
                  return (
                    <>
                      <span aria-hidden="true">{meta.emoji}</span> {meta.label}
                    </>
                  );
                }}
                error={errors.category}
              />
              <SelectField
                label="Condition"
                required
                name="condition"
                value={form.condition}
                onChange={setField("condition")}
                options={CONDITIONS}
                error={errors.condition}
              />
            </div>

            <TextField
              label="Location"
              required
              name="location"
              value={form.location}
              onChange={setField("location")}
              placeholder="e.g. Brooklyn, NY"
              maxLength={100}
              error={errors.location}
            />

            <TextareaField
              label="Description"
              name="description"
              value={form.description}
              onChange={setField("description")}
              placeholder="Describe the item in detail…"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              error={errors.description}
            />

            <PhotoDropzone
              photo={photo}
              disabled={submitting}
              onSelect={(selected) => {
                setPhoto((current) => {
                  if (current) URL.revokeObjectURL(current.previewUrl);
                  return selected;
                });
                setErrors((current) => ({ ...current, photo: undefined }));
              }}
              onClear={() => setPhoto(null)}
              onError={(message) => {
                setErrors((current) => ({ ...current, photo: message }));
                showToast(message, "error");
              }}
            />
            {errors.photo && (
              <p className="field-error" role="alert" style={{ marginTop: "-8px" }}>
                {errors.photo}
              </p>
            )}

            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  if (isDirty) setConfirmDiscard(true);
                  else router.push("/");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {submitting ? "Publishing…" : "Publish Listing"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="⚠️ Discard this listing?"
        message="Your changes haven't been published yet. If you cancel now, everything you typed will be lost."
        confirmLabel="Discard"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          router.push("/");
        }}
      />
    </div>
  );
}
