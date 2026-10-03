import {
  UserProfile,
  CalorieCalculation,
  MacroTargets,
  Gender,
  ActivityLevel,
  GoalType,
  DietPreference,
} from '../types/nutrition';

/**
 * Calculates Basal Metabolic Rate using the established Mifflin-St Jeor formula:
 * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
 * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    return Math.round(base + 5);
  } else if (gender === 'female') {
    return Math.round(base - 161);
  } else {
    // Non-binary/other: mid-point average
    return Math.round(base - 78);
  }
}

/**
 * Base activity multipliers according to clinical exercise physiology:
 * Sedentary: 1.2
 * Lightly active (1-3 days/wk): 1.375
 * Moderately active (3-5 days/wk): 1.55
 * Very active (6-7 days/wk): 1.725
 * Extra active (strenuous physical job or 2x daily training): 1.9
 */
export function getActivityMultiplier(
  level: ActivityLevel,
  exerciseDays: number,
  avgDurationMins: number
): number {
  let multiplier = 1.2;

  switch (level) {
    case 'sedentary':
      multiplier = 1.2;
      break;
    case 'lightly_active':
      multiplier = 1.375;
      break;
    case 'moderately_active':
      multiplier = 1.55;
      break;
    case 'very_active':
      multiplier = 1.725;
      break;
    case 'extra_active':
      multiplier = 1.9;
      break;
    default:
      multiplier = 1.2;
  }

  // Refine slightly if exercise days and duration are provided
  if (exerciseDays >= 5 && avgDurationMins >= 60 && multiplier < 1.65) {
    multiplier = Math.min(1.75, multiplier + 0.08);
  } else if (exerciseDays === 0 && multiplier > 1.25) {
    multiplier = 1.2;
  }

  return Number(multiplier.toFixed(3));
}

/**
 * Calculates personalized daily macronutrient targets
 */
export function calculateMacroTargets(
  weightKg: number,
  dailyCalories: number,
  goal: GoalType,
  diet: DietPreference,
  exerciseDays: number
): MacroTargets {
  // Protein recommendation:
  // Weight loss or resistance training: 1.8 - 2.2 g/kg body weight to preserve lean mass
  // High protein diet: 2.0 - 2.2 g/kg
  // General health / vegetarian: 1.4 - 1.6 g/kg
  // Sedentary / low activity: 1.2 g/kg
  let proteinPerKg = 1.4;

  if (diet === 'high_protein' || (goal === 'lose' && exerciseDays >= 3)) {
    proteinPerKg = 2.0;
  } else if (goal === 'lose') {
    proteinPerKg = 1.8;
  } else if (goal === 'gain' && exerciseDays >= 3) {
    proteinPerKg = 1.8;
  } else if (diet === 'keto') {
    proteinPerKg = 1.6;
  } else if (exerciseDays >= 4) {
    proteinPerKg = 1.6;
  } else {
    proteinPerKg = 1.2;
  }

  let proteinG = Math.round(weightKg * proteinPerKg);
  // Cap protein calories to no more than 35% of daily calories for safety
  const maxProteinFromCalories = Math.round((dailyCalories * 0.35) / 4);
  if (proteinG > maxProteinFromCalories) {
    proteinG = maxProteinFromCalories;
  }
  // Minimum safe floor
  if (proteinG < 50) proteinG = 50;

  let fatG: number;
  let carbsG: number;

  if (diet === 'keto') {
    // 70% fat, 20% protein, 10% carbs
    fatG = Math.round((dailyCalories * 0.70) / 9);
    carbsG = Math.max(20, Math.round((dailyCalories * 0.08) / 4));
  } else if (diet === 'low_carb') {
    // 35% fat, 35% protein, 30% carbs
    fatG = Math.round((dailyCalories * 0.35) / 9);
    const remainingForCarbs = dailyCalories - (proteinG * 4 + fatG * 9);
    carbsG = Math.max(40, Math.round(remainingForCarbs / 4));
  } else {
    // Standard balanced / Indian diet:
    // Fat ~25-28% of total calories (essential fatty acids, hormone health)
    fatG = Math.round((dailyCalories * 0.26) / 9);
    const caloriesUsed = proteinG * 4 + fatG * 9;
    const remainingCalories = Math.max(0, dailyCalories - caloriesUsed);
    carbsG = Math.round(remainingCalories / 4);
  }

  // Fiber target: 14g per 1000 kcal (ICMR & USDA guidelines), clamped between 25g and 40g
  const fiberG = Math.min(42, Math.max(25, Math.round((dailyCalories / 1000) * 14)));

  // Water target: 35ml per kg body weight + 500ml for regular exercise
  const baseWater = weightKg * 35;
  const exerciseWaterBonus = exerciseDays >= 3 ? 500 : 250;
  const waterMl = Math.min(4500, Math.max(2000, Math.round((baseWater + exerciseWaterBonus) / 250) * 250));

  return {
    proteinG,
    carbsG,
    fatG,
    fiberG,
    waterMl,
  };
}

/**
 * Complete Mifflin-St Jeor and Goal Calculation with Clinical Safety Guardrails
 */
