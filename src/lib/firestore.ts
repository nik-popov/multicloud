
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

type HistoryItem = {
  timestamp: string;
  urls: string[];
};

export async function saveFavorites(userId: string, favorites: string[]) {
  try {
    await updateDoc(doc(db, 'users', userId), { favorites });
  } catch (error) {
    // If the document doesn't exist, create it.
    if ((error as any).code === 'not-found') {
        await setDoc(doc(db, 'users', userId), { favorites });
    } else {
        console.error('Error saving favorites: ', error);
    }
  }
}

export async function getFavorites(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().favorites || [];
    } else {
      console.log('No such document for favorites!');
      return [];
    }
  } catch (error) {
    console.error('Error getting favorites: ', error);
    return [];
  }
}

export async function migrateFavorites(userId: string) {
  const localFavorites = localStorage.getItem('bulkshorts_favorites');
  if (localFavorites) {
    const favorites = JSON.parse(localFavorites);
    if (favorites.length > 0) {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const existingFavorites = userDoc.data().favorites || [];
        const mergedFavorites = [...new Set([...existingFavorites, ...favorites])];
        await updateDoc(userDocRef, { favorites: mergedFavorites });
      } else {
        await setDoc(userDocRef, { favorites });
      }
      localStorage.removeItem('bulkshorts_favorites');
    }
  }
}

export async function saveHistory(userId: string, history: HistoryItem[]) {
    try {
        await updateDoc(doc(db, 'users', userId), { history });
    } catch (error) {
        if ((error as any).code === 'not-found') {
            await setDoc(doc(db, 'users', userId), { history });
        } else {
            console.error('Error saving history: ', error);
        }
    }
}

export async function getHistory(userId: string): Promise<HistoryItem[]> {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().history || [];
        } else {
            console.log('No such document for history!');
            return [];
        }
    } catch (error) {
        console.error('Error getting history: ', error);
        return [];
    }
}

export async function migrateHistory(userId: string) {
    const localHistory = localStorage.getItem('bulkshorts_history');
    if (localHistory) {
        const history: HistoryItem[] = JSON.parse(localHistory);
        if (history.length > 0) {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const existingHistory = userDoc.data().history || [];
                // Simple merge: prepend local and take latest 50, assuming local is newer
                const mergedHistory = [...history, ...existingHistory]
                    .reduce((acc, current) => {
                        if (!acc.find(item => item.timestamp === current.timestamp)) {
                            acc.push(current);
                        }
                        return acc;
                    }, [] as HistoryItem[])
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 50);
                await updateDoc(userDocRef, { history: mergedHistory });
            } else {
                await setDoc(userDocRef, { history });
            }
            localStorage.removeItem('bulkshorts_history');
        }
    }
}

