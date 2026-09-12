import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth'
import { doc, getFirestore, getDoc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean)
const app = firebaseConfigured ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export type SavedFitMateData = {
  profile: Record<string, string>
  points: number
  postedChallenges: unknown[]
  history: string[]
}

export function watchAuth(callback: (user: FirebaseUser | null) => void) {
  if (!auth) return () => undefined
  return onAuthStateChanged(auth, callback)
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local.')
  try {
    return (await signInWithPopup(auth, googleProvider)).user
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String(error.code) : ''
    if (code === 'auth/configuration-not-found') {
      throw new Error('Google sign-in is not enabled for this Firebase project. In Firebase Console, open Authentication > Sign-in method and enable Google.')
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error(`This app's domain is not authorized in Firebase. Add ${window.location.hostname} under Authentication > Settings > Authorized domains.`)
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('The sign-in popup was blocked by your browser. Allow popups for this site and try again.')
    }
    throw error
  }
}

export async function signOutFromFirebase() {
  if (auth) await signOut(auth)
}

export async function loadSavedData(uid: string) {
  if (!db) return null
  const snapshot = await getDoc(doc(db, 'users', uid))
  return snapshot.exists() ? snapshot.data() as SavedFitMateData : null
}

export async function saveSavedData(uid: string, data: SavedFitMateData) {
  if (db) await setDoc(doc(db, 'users', uid), data, { merge: true })
}
