import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  Gender,
  ActivityLevel,
  GoalType,
  DietPreference,
  UserProfile,
} from '../types/nutrition';
import {
  calculateBMR,
  getActivityMultiplier,
} from '../utils/nutritionCalculations';
import {
  Sparkles,
  Flame,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Scale,
  Activity,
  Utensils,
  ShieldAlert,
} from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { userProfile, updateUserProfile, logWeight } = useNutrition();
  const [step, setStep] = useState<number>(1);

  // Form states
  const [name, setName] = useState(userProfile.name || '');
  const [age, setAge] = useState(userProfile.age || 26);
  const [gender, setGender] = useState<Gender>(userProfile.gender || 'male');
  const [heightCm, setHeightCm] = useState(userProfile.heightCm || 170);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(7);

  const [currentWeightKg, setCurrentWeightKg] = useState(userProfile.currentWeightKg || 70);
  const [targetWeightKg, setTargetWeightKg] = useState(userProfile.targetWeightKg || 65);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(userProfile.activityLevel || 'moderately_active');
  const [exerciseDaysPerWeek, setExerciseDaysPerWeek] = useState(userProfile.exerciseDaysPerWeek || 3);
  const [avgExerciseDurationMins, setAvgExerciseDurationMins] = useState(userProfile.avgExerciseDurationMins || 40);
  const [dailyStepLevel, setDailyStepLevel] = useState<'<5000' | '5000-8000' | '8000-12000' | '12000+'>(userProfile.dailyStepLevel || '8000-12000');

  const [goalType, setGoalType] = useState<GoalType>(userProfile.goalType || 'lose');
  const [targetWeeks, setTargetWeeks] = useState(userProfile.targetWeeks || 10);

  const [dietPreference, setDietPreference] = useState<DietPreference>(userProfile.dietPreference || 'normal_indian');
  const [allergiesText, setAllergiesText] = useState((userProfile.allergies || []).join(', '));
  const [dislikedFoodsText, setDislikedFoodsText] = useState((userProfile.dislikedFoods || []).join(', '));
  const [mealsPerDay, setMealsPerDay] = useState<3 | 4 | 5 | 6>(userProfile.mealsPerDay || 4);

  // Body measurements (optional)
  const [waistCm, setWaistCm] = useState<number | undefined>(userProfile.measurements?.waistCm);
  const [hipCm, setHipCm] = useState<number | undefined>(userProfile.measurements?.hipCm);

  // Live calculations for preview
  const effectiveHeightCm =
    heightUnit === 'cm'
      ? heightCm
      : Math.round((heightFt * 12 + heightIn) * 2.54);

  const effectiveWeightKg =
    weightUnit === 'kg'
      ? currentWeightKg
      : Number((currentWeightKg * 0.453592).toFixed(1));

  const effectiveTargetKg =
    weightUnit === 'kg'
      ? targetWeightKg
      : Number((targetWeightKg * 0.453592).toFixed(1));

  const liveBMR = calculateBMR(effectiveWeightKg, effectiveHeightCm, age, gender);
  const liveMultiplier = getActivityMultiplier(activityLevel, exerciseDaysPerWeek, avgExerciseDurationMins);
  const liveTDEE = Math.round(liveBMR * liveMultiplier);

  const weightDiff = Math.abs(effectiveWeightKg - effectiveTargetKg);
  const weeklyRate = targetWeeks > 0 ? Number((weightDiff / targetWeeks).toFixed(2)) : 0.5;
  const isAggressiveLoss = goalType === 'lose' && (weeklyRate > 1.0 || (weeklyRate * 7700) / 7 > 850);
  const isTooLowCalories = goalType === 'lose' && liveTDEE - Math.round((weeklyRate * 7700) / 7) < (gender === 'female' ? 1200 : 1500);

  const handleFinish = () => {
    const allergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const dislikedFoods = dislikedFoodsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProfile: Partial<UserProfile> = {
      name: name.trim() || 'User',
      age: Number(age) || 28,
      gender,
      heightCm: effectiveHeightCm,
      currentWeightKg: effectiveWeightKg,
      targetWeightKg: effectiveTargetKg,
      activityLevel,
      exerciseDaysPerWeek: Number(exerciseDaysPerWeek) || 0,
      avgExerciseDurationMins: Number(avgExerciseDurationMins) || 30,
      dailyStepLevel,
      goalType,
      targetWeightChangeKg: Number(weightDiff.toFixed(1)),
      targetWeeks: Number(targetWeeks) || 12,
      dietPreference,
      allergies,
      dislikedFoods,
      mealsPerDay,
      measurements: {
        waistCm: waistCm ? Number(waistCm) : undefined,
        hipCm: hipCm ? Number(hipCm) : undefined,
      },
      isProfileSetup: true,
    };

    updateUserProfile(updatedProfile);
    logWeight(effectiveWeightKg);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-slate-50 to-teal-50/40 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 sm:px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Personal Nutrition Setup</h1>
                <p className="text-emerald-100 text-xs">Accurate, personalized calorie & macro planning</p>
              </div>
            </div>
            <span className="text-xs bg-white/20 text-white font-medium px-3 py-1.5 rounded-xl">
              Step {step} of 4
            </span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                    s <= step ? 'bg-white' : 'bg-emerald-800/40'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-emerald-100 mt-2 font-medium">
            <span>1. Bio Profile</span>
            <span>2. Activity</span>
            <span>3. Goal & Timeline</span>
            <span>4. Diet & Habits</span>
          </div>
        </div>

        {/* Wizard Content */}
        <div className="p-6 sm:p-8">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Used for clinical Mifflin-St Jeor Basal Metabolic Rate (BMR) calculation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value, 10) || 28)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Biological Sex
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['male', 'female', 'other'] as Gender[]).map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setGender(g)}
                        className={`py-2 text-xs font-semibold capitalize rounded-xl border transition ${
                          gender === g
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Height with unit toggle */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Height
                  </label>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        heightUnit === 'cm' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('ft')}
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        heightUnit === 'ft' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      ft / in
                    </button>
                  </div>
                </div>

                {heightUnit === 'cm' ? (
                  <div className="relative">
                    <input
                      type="number"
                      min={100}
                      max={240}
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 175)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">cm</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        min={3}
                        max={7}
                        value={heightFt}
                        onChange={(e) => setHeightFt(parseInt(e.target.value, 10) || 5)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                      <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">feet</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={heightIn}
                        onChange={(e) => setHeightIn(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                      <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">inches</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Weight & Target Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Current Weight
                    </label>
                    <span className="text-[11px] text-slate-400">kg</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={35}
                    max={250}
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(parseFloat(e.target.value) || 70)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Target Weight
                    </label>
                    <span className="text-[11px] text-slate-400">kg</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={35}
                    max={250}
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 65)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* BMR Preview pill */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <HeartPulse className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Calculated Basal Metabolic Rate (BMR):</span>
                    <p className="text-slate-500 text-[11px]">Energy burned at complete rest per Mifflin-St Jeor</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-700">{liveBMR}</span>
                  <span className="text-slate-500 text-[10px] ml-1">kcal/day</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Activity & Exercise */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Daily Activity & Exercise Routine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Defines your Total Daily Energy Expenditure (TDEE).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  General Baseline Activity Level
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'sedentary',
                      label: 'Sedentary',
                      desc: 'Desk job, little to no intentional exercise',
                      factor: '1.20',
                    },
                    {
                      id: 'lightly_active',
                      label: 'Lightly Active',
                      desc: 'Light daily walking, light exercise 1-3 days/week',
                      factor: '1.375',
                    },
                    {
                      id: 'moderately_active',
                      label: 'Moderately Active',
                      desc: 'Moderate physical job or regular workout 3-5 days/week',
                      factor: '1.55',
                    },
                    {
                      id: 'very_active',
                      label: 'Very Active',
                      desc: 'Hard exercise or sports 6-7 days/week',
                      factor: '1.725',
                    },
                    {
                      id: 'extra_active',
                      label: 'Extra Active',
                      desc: 'Athletic training twice a day or strenuous labor job',
                      factor: '1.90',
                    },
                  ].map((lvl) => (
                    <label
                      key={lvl.id}
                      onClick={() => setActivityLevel(lvl.id as ActivityLevel)}
                      className={`flex items-start justify-between p-3 rounded-2xl border cursor-pointer transition ${
                        activityLevel === lvl.id
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="activityLevel"
                          checked={activityLevel === lvl.id}
                          onChange={() => {}}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{lvl.label}</p>
                          <p className="text-xs text-slate-500">{lvl.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-lg shrink-0">
                        ×{lvl.factor}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exercise Days / Week
                  </label>
                  <select
                    value={exerciseDaysPerWeek}
                    onChange={(e) => setExerciseDaysPerWeek(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num === 0 ? 'No regular exercise' : `${num} days per week`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Avg Session Duration
                  </label>
                  <select
                    value={avgExerciseDurationMins}
                    onChange={(e) => setAvgExerciseDurationMins(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Daily Step Range
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '<5000', label: '< 5,000 steps' },
                    { id: '5000-8000', label: '5,000 - 8,000' },
                    { id: '8000-12000', label: '8,000 - 12,000' },
                    { id: '12000+', label: '12,000+ steps' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setDailyStepLevel(s.id as any)}
                      className={`py-2 text-xs font-medium rounded-xl border transition ${
                        dailyStepLevel === s.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TDEE Summary Box */}
              <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900">Estimated Maintenance Calories (TDEE):</span>
                  <p className="text-slate-500 text-[11px]">BMR ({liveBMR}) × Activity Multiplier ({liveMultiplier})</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-teal-800">{liveTDEE}</span>
                  <span className="text-slate-500 text-[10px] ml-1">kcal/day</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Goal & Timeline */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-emerald-600" />
                  Your Weight Goal & Calorie Strategy
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculate target deficit/surplus with evidence-based safety guardrails.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Primary Objective
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'lose', label: 'Lose Weight', icon: '📉' },
                    { id: 'maintain', label: 'Maintain Weight', icon: '⚖️' },
                    { id: 'gain', label: 'Gain Muscle/Mass', icon: '📈' },
                  ].map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => setGoalType(g.id as GoalType)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        goalType === g.id
                          ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl block mb-1">{g.icon}</span>
                      <span className="text-xs font-bold text-slate-800 block">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {goalType !== 'maintain' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Weight Change
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min={0.5}
                        max={60}
                        value={weightDiff}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 5;
                          if (goalType === 'lose') {
                            setTargetWeightKg(Number((currentWeightKg - val).toFixed(1)));
                          } else {
                            setTargetWeightKg(Number((currentWeightKg + val).toFixed(1)));
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">kg</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Timeframe to Reach Goal
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={2}
                        max={52}
                        value={targetWeeks}
                        onChange={(e) => setTargetWeeks(parseInt(e.target.value, 10) || 12)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">weeks</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety warning if rate is aggressive */}
              {isAggressiveLoss && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Potentially Aggressive Weight Loss Rate</p>
                    <p className="mt-1 text-amber-800">
                      Your chosen target requires losing{' '}
                      <span className="font-bold">{weeklyRate} kg/week</span>. Losing over 1.0 kg/week
                      can trigger muscle breakdown, nutritional deficiencies, and rebound weight regain.
                      We recommend extending your timeframe to at least{' '}
                      <span className="font-bold underline">{Math.ceil(weightDiff / 0.5)} weeks</span> for a safe 0.5 kg/week rate.
                    </p>
                  </div>
                </div>
              )}

              {isTooLowCalories && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-900">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Calorie Floor Warning</p>
                    <p className="mt-1 text-red-800">
                      Calculated daily calories would dip below the clinical safe floor ({gender === 'female' ? '1,200' : '1,500'} kcal/day). Aahaar will protect your metabolic health by keeping your target above this floor.
                    </p>
                  </div>
                </div>
              )}

              {/* Goal Calculation Preview Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Target Deficit / Surplus</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {goalType === 'lose'
                      ? `-${Math.round((weeklyRate * 7700) / 7)} kcal/day`
                      : goalType === 'gain'
                      ? `+350 kcal/day`
                      : '0 kcal (Maintenance)'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Estimated Weekly Change</span>
                  <span className="text-sm font-bold text-slate-200">
                    {goalType === 'lose' ? `~${weeklyRate} kg/week` : goalType === 'gain' ? `~0.3 kg/week` : '0 kg'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-semibold text-slate-300">Daily Calorie Target:</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {goalType === 'lose'
                      ? Math.max(gender === 'female' ? 1200 : 1500, liveTDEE - Math.round((weeklyRate * 7700) / 7))
                      : goalType === 'gain'
                      ? liveTDEE + 350
                      : liveTDEE}{' '}
                    <span className="text-xs font-normal text-slate-400">kcal</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Diet Preferences & Allergies */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  Dietary Preferences & Habits
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Helps prioritize relevant Indian food items and macro ratios.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Dietary Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'normal_indian', label: 'Normal / Indian Diet' },
                    { id: 'high_protein', label: 'High Protein' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'eggetarian', label: 'Eggetarian' },
                    { id: 'keto', label: 'Keto' },
                    { id: 'low_carb', label: 'Low Carb' },
                    { id: 'other', label: 'Other' },
                  ].map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setDietPreference(d.id as DietPreference)}
                      className={`p-2.5 text-xs rounded-xl border text-center font-medium transition ${
                        dietPreference === d.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Food Allergies / Intolerances
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="e.g. Gluten, Lactose, Peanuts, None"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Separate multiple with commas</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Foods You Do Not Eat
                </label>
                <input
                  type="text"
                  value={dislikedFoodsText}
                  onChange={(e) => setDislikedFoodsText(e.target.value)}
                  placeholder="e.g. Bitter gourd, Pork, Sugar, Deep-fried snacks"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Meals Per Day
                  </label>
                  <select
                    value={mealsPerDay}
                    onChange={(e) => setMealsPerDay(parseInt(e.target.value, 10) as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={3}>3 Meals (Breakfast, Lunch, Dinner)</option>
                    <option value={4}>4 Meals (Includes Evening Snack)</option>
                    <option value={5}>5 Meals (Includes Morning & Evening Snacks)</option>
                    <option value={6}>6 Small Meals (Athletic frequent fuel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Optional Waist Measurement (cm)
                  </label>
                  <input
                    type="number"
                    value={waistCm || ''}
                    onChange={(e) => setWaistCm(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g. 88 cm"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Medical Notice:</span> Aahaar is a nutritional education and tracking application. It does not provide medical diagnosis or treatment plans. Individuals with pregnancy, eating disorders, or chronic renal/metabolic conditions should consult a registered healthcare provider.
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Launch My Nutrition Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