export function calculateNutritionPlan(profile: UserProfile): CalorieCalculation {
  const {
    currentWeightKg,
    targetWeightKg,
    heightCm,
    age,
    gender,
    activityLevel,
    exerciseDaysPerWeek,
    avgExerciseDurationMins,
    goalType,
    targetWeightChangeKg,
    targetWeeks,
    dietPreference,
  } = profile;

  // 1. BMR
  const bmr = calculateBMR(currentWeightKg, heightCm, age, gender);

  // 2. Activity Multiplier & TDEE
  const activityMultiplier = getActivityMultiplier(
    activityLevel,
    exerciseDaysPerWeek,
    avgExerciseDurationMins
  );
  const tdee = Math.round(bmr * activityMultiplier);

  // 3. Safety Floors
  const minSafeFloorCalories = gender === 'female' ? 1200 : 1500;
  const maxSafeWeeklyLossKg = 1.0; // Over 1 kg/week risks muscle catabolism & gallstones

  // 4. Calculate deficit / surplus based on goal
  let dailyCalorieDeficitOrSurplus = 0;
  let weeklyWeightChangeKg = 0;
  let estimatedWeeksToGoal = Math.max(1, targetWeeks || 12);
  let isAggressive = false;
  let isTooLowCalories = false;
  let warningMessage: string | undefined;
  let safeAlternativeDeficit: number | undefined;
  let safeAlternativeWeeks: number | undefined;

  // 1 kg body fat ≈ 7,700 kcal
  const KCAL_PER_KG_FAT = 7700;

  if (goalType === 'lose') {
    const totalWeightToLose =
      targetWeightChangeKg > 0
        ? targetWeightChangeKg
        : Math.max(0.5, currentWeightKg - targetWeightKg);

    const safeTargetWeeks = Math.max(1, targetWeeks || 12);
    // Calculated required weekly weight loss
    const calculatedWeeklyLossKg = totalWeightToLose / safeTargetWeeks;
    // Daily deficit = (weeklyLossKg * 7700) / 7
    let rawDailyDeficit = Math.round((calculatedWeeklyLossKg * KCAL_PER_KG_FAT) / 7);

    // Guardrail: Flag aggressive loss
    if (calculatedWeeklyLossKg > maxSafeWeeklyLossKg || rawDailyDeficit > 850) {
      isAggressive = true;
      const safeWeeklyLoss = 0.5; // Healthy 0.5 kg/week
      safeAlternativeWeeks = Math.ceil(totalWeightToLose / safeWeeklyLoss);
      safeAlternativeDeficit = Math.round((safeWeeklyLoss * KCAL_PER_KG_FAT) / 7); // ~550 kcal/day

      warningMessage = `Your requested timeline requires losing ${calculatedWeeklyLossKg.toFixed(
        1
      )} kg/week (${rawDailyDeficit} kcal daily deficit). Nutritional science recommends a sustainable rate of 0.4 - 0.75 kg/week to protect metabolic health and muscle mass. We suggest extending your timeframe to ${safeAlternativeWeeks} weeks for a safe ${safeAlternativeDeficit} kcal/day deficit.`;

      // Cap extreme raw deficit to avoid starvation calculations
      rawDailyDeficit = Math.min(rawDailyDeficit, 850);
    }

    let calculatedTarget = tdee - rawDailyDeficit;

    // Guardrail: Floor check
    if (calculatedTarget < minSafeFloorCalories) {
      isTooLowCalories = true;
      calculatedTarget = minSafeFloorCalories;
      rawDailyDeficit = tdee - minSafeFloorCalories;
      warningMessage = `Daily calories cannot safely drop below ${minSafeFloorCalories} kcal for your profile without direct medical supervision. The target has been adjusted to ${minSafeFloorCalories} kcal/day.`;
    }

    dailyCalorieDeficitOrSurplus = -rawDailyDeficit;
    weeklyWeightChangeKg = -Number(((rawDailyDeficit * 7) / KCAL_PER_KG_FAT).toFixed(2));
    estimatedWeeksToGoal =
      weeklyWeightChangeKg !== 0
        ? Math.ceil(totalWeightToLose / Math.abs(weeklyWeightChangeKg))
        : targetWeeks;
  } else if (goalType === 'gain') {
    const totalWeightToGain =
      targetWeightChangeKg > 0
        ? targetWeightChangeKg
        : Math.max(0.5, targetWeightKg - currentWeightKg);

    // Clean surplus: 300 to 450 kcal/day (~0.25 - 0.4 kg/week lean gain)
    const rawDailySurplus = 350;
    dailyCalorieDeficitOrSurplus = rawDailySurplus;
    weeklyWeightChangeKg = Number(((rawDailySurplus * 7) / KCAL_PER_KG_FAT).toFixed(2));
    estimatedWeeksToGoal = Math.ceil(totalWeightToGain / Math.max(0.1, weeklyWeightChangeKg));
  } else {
    // Maintain weight
    dailyCalorieDeficitOrSurplus = 0;
    weeklyWeightChangeKg = 0;
    estimatedWeeksToGoal = 0;
  }

  const dailyCalorieTarget = Math.round(tdee + dailyCalorieDeficitOrSurplus);

  // 5. Calculate Macros
  const macroTargets = calculateMacroTargets(
    currentWeightKg,
    dailyCalorieTarget,
    goalType,
    dietPreference,
    exerciseDaysPerWeek
  );

  // 6. Transparent Step-by-Step Rationale
  const genderLabel = gender === 'male' ? 'men' : gender === 'female' ? 'women' : 'standard';
  const bmrFormula = `BMR = (10 × ${currentWeightKg} kg) + (6.25 × ${heightCm} cm) - (5 × ${age} yrs) ${
    gender === 'male' ? '+ 5' : gender === 'female' ? '- 161' : '- 78'
  } = ${bmr} kcal/day`;

  const activityExplanation = `Multiplied BMR (${bmr}) by ${activityMultiplier} based on ${activityLevel.replace(
    '_',
    ' '
  )} lifestyle (${exerciseDaysPerWeek} exercise sessions/week).`;

  const maintenanceExplanation = `Estimated Maintenance (TDEE) = ${tdee} kcal/day. At this intake, your weight remains stable without exercise adjustment.`;

  const goalAdjustmentExplanation =
    goalType === 'lose'
      ? `Applied a daily deficit of ${Math.abs(
          dailyCalorieDeficitOrSurplus
        )} kcal/day from maintenance (${tdee} kcal) to target ~${Math.abs(
          weeklyWeightChangeKg
        )} kg fat loss per week.`
      : goalType === 'gain'
      ? `Added a lean surplus of +${dailyCalorieDeficitOrSurplus} kcal/day over maintenance (${tdee} kcal) to support controlled muscle recovery and tissue building.`
      : `Set equal to your maintenance calories (${tdee} kcal) for weight stabilization.`;

  const macroExplanation = `Protein: ${macroTargets.proteinG}g (~${(
    macroTargets.proteinG / currentWeightKg
  ).toFixed(1)}g/kg body weight) | Fat: ${macroTargets.fatG}g (~${Math.round(
    ((macroTargets.fatG * 9) / dailyCalorieTarget) * 100
  )}% of calories) | Carbs: ${macroTargets.carbsG}g (~${Math.round(
    ((macroTargets.carbsG * 4) / dailyCalorieTarget) * 100
  )}% of calories) | Fiber: ${macroTargets.fiberG}g.`;

  return {
    bmr,
    activityMultiplier,
    tdee,
    dailyCalorieTarget,
    dailyCalorieDeficitOrSurplus,
    weeklyWeightChangeKg,
    estimatedWeeksToGoal,
    safetyFlags: {
      isAggressive,
      isTooLowCalories,
      warningMessage,
      safeAlternativeDeficit,
      safeAlternativeWeeks,
      minSafeFloorCalories,
    },
    macroTargets,
    transparency: {
      bmrFormula,
      activityExplanation,
      maintenanceExplanation,
      goalAdjustmentExplanation,
      macroExplanation,
    },
  };
}

