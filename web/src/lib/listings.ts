import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { CATEGORIES, CONDITIONS } from "@/src/lib/types";
import type { Listing } from "@/src/lib/types";
import { getFirestoreDb } from "@/src/lib/firebase";

const DEFAULT_PAGE_SIZE = 12;
const SEARCH_FETCH_MULTIPLIER = 3;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_LOCATION_LENGTH = 100;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface GetListingsOptions {
  category?: string;
  search?: string;
  pageSize?: number;
  cursor?: string;
}

interface CursorPayload {
  t: number;
  i: string;
}

function encodeCursor(snapshot: QueryDocumentSnapshot<DocumentData>): string {
  const createdAt = snapshot.get("createdAt");
  const payload: CursorPayload = {
    t: createdAt instanceof Timestamp ? createdAt.toMillis() : Date.now(),
    i: snapshot.id,
  };
  return btoa(JSON.stringify(payload));
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(atob(cursor)) as Partial<CursorPayload>;
    if (typeof parsed.t !== "number" || typeof parsed.i !== "string" || parsed.i === "") {
      return null;
    }
    return parsed as CursorPayload;
  } catch {
    return null;
  }
}

function toListing(id: string, data: DocumentData): Listing {
  const createdAt = data.createdAt;
  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : 0,
    category: typeof data.category === "string" ? data.category : "",
    condition: typeof data.condition === "string" ? data.condition : "",
    location: typeof data.location === "string" ? data.location : "",
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    sellerId: typeof data.sellerId === "string" ? data.sellerId : "",
    sellerEmail: typeof data.sellerEmail === "string" ? data.sellerEmail : "",
    sellerName: typeof data.sellerName === "string" ? data.sellerName : "",
    createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : Date.now(),
  };
}

export async function getListings(
  opts: GetListingsOptions = {}
): Promise<{ items: Listing[]; nextCursor: string | null }> {
  const db = getFirestoreDb();
  const pageSize = Math.max(1, opts.pageSize ?? DEFAULT_PAGE_SIZE);
  const searchTerm = opts.search?.trim().toLowerCase() ?? "";
  const fetchLimit = searchTerm ? pageSize * SEARCH_FETCH_MULTIPLIER : pageSize;

  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(fetchLimit)];
  if (opts.category) {
    constraints.unshift(where("category", "==", opts.category));
  }
  if (opts.cursor) {
    const decoded = decodeCursor(opts.cursor);
    if (!decoded) {
      throw new Error("Invalid pagination cursor.");
    }
    constraints.push(startAfter(Timestamp.fromMillis(decoded.t), decoded.i));
  }

  const snapshot = await getDocs(query(collection(db, "listings"), ...constraints));

  let items = snapshot.docs.map((docSnap) => toListing(docSnap.id, docSnap.data()));
  if (searchTerm) {
    items = items.filter(
      (listing) =>
        listing.title.toLowerCase().includes(searchTerm) ||
        listing.description.toLowerCase().includes(searchTerm)
    );
  }
  if (items.length > pageSize) {
    items = items.slice(0, pageSize);
  }

  const lastRaw = snapshot.docs[snapshot.docs.length - 1];
  const hasMore =
    Boolean(lastRaw) && (searchTerm ? snapshot.docs.length >= fetchLimit : snapshot.docs.length >= pageSize);
  return { items, nextCursor: hasMore && lastRaw ? encodeCursor(lastRaw) : null };
}

export async function getListing(id: string): Promise<Listing | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, "listings", id));
  if (!snapshot.exists()) {
    return null;
  }
  return toListing(snapshot.id, snapshot.data());
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  imageFile: File;
  sellerEmail: string;
  sellerName: string;
}

function assertValidInput(input: CreateListingInput): void {
  const title = input.title.trim();
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be between 1 and ${MAX_TITLE_LENGTH} characters.`);
  }
  if (input.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("Price must be a finite number greater than or equal to 0.");
  }
  if (!CATEGORIES.includes(input.category)) {
    throw new Error(`Category must be one of: ${CATEGORIES.join(", ")}.`);
  }
  if (!CONDITIONS.includes(input.condition)) {
    throw new Error(`Condition must be one of: ${CONDITIONS.join(", ")}.`);
  }
  const location = input.location.trim();
  if (location.length === 0 || location.length > MAX_LOCATION_LENGTH) {
    throw new Error(`Location must be between 1 and ${MAX_LOCATION_LENGTH} characters.`);
  }
  if (input.sellerEmail.trim().length === 0 || input.sellerName.trim().length === 0) {
    throw new Error("Seller email and name are required.");
  }
  if (!(input.imageFile instanceof File)) {
    throw new Error("A photo file is required.");
  }
  if (input.imageFile.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Photo must be 5 MB or smaller.");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(input.imageFile.type)) {
    throw new Error("Photo must be a JPEG, PNG, or WebP image.");
  }
}

async function uploadImage(imageFile: File, uid: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Photo hosting is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }
  const form = new FormData();
  form.append("file", imageFile);
  form.append("upload_preset", uploadPreset);
  form.append("folder", `thrift-and-co/${uid}`);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Photo upload failed (${response.status}). Please try again.`);
  }
  const payload = (await response.json()) as { secure_url?: unknown };
  if (typeof payload.secure_url !== "string" || !payload.secure_url.startsWith("https://res.cloudinary.com/")) {
    throw new Error("Photo upload returned an unexpected response. Please try again.");
  }
  return payload.secure_url;
}

export async function createListing(
  input: CreateListingInput,
  uid: string
): Promise<string> {
  assertValidInput(input);
  if (uid.trim().length === 0) {
    throw new Error("An authenticated user is required to post a listing.");
  }

  const url = await uploadImage(input.imageFile, uid);

  const db = getFirestoreDb();
  const docRef = doc(collection(db, "listings"));
  await setDoc(docRef, {
    title: input.title.trim(),
    description: input.description.trim(),
    price: input.price,
    category: input.category,
    condition: input.condition,
    location: input.location.trim(),
    imageUrl: url,
    sellerId: uid,
    sellerEmail: input.sellerEmail.trim(),
    sellerName: input.sellerName.trim(),
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
