import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  CalorieCalculation,
  DayLog,
  WeightEntry,
  CustomRecipe,
  FoodItem,
  MealType,
  LoggedMealItem,
  LoggedExercise,
  DailySummaryStats,
  UserAccount,
  GoogleFitSyncResult,
} from '../types/nutrition';
import {
  loadUserAccounts,
  saveUserAccounts,
  getCurrentUserId,
  setCurrentUserId,
  loadUserProfile,
  saveUserProfile,
  loadDayLogs,
  saveDayLogs,
  loadWeightHistory,
  saveWeightHistory,
  loadCustomRecipes,
  saveCustomRecipes,
  loadCustomFoods,
  saveCustomFoods,
  loadFavoriteFoodIds,
  saveFavoriteFoodIds,
  getTodayDateString,
  getEmptyDayLog,
  INITIAL_EMPTY_PROFILE,
  clearUserAccountData,
} from '../utils/storage';
import { calculateNutritionPlan } from '../utils/nutritionCalculations';
import { INDIAN_FOOD_DATABASE } from '../data/indianFoods';
import {
  fetchGoogleFitDailyData,
  calculateActivityWithAI,
} from '../utils/googleFit';
import {
  signInWithGoogleAndFit,
  signInEmailPassword,
  registerEmailPassword,
  logOutFirebase,
  getCachedFitToken,
  setCachedFitToken,
} from '../utils/firebase';

