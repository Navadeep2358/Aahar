import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Fit (Fitness) scopes
export const googleFitProvider = new GoogleAuthProvider();
googleFitProvider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
googleFitProvider.addScope('https://www.googleapis.com/auth/fitness.body.read');
googleFitProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleFitProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Request offline access prompt when needed
googleFitProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cache access token in memory & sessionStorage
let inMemoryAccessToken: string | null = null;
const TOKEN_STORAGE_KEY = 'aahaar_google_fit_token';

export function getCachedFitToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  try {
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      inMemoryAccessToken = stored;
      return stored;
    }
  } catch {
    // sessionStorage might be restricted
  }
  return null;
}

export function setCachedFitToken(token: string | null) {
  inMemoryAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage error
  }
}

/**
 * Sign in with Google Popup and obtain real Google Fit OAuth Access Token
 */
export async function signInWithGoogleAndFit(): Promise<{
  user: User;
  accessToken: string | null;
}> {
  const result = await signInWithPopup(auth, googleFitProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || null;

  if (accessToken) {
    setCachedFitToken(accessToken);
  }

  return {
    user: result.user,
    accessToken,
  };
}

/**
 * Sign in with Email and Password
 */
export async function signInEmailPassword(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

/**
 * Register with Email, Password and Name
 */
export async function registerEmailPassword(
  name: string,
  email: string,
  pass: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    try {
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch {
      // ignore profile update error
    }
  }
  return cred.user;
}

/**
 * Sign out
 */
export async function logOutFirebase(): Promise<void> {
  setCachedFitToken(null);
  await signOut(auth);
}
