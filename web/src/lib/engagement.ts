import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/src/lib/firebase";
import type { Listing, Review } from "@/src/lib/types";

export async function toggleFavorite(userId: string, listingId: string): Promise<boolean> {
  const db = getFirestoreDb();
  const favId = `${userId}_${listingId}`;
  const favRef = doc(db, "favorites", favId);
  const favSnap = await getDoc(favRef);
  if (favSnap.exists()) {
    await deleteDoc(favRef);
    return false;
  } else {
    await setDoc(favRef, { userId, listingId, createdAt: serverTimestamp() });
    return true;
  }
}

export async function isFavorite(userId: string, listingId: string): Promise<boolean> {
  const db = getFirestoreDb();
  const favId = `${userId}_${listingId}`;
  const favSnap = await getDoc(doc(db, "favorites", favId));
  return favSnap.exists();
}

export async function getFavoriteListings(userId: string): Promise<Listing[]> {
  const db = getFirestoreDb();
  const favSnapshot = await getDocs(query(collection(db, "favorites"), where("userId", "==", userId)));
  const listings: Listing[] = [];
  for (const favDoc of favSnapshot.docs) {
    const favData = favDoc.data();
    const listingId = favData.listingId;
    if (typeof listingId === "string") {
      const listingSnap = await getDoc(doc(db, "listings", listingId));
      if (listingSnap.exists()) {
        const data = listingSnap.data();
        const createdAt = data.createdAt;
        listings.push({
          id: listingSnap.id,
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
          createdAt: createdAt && typeof createdAt.toMillis === "function" ? createdAt.toMillis() : Date.now(),
        });
      }
    }
  }
  return listings;
}

export async function incrementView(listingId: string): Promise<void> {
  const db = getFirestoreDb();
  await setDoc(doc(db, "listingViews", listingId), { count: increment(1) }, { merge: true });
}

export async function getViewCount(listingId: string): Promise<number> {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, "listingViews", listingId));
  if (!snap.exists()) return 0;
  const data = snap.data();
  return typeof data.count === "number" ? data.count : 0;
}

export async function addReview(params: {
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const db = getFirestoreDb();
  const reviewRef = doc(collection(db, "listings", params.listingId, "reviews"));
  await setDoc(reviewRef, {
    listingId: params.listingId,
    userId: params.userId,
    userName: params.userName,
    rating: params.rating,
    comment: params.comment,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
}

export async function getReviews(listingId: string): Promise<Review[]> {
  const db = getFirestoreDb();
  const snap = await getDocs(
    query(
      collection(db, "listings", listingId, "reviews"),
      orderBy("createdAtMs", "desc"),
      limit(50)
    )
  );
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    return {
      id: d.id,
      listingId: typeof data.listingId === "string" ? data.listingId : listingId,
      userId: typeof data.userId === "string" ? data.userId : "",
      userName: typeof data.userName === "string" ? data.userName : "",
      rating: typeof data.rating === "number" ? data.rating : 0,
      comment: typeof data.comment === "string" ? data.comment : "",
      createdAt: typeof data.createdAtMs === "number" ? data.createdAtMs : Date.now(),
    };
  });
}

export async function getAverageRating(listingId: string): Promise<{ avg: number; count: number }> {
  const reviews = await getReviews(listingId);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { avg: sum / reviews.length, count: reviews.length };
}