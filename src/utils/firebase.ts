import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import { ReferenceSet, Rating, UserHistory } from "@/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export async function saveReferenceSet(
  userId: string,
  referenceSet: ReferenceSet
): Promise<string> {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val() || {
      userId,
      referenceSets: {},
      lastAccessed: Date.now(),
    };

    // 레퍼런스 세트를 사용자 데이터 내에 저장
    userData.referenceSets[referenceSet.id] = {
      ...referenceSet,
      timestamp: Date.now(),
    };
    userData.lastAccessed = Date.now();

    // 전체 사용자 데이터 업데이트
    await set(userRef, userData);

    return referenceSet.id;
  } catch (error) {
    console.error("Error saving reference set:", error);
    throw error;
  }
}

export async function saveRating(
  userId: string,
  referenceSetId: string,
  rating: Rating
): Promise<void> {
  try {
    const userRef = ref(db, `users/${userId}/referenceSets/${referenceSetId}`);
    const snapshot = await get(userRef);
    const referenceSet = snapshot.val();

    if (referenceSet) {
      await set(userRef, {
        ...referenceSet,
        rating,
      });
    }
  } catch (error) {
    console.error("Error saving rating:", error);
    throw error;
  }
}

export async function getUserHistory(
  userId: string
): Promise<UserHistory | null> {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return null;

    const userData = snapshot.val();
    // referenceSets 객체를 배열로 변환
    const referenceSets = Object.entries(userData.referenceSets || {})
      .map(([id, data]): { id: string; timestamp: number } => ({
        id,
        timestamp: (data as { timestamp: number }).timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // 시간순 정렬

    return {
      userId: userData.userId,
      referenceSets,
      lastAccessed: userData.lastAccessed,
    };
  } catch (error) {
    console.error("Error getting user history:", error);
    throw error;
  }
}

export async function getReferenceSet(
  userId: string,
  referenceSetId: string
): Promise<ReferenceSet | null> {
  try {
    const setRef = ref(db, `users/${userId}/referenceSets/${referenceSetId}`);
    const snapshot = await get(setRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error getting reference set:", error);
    throw error;
  }
}

export async function getLatestReferenceSet(
  userId: string
): Promise<ReferenceSet | null> {
  try {
    const userRef = ref(db, `users/${userId}/referenceSets`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return null;

    const referenceSets = snapshot.val();
    const sortedSets = Object.entries(referenceSets).sort(
      ([, a], [, b]): number =>
        (b as { timestamp: number }).timestamp -
        (a as { timestamp: number }).timestamp
    );

    return sortedSets.length > 0 ? (sortedSets[0][1] as ReferenceSet) : null;
  } catch (error) {
    console.error("Error getting latest reference set:", error);
    throw error;
  }
}

export async function saveAgentDiscussion(
  userId: string,
  referenceSetId: string,
  message: { role: "user" | "agent"; content: string }
): Promise<void> {
  try {
    const setRef = ref(db, `users/${userId}/referenceSets/${referenceSetId}`);
    const snapshot = await get(setRef);
    const referenceSet = snapshot.val();

    if (referenceSet) {
      if (!referenceSet.agentDiscussion) {
        referenceSet.agentDiscussion = { messages: [] };
      }

      referenceSet.agentDiscussion.messages = [
        ...(referenceSet.agentDiscussion.messages || []),
        { ...message, timestamp: Date.now() },
      ];

      await set(setRef, referenceSet);
    }
  } catch (error) {
    console.error("Error saving agent discussion:", error);
    throw error;
  }
}