/**
 * Exercise MET-based calorie burn calculator
 * Calories = MET × weight_kg × (duration_mins / 60)
 */
export const EXERCISE_MET_DATABASE: Record<
  string,
  { name: string; category: string; low: number; moderate: number; high: number }
> = {
  walking: { name: 'Walking', category: 'Cardio', low: 2.8, moderate: 3.5, high: 4.8 },
  running: { name: 'Running', category: 'Cardio', low: 7.0, moderate: 8.5, high: 11.5 },
  cycling: { name: 'Cycling', category: 'Cardio', low: 4.5, moderate: 6.8, high: 9.5 },
  gym_weights: { name: 'Gym / Weight Training', category: 'Strength', low: 3.5, moderate: 5.0, high: 6.5 },
  swimming: { name: 'Swimming', category: 'Cardio', low: 5.0, moderate: 6.5, high: 9.0 },
  badminton: { name: 'Badminton', category: 'Sports', low: 4.5, moderate: 5.8, high: 7.5 },
  cricket: { name: 'Cricket', category: 'Sports', low: 3.5, moderate: 4.8, high: 6.0 },
  football: { name: 'Football / Soccer', category: 'Sports', low: 6.0, moderate: 7.8, high: 10.0 },
  hiit: { name: 'HIIT / Circuit Training', category: 'Intense', low: 6.5, moderate: 8.5, high: 11.0 },
  yoga: { name: 'Yoga / Stretching', category: 'Flexibility', low: 2.2, moderate: 2.8, high: 3.8 },
  other: { name: 'General Exercise', category: 'General', low: 3.5, moderate: 5.0, high: 7.0 },
};

export function estimateExerciseCalories(
  exerciseKey: string,
  durationMins: number,
  intensity: 'low' | 'moderate' | 'high',
  userWeightKg: number
): { caloriesBurned: number; met: number } {
  const exercise = EXERCISE_MET_DATABASE[exerciseKey] || EXERCISE_MET_DATABASE.other;
  const met = exercise[intensity] || exercise.moderate;
  const hours = durationMins / 60;
  const calories = Math.round(met * userWeightKg * hours);
  return { caloriesBurned: Math.max(1, calories), met };
}
