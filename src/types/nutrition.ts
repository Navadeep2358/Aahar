export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type GoalType = 'lose' | 'maintain' | 'gain';

export type DietPreference =
  | 'normal_indian'
  | 'high_protein'
  | 'vegetarian'
  | 'vegan'
  | 'eggetarian'
  | 'keto'
  | 'low_carb'
  | 'other';

export type MealType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'evening_snack'
  | 'dinner'
  | 'late_night';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  exerciseDaysPerWeek: number;
  avgExerciseDurationMins: number;
  dailyStepLevel: '<5000' | '5000-8000' | '8000-12000' | '12000+';
  goalType: GoalType;
  targetWeightChangeKg: number;
  targetWeeks: number;
  dietPreference: DietPreference;
  allergies: string[];
  dislikedFoods: string[];
  mealsPerDay: 3 | 4 | 5 | 6;
  measurements?: {
    waistCm?: number;
    hipCm?: number;
    chestCm?: number;
    neckCm?: number;
  };
  isProfileSetup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  googleConnected?: boolean;
  googleFitConnected?: boolean;
  googleFitAccessToken?: string;
  googleFitLastSync?: string;
  googleFitData?: GoogleFitSyncResult;
  createdAt: string;
}

export interface GoogleFitSyncResult {
  date: string;
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
  distanceMeters: number;
  lastSyncTime: string;
  aiAnalysis?: {
    estimatedNetCalories: number;
    estimatedGrossCalories: number;
    stepCadenceIntensity: string;
    energyDeficitContribution: string;
    coachingTip: string;
  };
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
}

export interface CalorieCalculation {
  bmr: number;
  activityMultiplier: number;
  tdee: number;
  dailyCalorieTarget: number;
  dailyCalorieDeficitOrSurplus: number;
  weeklyWeightChangeKg: number;
  estimatedWeeksToGoal: number;
  safetyFlags: {
    isAggressive: boolean;
    isTooLowCalories: boolean;
    warningMessage?: string;
    safeAlternativeDeficit?: number;
    safeAlternativeWeeks?: number;
    minSafeFloorCalories: number;
  };
  macroTargets: MacroTargets;
  transparency: {
    bmrFormula: string;
    activityExplanation: string;
    maintenanceExplanation: string;
    goalAdjustmentExplanation: string;
    macroExplanation: string;
  };
}

export type FoodCategory =
  | 'south_indian'
  | 'rice_staples'
  | 'curries'
  | 'snacks_breakfast'
  | 'fruits'
  | 'dairy'
  | 'drinks'
  | 'custom'
  | 'recipe';

export interface PortionOption {
  label: string;
  grams: number;
  isHousehold: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  regionalName?: string;
  category: FoodCategory;
  dietType: 'veg' | 'non_veg' | 'egg' | 'vegan';
  defaultPortionLabel: string;
  defaultGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  portionOptions: PortionOption[];
  isRaw?: boolean;
  hasRawCookedPair?: boolean;
  cookedEquivalentRatio?: number;
  cookingMethodsAllowed?: string[];
  confidence: 'high' | 'medium' | 'estimated' | 'user_entered';
  notes?: string;
  isFavorite?: boolean;
}

export interface AddedFatOrSugar {
  type: 'oil' | 'ghee' | 'butter' | 'sugar';
  tsp: number;
  calories: number;
  fatG: number;
  carbsG: number;
}

export interface LoggedMealItem {
  id: string;
  foodId: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  selectedPortion: PortionOption;
  totalGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  state: 'cooked' | 'raw' | 'generic';
  cookingMethod?: string;
  addedFat?: AddedFatOrSugar;
  confidenceIndicator: 'calculated' | 'estimated' | 'user_entered';
  loggedAt: string;
}

export interface LoggedExercise {
  id: string;
  type: string;
  durationMins: number;
  intensity: 'low' | 'moderate' | 'high';
  metValue: number;
  caloriesBurned: number;
  isManualEntry: boolean;
  notes?: string;
  loggedAt: string;
}

export interface DayLog {
  date: string;
  meals: Record<MealType, LoggedMealItem[]>;
  waterMl: number;
  exercises: LoggedExercise[];
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
}

export interface CustomRecipeIngredient {
  foodId: string;
  foodName: string;
  grams: number;
  portionLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface CustomRecipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  ingredients: CustomRecipeIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  perServingCalories: number;
  perServingProtein: number;
  perServingCarbs: number;
  perServingFat: number;
  perServingFiber: number;
  createdAt: string;
}

export interface DailySummaryStats {
  caloriesConsumed: number;
  calorieTarget: number;
  remainingCalories: number;
  exerciseBurned: number;
  tdee: number;
  totalExpenditure: number;
  netCalorieBalance: number;
  balanceType: 'deficit' | 'around_maintenance' | 'surplus';
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatConsumed: number;
  fatTarget: number;
  fiberConsumed: number;
  fiberTarget: number;
  waterConsumed: number;
  waterTarget: number;
  evaluationNote: string;
}