interface NutritionContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  caloriePlan: CalorieCalculation;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dayLogs: Record<string, DayLog>;
  currentDayLog: DayLog;
  daySummary: DailySummaryStats;
  weightHistory: WeightEntry[];
  customRecipes: CustomRecipe[];
  customFoods: FoodItem[];
  allFoods: FoodItem[];
  favoriteFoodIds: string[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  addMealItem: (mealType: MealType, item: LoggedMealItem, targetDate?: string) => void;
  editMealItem: (mealType: MealType, itemId: string, updated: Partial<LoggedMealItem>, targetDate?: string) => void;
  removeMealItem: (mealType: MealType, itemId: string, targetDate?: string) => void;
  addExercise: (exercise: LoggedExercise, targetDate?: string) => void;
  removeExercise: (id: string, targetDate?: string) => void;
  addWater: (amountMl: number, targetDate?: string) => void;
  setWater: (amountMl: number, targetDate?: string) => void;
  logWeight: (weightKg: number, date?: string, notes?: string) => void;
  saveRecipe: (recipe: CustomRecipe) => void;
  deleteRecipe: (recipeId: string) => void;
  saveCustomFood: (food: FoodItem) => void;
  toggleFavorite: (foodId: string) => void;
  repeatMeal: (sourceDate: string, mealType: MealType, targetDate?: string) => boolean;
  connectGoogleFit: () => Promise<boolean>;
  syncGoogleFit: (targetDate?: string) => Promise<GoogleFitSyncResult | null>;
  disconnectGoogleFit: () => void;
  googleFitSyncData: GoogleFitSyncResult | null;
  isSyncingGoogleFit: boolean;
  lookupFoodNutrition: (query: string) => Promise<FoodItem | null>;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(loadUserAccounts);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(getCurrentUserId);

  // Active user
  const currentUser = useMemo(() => {
    return accounts.find((a) => a.id === currentUserId) || null;
  }, [accounts, currentUserId]);

  const isAuthenticated = !!currentUser;

  // Active user data
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    const uid = getCurrentUserId();
    return uid ? loadUserProfile(uid) : INITIAL_EMPTY_PROFILE;
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);

  const [dayLogs, setDayLogsState] = useState<Record<string, DayLog>>(() => {
    const uid = getCurrentUserId();
    return uid ? loadDayLogs(uid) : { [getTodayDateString()]: getEmptyDayLog(getTodayDateString()) };
  });

  const [weightHistory, setWeightHistoryState] = useState<WeightEntry[]>(() => {
    const uid = getCurrentUserId();
    return uid ? loadWeightHistory(uid) : [];
  });

  const [customRecipes, setCustomRecipesState] = useState<CustomRecipe[]>(() => {
    const uid = getCurrentUserId();
    return uid ? loadCustomRecipes(uid) : [];
  });

  const [customFoods, setCustomFoodsState] = useState<FoodItem[]>(() => {
    const uid = getCurrentUserId();
    return uid ? loadCustomFoods(uid) : [];
  });

  const [favoriteFoodIds, setFavoriteFoodIdsState] = useState<string[]>(() => {
    const uid = getCurrentUserId();
    return uid ? loadFavoriteFoodIds(uid) : [];
  });

  // Google Fit state
  const [googleFitSyncData, setGoogleFitSyncData] = useState<GoogleFitSyncResult | null>(
    currentUser?.googleFitData || null
  );
  const [isSyncingGoogleFit, setIsSyncingGoogleFit] = useState<boolean>(false);

  // When user switches or logs in/out, load their isolated data
  useEffect(() => {
    if (currentUserId) {
      const u = accounts.find((a) => a.id === currentUserId);
      const prof = loadUserProfile(currentUserId, u?.name || '');
      setUserProfileState(prof);
      setDayLogsState(loadDayLogs(currentUserId));
      setWeightHistoryState(loadWeightHistory(currentUserId));
      setCustomRecipesState(loadCustomRecipes(currentUserId));
      setCustomFoodsState(loadCustomFoods(currentUserId));
      setFavoriteFoodIdsState(loadFavoriteFoodIds(currentUserId));
      setGoogleFitSyncData(u?.googleFitData || null);
    } else {
      setUserProfileState(INITIAL_EMPTY_PROFILE);
      const today = getTodayDateString();
      setDayLogsState({ [today]: getEmptyDayLog(today) });
      setWeightHistoryState([]);
      setCustomRecipesState([]);
      setCustomFoodsState([]);
      setFavoriteFoodIdsState([]);
      setGoogleFitSyncData(null);
    }
  }, [currentUserId]);

  // Recalculate Mifflin-St Jeor plan whenever profile updates
  const caloriePlan = useMemo(() => {
    return calculateNutritionPlan(userProfile);
  }, [userProfile]);

  // Combined foods list
  const allFoods = useMemo(() => {
    const recipeFoodItems: FoodItem[] = customRecipes.map((rec) => ({
      id: rec.id,
      name: `Recipe: ${rec.name}`,
      category: 'recipe',
      dietType: 'veg',
      defaultPortionLabel: '1 serving',
      defaultGrams: 200,
      caloriesPer100g: Math.round((rec.perServingCalories / 200) * 100),
      proteinPer100g: Number(((rec.perServingProtein / 200) * 100).toFixed(1)),
      carbsPer100g: Number(((rec.perServingCarbs / 200) * 100).toFixed(1)),
      fatPer100g: Number(((rec.perServingFat / 200) * 100).toFixed(1)),
      fiberPer100g: Number(((rec.perServingFiber / 200) * 100).toFixed(1)),
      portionOptions: [
        { label: '1 serving', grams: 200, isHousehold: true },
        { label: '1/2 serving', grams: 100, isHousehold: true },
        { label: '2 servings', grams: 400, isHousehold: true },
      ],
      confidence: 'user_entered',
      notes: rec.description,
    }));

    return [...INDIAN_FOOD_DATABASE, ...customFoods, ...recipeFoodItems];
  }, [customFoods, customRecipes]);

  // Ensure selectedDate has an active DayLog object
  const currentDayLog = useMemo(() => {
    return dayLogs[selectedDate] || getEmptyDayLog(selectedDate);
  }, [dayLogs, selectedDate]);

  // Daily Summary Stats
  const daySummary = useMemo<DailySummaryStats>(() => {
    let caloriesConsumed = 0;
    let proteinConsumed = 0;
    let carbsConsumed = 0;
    let fatConsumed = 0;
    let fiberConsumed = 0;

    const mealTypes: MealType[] = [
      'breakfast',
      'morning_snack',
      'lunch',
      'evening_snack',
      'dinner',
      'late_night',
    ];

    mealTypes.forEach((m) => {
      const items = currentDayLog.meals[m] || [];
      items.forEach((item) => {
        caloriesConsumed += item.calories;
        proteinConsumed += item.protein;
        carbsConsumed += item.carbs;
        fatConsumed += item.fat;
        fiberConsumed += item.fiber;
      });
    });

    const exerciseBurned = (currentDayLog.exercises || []).reduce(
      (sum, ex) => sum + ex.caloriesBurned,
      0
    );

    const calorieTarget = caloriePlan.dailyCalorieTarget;
    const remainingCalories = calorieTarget - caloriesConsumed;
    const tdee = caloriePlan.tdee;
    const totalExpenditure = tdee + exerciseBurned;
    const netCalorieBalance = caloriesConsumed - totalExpenditure;

    let balanceType: 'deficit' | 'around_maintenance' | 'surplus' = 'around_maintenance';
    if (netCalorieBalance < -150) {
      balanceType = 'deficit';
    } else if (netCalorieBalance > 150) {
      balanceType = 'surplus';
    } else {
      balanceType = 'around_maintenance';
    }

    let evaluationNote = '';
    const proteinRatio =
      caloriePlan.macroTargets.proteinG > 0 ? proteinConsumed / caloriePlan.macroTargets.proteinG : 0;

    if (caloriesConsumed === 0) {
      evaluationNote = 'No foods logged yet today. Tap + Add Food or 📷 Scan Meal to begin tracking.';
    } else if (Math.abs(remainingCalories) <= 150) {
      evaluationNote = `You hit your calorie target closely today (within ${Math.abs(
        remainingCalories
      )} kcal). Protein completion is at ${Math.round(proteinRatio * 100)}%. Great consistency!`;
    } else if (remainingCalories > 150) {
      evaluationNote = `You stayed ${remainingCalories} kcal below your estimated target today and achieved ${Math.round(
        proteinRatio * 100
      )}% of your protein target.`;
    } else {
      evaluationNote = `You consumed ${Math.abs(
        remainingCalories
      )} kcal above your target today with ${Math.round(proteinRatio * 100)}% of your protein target.`;
    }

    return {
      caloriesConsumed: Math.round(caloriesConsumed),
      calorieTarget,
      remainingCalories: Math.round(remainingCalories),
      exerciseBurned: Math.round(exerciseBurned),
      tdee,
      totalExpenditure: Math.round(totalExpenditure),
      netCalorieBalance: Math.round(netCalorieBalance),
      balanceType,
      proteinConsumed: Number(proteinConsumed.toFixed(1)),
      proteinTarget: caloriePlan.macroTargets.proteinG,
      carbsConsumed: Number(carbsConsumed.toFixed(1)),
      carbsTarget: caloriePlan.macroTargets.carbsG,
      fatConsumed: Number(fatConsumed.toFixed(1)),
      fatTarget: caloriePlan.macroTargets.fatG,
      fiberConsumed: Number(fiberConsumed.toFixed(1)),
      fiberTarget: caloriePlan.macroTargets.fiberG,
      waterConsumed: currentDayLog.waterMl || 0,
      waterTarget: caloriePlan.macroTargets.waterMl,
      evaluationNote,
    };
  }, [currentDayLog, caloriePlan]);

  // Auth Methods
  const register = async (name: string, email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return { success: false, error: 'Email address is required' };
    if (!name.trim()) return { success: false, error: 'Name is required' };

    let fbUid: string | null = null;
    if (password && password.length >= 6) {
      try {
        const fbUser = await registerEmailPassword(name, cleanEmail, password);
        fbUid = fbUser.uid;
      } catch (err: any) {
        console.warn('Firebase email registration error:', err);
        if (err.code === 'auth/email-already-in-use') {
          return { success: false, error: 'This email is already registered. Please login.' };
        }
      }
    }

    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newId = fbUid || `usr_${Date.now()}`;
    const newAccount: UserAccount = {
      id: newId,
      name: name.trim(),
      email: cleanEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    saveUserAccounts(updatedAccounts);

    setCurrentUserId(newId);
    setCurrentUserIdState(newId);

    // Initial empty profile that will trigger the setup wizard
    const freshProfile: UserProfile = {
      ...INITIAL_EMPTY_PROFILE,
      name: name.trim(),
      isProfileSetup: false,
    };
    saveUserProfile(newId, freshProfile);
    setUserProfileState(freshProfile);

    return { success: true };
  };

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();

    if (password) {
      try {
        const fbUser = await signInEmailPassword(cleanEmail, password);
        if (fbUser) {
          let found = accounts.find((a) => a.id === fbUser.uid || a.email.toLowerCase() === cleanEmail);
          if (!found) {
            found = {
              id: fbUser.uid,
              name: fbUser.displayName || cleanEmail.split('@')[0],
              email: cleanEmail,
              createdAt: new Date().toISOString(),
            };
            const updated = [...accounts, found];
            setAccounts(updated);
            saveUserAccounts(updated);
          }
          setCurrentUserId(found.id);
          setCurrentUserIdState(found.id);
          return { success: true };
        }
      } catch (fbErr: any) {
        console.warn('Firebase login attempt:', fbErr?.code);
        if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
          return { success: false, error: 'Invalid email or password' };
        }
      }
    }

    const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, error: 'No account found with this email. Please register.' };
    }

    if (found.password && password && found.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    setCurrentUserId(found.id);
    setCurrentUserIdState(found.id);
    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user, accessToken } = await signInWithGoogleAndFit();
      const realEmail = user.email || `user_${user.uid}@gmail.com`;
      const realName = user.displayName || user.email?.split('@')[0] || 'Google User';
      const avatarUrl = user.photoURL || undefined;

      let account = accounts.find(
        (a) => a.id === user.uid || a.email.toLowerCase() === realEmail.toLowerCase()
      );

      if (!account) {
        account = {
          id: user.uid,
          name: realName,
          email: realEmail,
          avatarUrl,
          googleConnected: true,
          googleFitConnected: true,
          googleFitAccessToken: accessToken || undefined,
          createdAt: new Date().toISOString(),
        };
        const updated = [...accounts, account];
        setAccounts(updated);
        saveUserAccounts(updated);
      } else {
        account.name = realName || account.name;
        account.googleConnected = true;
        account.googleFitConnected = true;
        if (avatarUrl) account.avatarUrl = avatarUrl;
        if (accessToken) account.googleFitAccessToken = accessToken;
        saveUserAccounts(accounts);
      }

      setCurrentUserId(account.id);
      setCurrentUserIdState(account.id);

      const currentProf = loadUserProfile(account.id, realName);
      setUserProfileState(currentProf);

      // Immediately sync real steps from Google Fit!
      if (accessToken) {
        syncGoogleFit(selectedDate, accessToken, account.id);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      return { success: false, error: err?.message || 'Google Sign-In failed' };
    }
  };

  const logout = async () => {
    try {
      await logOutFirebase();
    } catch {
      // ignore
    }
    setCachedFitToken(null);
    setCurrentUserId(null);
    setCurrentUserIdState(null);
  };

  // Google Fit Methods
  const connectGoogleFit = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const { user, accessToken } = await signInWithGoogleAndFit();
      const realEmail = user.email || currentUser.email;
      const avatarUrl = user.photoURL || currentUser.avatarUrl;

      const updatedAccounts = accounts.map((a) =>
        a.id === currentUser.id
          ? {
              ...a,
              googleFitConnected: true,
              googleFitAccessToken: accessToken || a.googleFitAccessToken,
              googleConnected: true,
              email: realEmail,
              avatarUrl,
            }
          : a
      );
      setAccounts(updatedAccounts);
      saveUserAccounts(updatedAccounts);

      // Perform real initial sync
      if (accessToken) {
        await syncGoogleFit(selectedDate, accessToken, currentUser.id);
      } else {
        await syncGoogleFit(selectedDate);
      }
      return true;
    } catch (err) {
      console.error('Google Fit connect failed', err);
      return false;
    }
  };

  const syncGoogleFit = async (
    targetDate = selectedDate,
    overrideToken?: string,
    overrideUserId?: string
  ): Promise<GoogleFitSyncResult | null> => {
    const uid = overrideUserId || currentUserId;
    if (!uid) return null;
    const targetAccount = accounts.find((a) => a.id === uid) || currentUser;
    if (!targetAccount) return null;

    setIsSyncingGoogleFit(true);

    try {
      const token =
        overrideToken ||
        targetAccount.googleFitAccessToken ||
        getCachedFitToken() ||
        '';

      const rawData = await fetchGoogleFitDailyData(token, targetDate);

      // Call AI to accurately evaluate steps, active minutes, and user body weight
      const aiAnalysis = await calculateActivityWithAI({
        steps: rawData.steps,
        activeMinutes: rawData.activeMinutes,
        distanceMeters: rawData.distanceMeters,
        rawCalories: rawData.calories,
        weightKg: userProfile.currentWeightKg || 70,
        heightCm: userProfile.heightCm || 170,
        age: userProfile.age || 26,
        gender: userProfile.gender || 'male',
      });

      const caloriesBurned = aiAnalysis?.estimatedNetCalories || rawData.calories || 0;

      const syncResult: GoogleFitSyncResult = {
        date: targetDate,
        steps: rawData.steps,
        activeMinutes: rawData.activeMinutes,
        caloriesBurned,
        distanceMeters: rawData.distanceMeters,
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiAnalysis,
      };

      setGoogleFitSyncData(syncResult);

      // Automatically add/update today's exercise log with this verified Google Fit activity!
      const googleFitExercise: LoggedExercise = {
        id: `gfit_${targetDate}`,
        type: `Google Fit (${rawData.steps.toLocaleString()} Steps)`,
        durationMins: rawData.activeMinutes || (rawData.steps > 0 ? Math.round(rawData.steps / 100) : 0),
        intensity: rawData.steps > 7000 ? 'high' : rawData.steps > 3000 ? 'moderate' : 'low',
        metValue: 3.5,
        caloriesBurned,
        isManualEntry: true,
        notes: rawData.steps > 0
          ? `Verified Google Fit API (${rawData.steps.toLocaleString()} steps, ${(rawData.distanceMeters / 1000).toFixed(1)} km) • ${aiAnalysis?.stepCadenceIntensity || ''}`
          : 'Google Fit connected (0 steps recorded today)',
        loggedAt: new Date().toISOString(),
      };

      // Add to DayLog replacing any older Google Fit sync for that date
      setDayLogsState((prev) => {
        const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
        const filteredEx = (day.exercises || []).filter((ex) => !ex.id.startsWith('gfit_'));
        const updatedDay: DayLog = {
          ...day,
          exercises: [...filteredEx, googleFitExercise],
        };
        const next = { ...prev, [targetDate]: updatedDay };
        saveDayLogs(uid, next);
        return next;
      });

      // Update account sync data
      const updatedAccounts = accounts.map((a) =>
        a.id === uid
          ? {
              ...a,
              googleFitLastSync: new Date().toISOString(),
              googleFitData: syncResult,
              googleFitAccessToken: token || a.googleFitAccessToken,
            }
          : a
      );
      setAccounts(updatedAccounts);
      saveUserAccounts(updatedAccounts);

      return syncResult;
    } catch (err) {
      console.error('Failed to sync Google Fit', err);
      return null;
    } finally {
      setIsSyncingGoogleFit(false);
    }
  };

  const disconnectGoogleFit = () => {
    if (!currentUser) return;
    setCachedFitToken(null);
    const updatedAccounts = accounts.map((a) =>
      a.id === currentUser.id
        ? {
            ...a,
            googleFitConnected: false,
            googleFitAccessToken: undefined,
            googleFitData: undefined,
          }
        : a
    );
    setAccounts(updatedAccounts);
    saveUserAccounts(updatedAccounts);
    setGoogleFitSyncData(null);
  };

  // Real-time AI nutrition lookup
  const lookupFoodNutrition = async (query: string): Promise<FoodItem | null> => {
    if (!query.trim()) return null;
    try {
      const res = await fetch('/api/lookup-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.food) {
          return data.food as FoodItem;
        }
      }
    } catch (err) {
      console.error('Failed to lookup nutrition via AI:', err);
    }
    return null;
  };

  const updateUserProfile = (patch: Partial<UserProfile>) => {
    if (!currentUserId) return;
    setUserProfileState((prev) => {
      const updated: UserProfile = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      saveUserProfile(currentUserId, updated);
      return updated;
    });
  };

  const addMealItem = (mealType: MealType, item: LoggedMealItem, targetDate = selectedDate) => {
    if (!currentUserId) return;
    setDayLogsState((prev) => {
      const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const existingItems = day.meals[mealType] || [];
      const updatedDay: DayLog = {
        ...day,
        meals: {
          ...day.meals,
          [mealType]: [...existingItems, item],
        },
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });
  };

  const editMealItem = (
    mealType: MealType,
    itemId: string,
    updated: Partial<LoggedMealItem>,
    targetDate = selectedDate
  ) => {
    if (!currentUserId) return;
    setDayLogsState((prev) => {
      const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const items = day.meals[mealType] || [];
      const updatedItems = items.map((it) => (it.id === itemId ? { ...it, ...updated } : it));
      const updatedDay: DayLog = {
        ...day,
        meals: {
          ...day.meals,
          [mealType]: updatedItems,
        },
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });
  };

  const removeMealItem = (mealType: MealType, itemId: string, targetDate = selectedDate) => {
    if (!currentUserId) return;
    setDayLogsState((prev) => {
      const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const items = day.meals[mealType] || [];
      const filtered = items.filter((it) => it.id !== itemId);
      const updatedDay: DayLog = {
        ...day,
        meals: {
          ...day.meals,
          [mealType]: filtered,
        },
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });
  };

  const addExercise = (exercise: LoggedExercise, targetDate = selectedDate) => {
    if (!currentUserId) return;
    setDayLogsState((prev) => {
      const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const updatedDay: DayLog = {
        ...day,
        exercises: [...(day.exercises || []), exercise],
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });
  };

  const removeExercise = (id: string, targetDate = selectedDate) => {
    if (!currentUserId) return;
    setDayLogsState((prev) => {
      const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const updatedDay: DayLog = {
        ...day,
        exercises: (day.exercises || []).filter((ex) => ex.id !== id),
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });
  };

  const addWater = (amountMl: number, targetDate = selectedDate) => {
    if (!currentUserId) return;
    setDayLogsState((prev) => {
      const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const newWater = Math.max(0, (day.waterMl || 0) + amountMl);
      const updatedDay: DayLog = {
        ...day,
        waterMl: newWater,
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });
  };

  const setWater = (amountMl: number, targetDate = selectedDate) => {
    if (!currentUserId) return;
    setDayLogsState((prev) => {
      const day = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const updatedDay: DayLog = {
        ...day,
        waterMl: Math.max(0, amountMl),
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });
  };

  const logWeight = (weightKg: number, date = selectedDate, notes?: string) => {
    if (!currentUserId) return;
    setWeightHistoryState((prev) => {
      const existingIdx = prev.findIndex((w) => w.date === date);
      let updated: WeightEntry[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], weightKg, notes };
      } else {
        const newEntry: WeightEntry = {
          id: `wt_${Date.now()}`,
          date,
          weightKg,
          notes,
        };
        updated = [...prev, newEntry];
      }
      updated.sort((a, b) => a.date.localeCompare(b.date));
      saveWeightHistory(currentUserId, updated);

      if (date === getTodayDateString()) {
        updateUserProfile({ currentWeightKg: weightKg });
      }

      return updated;
    });
  };

  const saveRecipe = (recipe: CustomRecipe) => {
    if (!currentUserId) return;
    setCustomRecipesState((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === recipe.id);
      let next: CustomRecipe[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = recipe;
      } else {
        next = [recipe, ...prev];
      }
      saveCustomRecipes(currentUserId, next);
      return next;
    });
  };

  const deleteRecipe = (recipeId: string) => {
    if (!currentUserId) return;
    setCustomRecipesState((prev) => {
      const next = prev.filter((r) => r.id !== recipeId);
      saveCustomRecipes(currentUserId, next);
      return next;
    });
  };

  const saveCustomFood = (food: FoodItem) => {
    if (!currentUserId) return;
    setCustomFoodsState((prev) => {
      const next = [food, ...prev.filter((f) => f.id !== food.id)];
      saveCustomFoods(currentUserId, next);
      return next;
    });
  };

  const toggleFavorite = (foodId: string) => {
    if (!currentUserId) return;
    setFavoriteFoodIdsState((prev) => {
      const exists = prev.includes(foodId);
      const next = exists ? prev.filter((id) => id !== foodId) : [...prev, foodId];
      saveFavoriteFoodIds(currentUserId, next);
      return next;
    });
  };

  const repeatMeal = (sourceDate: string, mealType: MealType, targetDate = selectedDate): boolean => {
    if (!currentUserId) return false;
    const srcDay = dayLogs[sourceDate];
    if (!srcDay || !srcDay.meals[mealType] || srcDay.meals[mealType].length === 0) {
      return false;
    }

    const itemsToCopy = srcDay.meals[mealType].map((item) => ({
      ...item,
      id: `copy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      loggedAt: new Date().toISOString(),
    }));

    setDayLogsState((prev) => {
      const targetDay = prev[targetDate] ? { ...prev[targetDate] } : getEmptyDayLog(targetDate);
      const updatedDay: DayLog = {
        ...targetDay,
        meals: {
          ...targetDay.meals,
          [mealType]: [...(targetDay.meals[mealType] || []), ...itemsToCopy],
        },
      };
      const next = { ...prev, [targetDate]: updatedDay };
      saveDayLogs(currentUserId, next);
      return next;
    });

    return true;
  };

  return (
    <NutritionContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        userProfile,
        caloriePlan,
        selectedDate,
        setSelectedDate,
        dayLogs,
        currentDayLog,
        daySummary,
        weightHistory,
        customRecipes,
        customFoods,
        allFoods,
        favoriteFoodIds,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUserProfile,
        addMealItem,
        editMealItem,
        removeMealItem,
        addExercise,
        removeExercise,
        addWater,
        setWater,
        logWeight,
        saveRecipe,
        deleteRecipe,
        saveCustomFood,
        toggleFavorite,
        repeatMeal,
        connectGoogleFit,
        syncGoogleFit,
        disconnectGoogleFit,
        googleFitSyncData,
        isSyncingGoogleFit,
        lookupFoodNutrition,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
}
