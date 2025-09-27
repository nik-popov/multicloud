
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function saveFavorites(userId: string, favorites: string[]) {
  try {
    await setDoc(doc(db, 'users', userId), { favorites });
  } catch (error) {
    console.error('Error saving favorites: ', error);
  }
}

export async function getFavorites(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().favorites || [];
    } else {
      // doc.data() will be undefined in this case
      console.log('No such document!');
      return [];
    }
  } catch (error) {
    console.error('Error getting favorites: ', error);
    return [];
  }
}

// Function to migrate local storage favorites to Firestore
export async function migrateFavorites(userId: string) {
  const localFavorites = localStorage.getItem('bulkshorts_favorites');
  if (localFavorites) {
    const favorites = JSON.parse(localFavorites);
    if (favorites.length > 0) {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        // Merge with existing favorites
        const existingFavorites = userDoc.data().favorites || [];
        const mergedFavorites = [...new Set([...existingFavorites, ...favorites])];
        await updateDoc(userDocRef, { favorites: mergedFavorites });
      } else {
        // Or create a new document
        await setDoc(userDocRef, { favorites });
      }
      // Clear local storage after migration
      localStorage.removeItem('bulkshorts_favorites');
    }
  }
}
