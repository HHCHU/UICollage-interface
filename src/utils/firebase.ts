import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  setDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { ReferenceSet, Rating, UserHistory } from "@/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 새로운 레퍼런스 세트를 저장
export async function saveReferenceSet(
  userId: string,
  referenceSet: ReferenceSet
): Promise<string> {
  const userDocRef = doc(db, "userHistory", userId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // 새 사용자 히스토리 생성
    const newHistory: UserHistory = {
      userId,
      referenceSets: [referenceSet],
      lastAccessed: Date.now(),
    };
    await setDoc(userDocRef, newHistory);
  } else {
    // 기존 히스토리 업데이트
    const history = userDoc.data() as UserHistory;
    history.referenceSets.push(referenceSet);
    history.lastAccessed = Date.now();
    await updateDoc(userDocRef, { ...history });
  }
  return userId;
}

// 레퍼런스 세트에 대한 평가 저장
export async function saveRating(
  userId: string,
  referenceSetId: string,
  rating: Rating
): Promise<void> {
  const userDocRef = doc(db, "userHistory", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const history = userDoc.data() as UserHistory;
    const referenceSet = history.referenceSets.find(
      (set) => set.id === referenceSetId
    );

    if (referenceSet) {
      referenceSet.rating = rating;
      await updateDoc(userDocRef, { ...history });
    }
  }
}

// 사용자의 히스토리 조회
export async function getUserHistory(
  userId: string
): Promise<UserHistory | null> {
  const userDocRef = doc(db, "userHistory", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return userDoc.data() as UserHistory;
  }
  return null;
}

// 에이전트 토론 메시지 추가
export async function saveAgentDiscussion(
  userId: string,
  referenceSetId: string,
  message: { role: "user" | "agent"; content: string }
): Promise<void> {
  const userDocRef = doc(db, "userHistory", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const history = userDoc.data() as UserHistory;
    const referenceSet = history.referenceSets.find(
      (set) => set.id === referenceSetId
    );

    if (referenceSet) {
      if (!referenceSet.agentDiscussion) {
        referenceSet.agentDiscussion = { messages: [] };
      }
      referenceSet.agentDiscussion.messages.push({
        ...message,
        timestamp: Date.now(),
      });
      await updateDoc(userDocRef, { ...history });
    }
  }
}
