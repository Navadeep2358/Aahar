import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { MealType, LoggedMealItem } from '../types/nutrition';
import { getTodayDateString, getDateOffsetString } from '../utils/storage';
import {
  Flame,
  Plus,
  Camera,
  Activity,
  Droplet,
  Scale,
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface DashboardProps {
  onOpenAddFood: (mealType?: MealType) => void;
  onOpenScanMeal: (mealType?: MealType) => void;
  onOpenAddExercise: () => void;
  onOpenLogWeight: () => void;
  onOpenTransparency: () => void;
  onOpenGoogleFit: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddFood,
  onOpenScanMeal,
  onOpenAddExercise,
  onOpenLogWeight,
  onOpenTransparency,
  onOpenGoogleFit,
}) => {
  const {
    currentUser,
    userProfile,
    caloriePlan,
    selectedDate,
    setSelectedDate,
    currentDayLog,
    daySummary,
    addWater,
    removeMealItem,
    removeExercise,
    repeatMeal,
    googleFitSyncData,
    syncGoogleFit,
    isSyncingGoogleFit,
  } = useNutrition();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Time-based greeting (Section 20)
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'GOOD MORNING'
      : currentHour < 17
      ? 'GOOD AFTERNOON'
      : 'GOOD EVENING';

  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  const navigateDate = (deltaDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${da}`);
  };

  // Meal slots
  const mealSlots: { id: MealType; label: string; icon: string; time: string }[] = [
    { id: 'breakfast', label: 'Breakfast', icon: '🥞', time: '8:00 AM' },
    { id: 'morning_snack', label: 'Morning Snack', icon: '🍎', time: '11:00 AM' },
    { id: 'lunch', label: 'Lunch', icon: '🍛', time: '1:30 PM' },
    { id: 'evening_snack', label: 'Evening Snack', icon: '☕', time: '5:00 PM' },
    { id: 'dinner', label: 'Dinner', icon: '🍲', time: '8:30 PM' },
    { id: 'late_night', label: 'Late-Night Snack', icon: '🥛', time: '10:30 PM' },
  ];

  // Calories Progress Calculation
  const calPercent = Math.min(100, Math.round((daySummary.caloriesConsumed / Math.max(1, daySummary.calorieTarget)) * 100));

  // Color-coded status (Section 21)
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let ringBg = 'stroke-emerald-500';
  if (daySummary.remainingCalories < -200) {
    statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
    ringBg = 'stroke-rose-500';
  } else if (daySummary.remainingCalories < 150) {
    statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
    ringBg = 'stroke-amber-500';
  }

  // Handle Repeat Meal
  const handleRepeatMeal = (mealType: MealType) => {
    // Attempt repeat from yesterday
    const yesterday = getDateOffsetString(1);
    const success = repeatMeal(yesterday, mealType, selectedDate);
    if (success) {
      showToast(`Copied yesterday's ${mealType.replace('_', ' ')} items!`);
    } else {
      showToast(`No logged items found in yesterday's ${mealType.replace('_', ' ')}.`);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700">
            {greeting}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
            {userProfile.name || 'Nutrition Champion'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Goal: <span className="font-semibold text-slate-700 capitalize">{userProfile.goalType} weight</span> ({userProfile.currentWeightKg} kg → {userProfile.targetWeightKg} kg)
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => navigateDate(-1)}
            className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 font-mono">
              {isToday ? 'Today, ' : ''}
              {new Date(selectedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* QUICK ACTION BUTTONS (Section 20) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => onOpenAddFood()}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-sm shadow-emerald-600/20 transition flex items-center justify-center gap-2 group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition" />
          <span>Add Food</span>
        </button>
        <button
          onClick={() => onOpenScanMeal()}
          className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-sm shadow-teal-600/20 transition flex items-center justify-center gap-2 group"
        >
          <Camera className="w-4 h-4 group-hover:scale-110 transition" />
          <span>📷 Scan Meal</span>
        </button>
        <button
          onClick={onOpenAddExercise}
          className="p-3 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
        >
          <Activity className="w-4 h-4 text-orange-600" />
          <span>Add Exercise</span>
        </button>
        <button
          onClick={() => addWater(250)}
          className="p-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
        >
          <Droplet className="w-4 h-4 text-blue-600" />
          <span>+250ml Water</span>
        </button>
        <button
          onClick={onOpenLogWeight}
          className="p-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 col-span-2 sm:col-span-1"
        >
          <Scale className="w-4 h-4 text-slate-600" />
          <span>⚖️ Log Weight</span>
        </button>
      </div>

      {/* GOOGLE FIT LIVE ACTIVITY & STEPS WIDGET */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-teal-50/50 rounded-3xl p-4 sm:p-5 border border-blue-100/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Google Fit Today</span>
              {currentUser?.googleFitConnected && (
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  Synced
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {googleFitSyncData ? (
                googleFitSyncData.steps > 0 ? (
                  <>
                    <strong className="text-slate-900 font-mono">
                      {googleFitSyncData.steps.toLocaleString()}
                    </strong>{' '}
                    steps •{' '}
                    <strong className="text-emerald-700 font-mono">
                      {googleFitSyncData.caloriesBurned} kcal
                    </strong>{' '}
                    real movement burn from Google Fit
                  </>
                ) : (
                  <>
                    <strong className="text-slate-800 font-mono">0 steps</strong> recorded on Google Fit today • Live synced
                  </>
                )
              ) : (
                'Link Google Fit to pull real step data and calculate accurate calories burned'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {currentUser?.googleFitConnected ? (
            <button
              type="button"
              onClick={() => syncGoogleFit(selectedDate)}
              disabled={isSyncingGoogleFit}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSyncingGoogleFit ? 'animate-spin' : ''}`} />
              <span>{isSyncingGoogleFit ? 'Syncing...' : 'Sync Fit'}</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenGoogleFit}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
          >
            {currentUser?.googleFitConnected ? 'View AI Fit Breakdown' : 'Connect Google Fit'}
          </button>
        </div>
      </div>

      {/* TODAY'S ENERGY BALANCE CARD (Section 3 & 8) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Calorie Ring and Main Metric */}
          <div className="flex items-center gap-6 w-full md:w-auto justify-center md:justify-start">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  className="stroke-slate-100 fill-none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - calPercent / 100)}
                  strokeLinecap="round"
                  className={`${ringBg} fill-none transition-all duration-700`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Consumed</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {daySummary.caloriesConsumed}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  / {daySummary.calorieTarget}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Today's Calorie Target
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {Math.abs(daySummary.remainingCalories)}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  kcal {daySummary.remainingCalories >= 0 ? 'Remaining' : 'Over Target'}
                </span>
              </div>

              {/* Status Badge */}
              <div className="pt-1">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {daySummary.remainingCalories >= 0
                    ? `On track (${calPercent}% of daily budget)`
                    : `Exceeded target by ${Math.abs(daySummary.remainingCalories)} kcal`}
                </span>
              </div>
            </div>
          </div>

          {/* Calorie Breakdown Pillars */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Food Intake</span>
              <span className="text-lg font-black text-slate-800 font-mono mt-0.5 block">
                {daySummary.caloriesConsumed}
              </span>
              <span className="text-[10px] text-slate-400">kcal eaten</span>
            </div>

            <div className="p-3 bg-orange-50/70 rounded-2xl border border-orange-100">
              <span className="text-[10px] uppercase font-bold text-orange-600 block">Exercise</span>
              <span className="text-lg font-black text-orange-700 font-mono mt-0.5 block">
                {daySummary.exerciseBurned}
              </span>
              <span className="text-[10px] text-orange-500">kcal burned</span>
            </div>

            <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-100">
              <span className="text-[10px] uppercase font-bold text-teal-700 block">Expenditure</span>
              <span className="text-lg font-black text-teal-800 font-mono mt-0.5 block">
                {daySummary.totalExpenditure}
              </span>
              <span className="text-[10px] text-teal-600">TDEE + active</span>
            </div>
          </div>
        </div>

        {/* Energy Balance Result (Section 8) */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Daily Energy Balance Classification
              </span>
              <button
                onClick={onOpenTransparency}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] underline flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" />
                How was this calculated?
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Food ({daySummary.caloriesConsumed} kcal) − Total Expenditure ({daySummary.totalExpenditure} kcal) ={' '}
              <span
                className={`font-black font-mono ${
                  daySummary.netCalorieBalance < 0
                    ? 'text-emerald-400'
                    : daySummary.netCalorieBalance > 200
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {daySummary.netCalorieBalance > 0
                  ? `+${daySummary.netCalorieBalance}`
                  : daySummary.netCalorieBalance}{' '}
                kcal
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider ${
                daySummary.netCalorieBalance < -150
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : daySummary.netCalorieBalance > 150
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {daySummary.netCalorieBalance < -150
                ? '📉 Calorie Deficit'
                : daySummary.netCalorieBalance > 150
                ? '📈 Calorie Surplus'
                : '⚖️ Around Maintenance'}
            </span>
          </div>
        </div>

        {/* Mandatory Section 3 Educational Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Note on energy balance:</strong> Exercise calories are estimates and should not automatically be treated as permission to eat back every calorie burned. Your body adapts dynamically.
          </p>
        </div>
      </div>

      {/* MACRONUTRIENT PROGRESS & HYDRATION (Section 10 & 11) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Macronutrients Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Personalized Macronutrient Targets
            </h2>
            <span className="text-[10px] text-slate-400">Diet: {userProfile.dietPreference.replace('_', ' ')}</span>
          </div>

          <div className="space-y-3.5">
            {/* Protein */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Protein
                </span>
                <span className="font-mono text-slate-600 font-bold">
                  {daySummary.proteinConsumed} / {daySummary.proteinTarget} g
                  <span className="text-slate-400 font-normal ml-1">
                    ({Math.round((daySummary.proteinConsumed / Math.max(1, daySummary.proteinTarget)) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (daySummary.proteinConsumed / Math.max(1, daySummary.proteinTarget)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Carbohydrates */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Carbohydrates
                </span>
                <span className="font-mono text-slate-600 font-bold">
                  {daySummary.carbsConsumed} / {daySummary.carbsTarget} g
                  <span className="text-slate-400 font-normal ml-1">
                    ({Math.round((daySummary.carbsConsumed / Math.max(1, daySummary.carbsTarget)) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (daySummary.carbsConsumed / Math.max(1, daySummary.carbsTarget)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Fat
                </span>
                <span className="font-mono text-slate-600 font-bold">
                  {daySummary.fatConsumed} / {daySummary.fatTarget} g
                  <span className="text-slate-400 font-normal ml-1">
                    ({Math.round((daySummary.fatConsumed / Math.max(1, daySummary.fatTarget)) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (daySummary.fatConsumed / Math.max(1, daySummary.fatTarget)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Dietary Fiber */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Dietary Fiber
                </span>
                <span className="font-mono text-slate-600 font-bold">
                  {daySummary.fiberConsumed} / {daySummary.fiberTarget} g
                  <span className="text-slate-400 font-normal ml-1">
                    ({Math.round((daySummary.fiberConsumed / Math.max(1, daySummary.fiberTarget)) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (daySummary.fiberConsumed / Math.max(1, daySummary.fiberTarget)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hydration Tracker Card (Section 11) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                Water Tracker
              </h2>
              <span className="text-xs font-bold text-blue-600 font-mono">
                {daySummary.waterConsumed} / {daySummary.waterTarget} ml
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personalized hydration goal: ~35 ml per kg body weight + exercise replenishment.
            </p>

            {/* Water progress bar */}
            <div className="h-3 rounded-full bg-blue-50 overflow-hidden mt-3 border border-blue-100">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (daySummary.waterConsumed / Math.max(1, daySummary.waterTarget)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Quick Increment Buttons (Section 11) */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[250, 500, 750, 1000].map((ml) => (
              <button
                key={ml}
                onClick={() => addWater(ml)}
                className="py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition flex items-center justify-center gap-1"
              >
                +{ml >= 1000 ? '1L' : `${ml}ml`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DAILY HEALTH SUMMARY CARD (Section 12) */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 rounded-3xl p-5 sm:p-6 border border-emerald-100 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Daily Health Summary & Factual Interpretation
          </h2>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {daySummary.evaluationNote}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500 border-t border-emerald-100/60">
          <span>Calories: <strong>{daySummary.caloriesConsumed} / {daySummary.calorieTarget} kcal</strong></span>
          <span>Protein: <strong>{daySummary.proteinConsumed} / {daySummary.proteinTarget} g</strong></span>
          <span>Carbs: <strong>{daySummary.carbsConsumed} / {daySummary.carbsTarget} g</strong></span>
          <span>Fat: <strong>{daySummary.fatConsumed} / {daySummary.fatTarget} g</strong></span>
          <span>Fiber: <strong>{daySummary.fiberConsumed} / {daySummary.fiberTarget} g</strong></span>
          <span>Exercise: <strong>{daySummary.exerciseBurned} kcal burned</strong></span>
        </div>
      </div>

      {/* MEALS OF THE DAY LIST (Section 7) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Today's Meals & Food Logs</h2>
          <span className="text-xs text-slate-400">Unlimited items per meal slot</span>
        </div>

        <div className="space-y-4">
          {mealSlots.map((slot) => {
            const items = currentDayLog.meals[slot.id] || [];
            const mealCals = items.reduce((sum, it) => sum + it.calories, 0);
            const mealProtein = items.reduce((sum, it) => sum + it.protein, 0);
            const mealCarbs = items.reduce((sum, it) => sum + it.carbs, 0);
            const mealFat = items.reduce((sum, it) => sum + it.fat, 0);
            const mealFiber = items.reduce((sum, it) => sum + it.fiber, 0);

            return (
              <div
                key={slot.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden transition"
              >
                {/* Meal Slot Header */}
                <div className="p-4 sm:p-5 flex items-center justify-between bg-slate-50/70 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{slot.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{slot.label}</h3>
                        <span className="text-[10px] text-slate-400">{slot.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {items.length === 0
                          ? 'No items logged yet'
                          : `${items.length} item${items.length > 1 ? 's' : ''} • P: ${mealProtein.toFixed(1)}g | C: ${mealCarbs.toFixed(1)}g | F: ${mealFat.toFixed(1)}g`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-1">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">
                        {mealCals}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-0.5">kcal</span>
                    </div>

                    {/* Quick Repeat Meal Button */}
                    <button
                      onClick={() => handleRepeatMeal(slot.id)}
                      title="Repeat this meal from yesterday"
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Add Food to this Slot */}
                    <button
                      onClick={() => onOpenAddFood(slot.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Meal Food Items List */}
                {items.length > 0 && (
                  <div className="divide-y divide-slate-50 p-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 rounded-xl transition"
                      >
                        <div className="flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            {item.cookingMethod && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.cookingMethod}
                              </span>
                            )}
                            {item.addedFat && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                                +{item.addedFat.tsp} tsp {item.addedFat.type}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.selectedPortion.label} ({item.totalGrams}g) • P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g | Fib: {item.fiber}g
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-800 font-mono">
                            {item.calories} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                          </span>
                          <button
                            onClick={() => removeMealItem(slot.id, item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LOGGED EXERCISES LIST (Section 9) */}
      {(currentDayLog.exercises || []).length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              Logged Exercises ({currentDayLog.exercises.length})
            </h3>
            <span className="text-xs font-bold text-orange-600 font-mono">
              Total: {daySummary.exerciseBurned} kcal
            </span>
          </div>

          <div className="space-y-2">
            {currentDayLog.exercises.map((ex) => (
              <div
                key={ex.id}
                className="p-3 bg-orange-50/40 border border-orange-100 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{ex.type}</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {ex.durationMins} mins • {ex.intensity} intensity {ex.isManualEntry ? '(Wearable Device)' : `(MET ${ex.metValue})`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-orange-700 font-mono text-sm">
                    {ex.caloriesBurned} kcal
                  </span>
                  <button
                    onClick={() => removeExercise(ex.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
