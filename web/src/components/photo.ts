"use client";

const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file (JPEG, PNG or WebP).";
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return "That photo is over 10 MB — please choose a smaller image.";
  }
  return null;
}

export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas is not supported in this browser.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) {
    throw new Error("Could not process the image.");
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("That photo is still too large after compression — please choose a smaller image.");
  }
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
