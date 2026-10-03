import {
  UserProfile,
  DayLog,
  WeightEntry,
  CustomRecipe,
  FoodItem,
  UserAccount,
} from '../types/nutrition';

const STORAGE_KEYS = {
  ACCOUNTS: 'aahaar_accounts_v3',
  CURRENT_USER_ID: 'aahaar_current_user_id_v3',
};

export const INITIAL_EMPTY_PROFILE: UserProfile = {
  name: '',
  age: 26,
  gender: 'male',
  heightCm: 170,
  currentWeightKg: 70,
  targetWeightKg: 65,
  activityLevel: 'moderately_active',
  exerciseDaysPerWeek: 3,
  avgExerciseDurationMins: 40,
  dailyStepLevel: '8000-12000',
  goalType: 'lose',
  targetWeightChangeKg: 5,
  targetWeeks: 10,
  dietPreference: 'normal_indian',
  allergies: [],
  dislikedFoods: [],
  mealsPerDay: 4,
  measurements: {},
  isProfileSetup: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateOffsetString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEmptyDayLog(date: string): DayLog {
  return {
    date,
    meals: {
      breakfast: [],
      morning_snack: [],
      lunch: [],
      evening_snack: [],
      dinner: [],
      late_night: [],
    },
    waterMl: 0,
    exercises: [],
  };
}

// ---------------- USER ACCOUNTS ----------------
export function loadUserAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load accounts', e);
  }
  return [];
}

export function saveUserAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts', e);
  }
}

export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  } catch {
    return null;
  }
}

export function setCurrentUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  } catch (e) {
    console.error('Failed to set current user id', e);
  }
}

function getUserKey(userId: string, key: string): string {
  return `aahaar_u_${userId}_${key}`;
}

// ---------------- USER PROFILE (User Scoped) ----------------
export function loadUserProfile(userId: string, defaultName = ''): UserProfile {
  try {
    const raw = localStorage.getItem(getUserKey(userId, 'profile'));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load profile', e);
  }
  return {
    ...INITIAL_EMPTY_PROFILE,
    name: defaultName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveUserProfile(userId: string, profile: UserProfile): void {
  try {
    localStorage.setItem(getUserKey(userId, 'profile'), JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

// ---------------- DAY LOGS (Zero mock data - completely clean) ----------------
export function loadDayLogs(userId: string): Record<string, DayLog> {
  try {
    const raw = localStorage.getItem(getUserKey(userId, 'daylogs'));
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = getTodayDateString();
      if (!parsed[today]) {
        parsed[today] = getEmptyDayLog(today);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load day logs', e);
  }
  const today = getTodayDateString();
  const initial = { [today]: getEmptyDayLog(today) };
  saveDayLogs(userId, initial);
  return initial;
}

export function saveDayLogs(userId: string, dayLogs: Record<string, DayLog>): void {
  try {
    localStorage.setItem(getUserKey(userId, 'daylogs'), JSON.stringify(dayLogs));
  } catch (e) {
    console.error('Failed to save day logs', e);
  }
}

// ---------------- WEIGHT HISTORY (Zero mock data) ----------------
export function loadWeightHistory(userId: string): WeightEntry[] {
  try {
    const raw = localStorage.getItem(getUserKey(userId, 'weight'));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load weights', e);
  }
  return [];
}

export function saveWeightHistory(userId: string, history: WeightEntry[]): void {
  try {
    localStorage.setItem(getUserKey(userId, 'weight'), JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save weights', e);
  }
}

// ---------------- CUSTOM RECIPES (Clean) ----------------
export function loadCustomRecipes(userId: string): CustomRecipe[] {
  try {
    const raw = localStorage.getItem(getUserKey(userId, 'recipes'));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load recipes', e);
  }
  return [];
}

export function saveCustomRecipes(userId: string, recipes: CustomRecipe[]): void {
  try {
    localStorage.setItem(getUserKey(userId, 'recipes'), JSON.stringify(recipes));
  } catch (e) {
    console.error('Failed to save recipes', e);
  }
}

// ---------------- CUSTOM FOODS ----------------
export function loadCustomFoods(userId: string): FoodItem[] {
  try {
    const raw = localStorage.getItem(getUserKey(userId, 'customfoods'));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom foods', e);
  }
  return [];
}

export function saveCustomFoods(userId: string, foods: FoodItem[]): void {
  try {
    localStorage.setItem(getUserKey(userId, 'customfoods'), JSON.stringify(foods));
  } catch (e) {
    console.error('Failed to save custom foods', e);
  }
}

// ---------------- FAVORITE FOOD IDS ----------------
export function loadFavoriteFoodIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getUserKey(userId, 'favorites'));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load favorites', e);
  }
  return [];
}

export function saveFavoriteFoodIds(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(getUserKey(userId, 'favorites'), JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
}

export function clearUserAccountData(userId: string): void {
  localStorage.removeItem(getUserKey(userId, 'profile'));
  localStorage.removeItem(getUserKey(userId, 'daylogs'));
  localStorage.removeItem(getUserKey(userId, 'weight'));
  localStorage.removeItem(getUserKey(userId, 'recipes'));
  localStorage.removeItem(getUserKey(userId, 'customfoods'));
  localStorage.removeItem(getUserKey(userId, 'favorites'));
}
