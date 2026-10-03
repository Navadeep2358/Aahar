import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  UserProfile,
  Gender,
  ActivityLevel,
  GoalType,
  DietPreference,
} from '../types/nutrition';
import {
  User,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Activity,
  Utensils,
  Flame,
} from 'lucide-react';

interface ProfileViewProps {
  onOpenWizard: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenWizard }) => {
  const {
    currentUser,
    userProfile,
    updateUserProfile,
    logout,
    connectGoogleFit,
    disconnectGoogleFit,
  } = useNutrition();

  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(userProfile.age);
  const [gender, setGender] = useState<Gender>(userProfile.gender);
  const [heightCm, setHeightCm] = useState(userProfile.heightCm);
  const [currentWeightKg, setCurrentWeightKg] = useState(userProfile.currentWeightKg);
  const [targetWeightKg, setTargetWeightKg] = useState(userProfile.targetWeightKg);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(userProfile.activityLevel);
  const [exerciseDaysPerWeek, setExerciseDaysPerWeek] = useState(userProfile.exerciseDaysPerWeek);
  const [avgExerciseDurationMins, setAvgExerciseDurationMins] = useState(userProfile.avgExerciseDurationMins);
  const [dailyStepLevel, setDailyStepLevel] = useState(userProfile.dailyStepLevel);
  const [goalType, setGoalType] = useState<GoalType>(userProfile.goalType);
  const [targetWeeks, setTargetWeeks] = useState(userProfile.targetWeeks || 12);
  const [dietPreference, setDietPreference] = useState<DietPreference>(userProfile.dietPreference);
  const [allergiesText, setAllergiesText] = useState((userProfile.allergies || []).join(', '));
  const [dislikedFoodsText, setDislikedFoodsText] = useState((userProfile.dislikedFoods || []).join(', '));
  const [mealsPerDay, setMealsPerDay] = useState(userProfile.mealsPerDay || 4);

  // Optional measurements
  const [waistCm, setWaistCm] = useState(userProfile.measurements?.waistCm || '');
  const [hipCm, setHipCm] = useState(userProfile.measurements?.hipCm || '');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    const allergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const dislikedFoods = dislikedFoodsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateUserProfile({
      name: name.trim() || 'User',
      age: Number(age) || 28,
      gender,
      heightCm: Number(heightCm) || 170,
      currentWeightKg: Number(currentWeightKg) || 70,
      targetWeightKg: Number(targetWeightKg) || 65,
      activityLevel,
      exerciseDaysPerWeek: Number(exerciseDaysPerWeek) || 0,
      avgExerciseDurationMins: Number(avgExerciseDurationMins) || 30,
      dailyStepLevel: dailyStepLevel as any,
      goalType,
      targetWeeks: Number(targetWeeks) || 12,
      dietPreference,
      allergies,
      dislikedFoods,
      mealsPerDay: mealsPerDay as any,
      measurements: {
        waistCm: waistCm ? Number(waistCm) : undefined,
        hipCm: hipCm ? Number(hipCm) : undefined,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600" />
            Profile & Health Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify personal parameters to update your Mifflin-St Jeor BMR and macro calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenWizard}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Re-run Setup Wizard
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        {/* Section 1: Bio Data */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            Biological Measurements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
              <input
                type="number"
                min={12}
                max={100}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 28)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Biological Sex</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 capitalize"
              >
                <option value="male">Male (+5 kcal Mifflin factor)</option>
                <option value="female">Female (-161 kcal Mifflin factor)</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                min={100}
                max={240}
                value={heightCm}
                onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 170)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min={35}
                max={250}
                value={currentWeightKg}
                onChange={(e) => setCurrentWeightKg(parseFloat(e.target.value) || 70)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min={35}
                max={250}
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 65)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono text-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Activity & Exercise */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Activity & Exercise Frequency
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Multiplier</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold capitalize"
              >
                <option value="sedentary">Sedentary (1.20×)</option>
                <option value="lightly_active">Lightly Active (1.375×)</option>
                <option value="moderately_active">Moderately Active (1.55×)</option>
                <option value="very_active">Very Active (1.725×)</option>
                <option value="extra_active">Extra Active (1.90×)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise Days/Week</label>
              <select
                value={exerciseDaysPerWeek}
                onChange={(e) => setExerciseDaysPerWeek(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    {num} days per week
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Avg Session Duration</label>
              <select
                value={avgExerciseDurationMins}
                onChange={(e) => setAvgExerciseDurationMins(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              >
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Goal & Diet */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            Diet Style & Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Strategy</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold capitalize"
              >
                <option value="lose">Lose Weight (Calorie Deficit)</option>
                <option value="maintain">Maintain Weight (TDEE Baseline)</option>
                <option value="gain">Gain Muscle / Mass (Surplus)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diet Style</label>
              <select
                value={dietPreference}
                onChange={(e) => setDietPreference(e.target.value as DietPreference)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold capitalize"
              >
                <option value="normal_indian">Normal / Indian Diet</option>
                <option value="high_protein">High Protein (2.0g/kg)</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="keto">Keto (High Fat, Low Carb)</option>
                <option value="low_carb">Low Carbohydrate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Weeks</label>
              <input
                type="number"
                min={2}
                max={52}
                value={targetWeeks}
                onChange={(e) => setTargetWeeks(parseInt(e.target.value, 10) || 12)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Allergies / Intolerances</label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Gluten, Lactose, Nuts"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disliked / Excluded Foods</label>
              <input
                type="text"
                value={dislikedFoodsText}
                onChange={(e) => setDislikedFoodsText(e.target.value)}
                placeholder="e.g. Bitter gourd, Pork, Sugar"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Optional Body Measurements */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Flame className="w-4 h-4 text-emerald-600" />
            Body Circumference Measurements (Optional)
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Waist Circumference (cm)</label>
              <input
                type="number"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                placeholder="e.g. 88 cm"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hip Circumference (cm)</label>
              <input
                type="number"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
                placeholder="e.g. 98 cm"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Profile & Nutrition Plan Updated!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Recalculate Daily Targets
              </>
            )}
          </button>
        </div>
      </div>

      {/* MEDICAL & SAFETY GUARDRAILS (Section 23) */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 text-xs text-amber-900 space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-sm">Important Medical & Clinical Safety Notice</span>
        </div>
        <p className="leading-relaxed">
          Aahaar is an educational diet tracking and calorie balancing assistant. It does not provide medical diagnoses, treatment plans, or prescriptive therapeutic diets.
        </p>
        <p className="leading-relaxed">
          Users who are pregnant, nursing, under 18, managing chronic kidney or metabolic disease, or recovering from eating disorders should always consult a licensed medical professional before implementing caloric deficits or altering macronutrient distributions.
        </p>
      </div>

      {/* Account & Google Fit Integration Settings */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Account & Device Connections
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">Account Email</span>
              <p className="text-slate-400 text-[11px]">{currentUser?.email || 'Guest User'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition text-xs"
            >
              Sign Out
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">Google Fit Sync</span>
              <p className="text-slate-400 text-[11px]">
                {currentUser?.googleFitConnected
                  ? 'Connected • Steps & active calories automatically calculated with AI'
                  : 'Not connected'}
              </p>
            </div>
            {currentUser?.googleFitConnected ? (
              <button
                type="button"
                onClick={disconnectGoogleFit}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition text-xs"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={connectGoogleFit}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition text-xs shadow-xs"
              >
                Connect Google Fit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
