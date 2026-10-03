import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  Target,
  Flame,
  AlertTriangle,
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { calculateBMR, getActivityMultiplier } from '../utils/nutritionCalculations';

export const GoalCalculatorView: React.FC = () => {
  const { userProfile, updateUserProfile } = useNutrition();

  const [currentWeight, setCurrentWeight] = useState<number>(userProfile.currentWeightKg || 75);
  const [targetWeight, setTargetWeight] = useState<number>(userProfile.targetWeightKg || 70);
  const [targetWeeks, setTargetWeeks] = useState<number>(userProfile.targetWeeks || 12);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  const diffKg = Math.abs(currentWeight - targetWeight);
  const isLoss = targetWeight < currentWeight;
  const isGain = targetWeight > currentWeight;

  // Mifflin-St Jeor TDEE
  const bmr = calculateBMR(currentWeight, userProfile.heightCm, userProfile.age, userProfile.gender);
  const multiplier = getActivityMultiplier(
    userProfile.activityLevel,
    userProfile.exerciseDaysPerWeek,
    userProfile.avgExerciseDurationMins
  );
  const tdee = Math.round(bmr * multiplier);

  // Weekly rate required
  const safeWeeks = Math.max(1, targetWeeks);
  const weeklyRateKg = Number((diffKg / safeWeeks).toFixed(2));
  // Daily calorie deficit/surplus needed (1 kg fat ≈ 7,700 kcal)
  const dailyCaloriesDiff = Math.round((weeklyRateKg * 7700) / 7);

  const calculatedDailyTarget = isLoss
    ? tdee - dailyCaloriesDiff
    : isGain
    ? tdee + dailyCaloriesDiff
    : tdee;

  // Safety checks
  const minFloor = userProfile.gender === 'female' ? 1200 : 1500;
  const isAggressive = isLoss && (weeklyRateKg > 1.0 || dailyCaloriesDiff > 850);
  const isBelowFloor = isLoss && calculatedDailyTarget < minFloor;

  // Recommended sustainable parameters
  const recommendedWeeklyLoss = 0.5; // 0.5 kg/week
  const recommendedWeeks = Math.ceil(diffKg / recommendedWeeklyLoss);
  const recommendedDeficit = Math.round((recommendedWeeklyLoss * 7700) / 7); // 550 kcal/day
  const recommendedTarget = Math.max(minFloor, tdee - recommendedDeficit);

  const handleApplyToProfile = () => {
    updateUserProfile({
      currentWeightKg: currentWeight,
      targetWeightKg: targetWeight,
      targetWeeks: targetWeeks,
      targetWeightChangeKg: Number(diffKg.toFixed(1)),
      goalType: isLoss ? 'lose' : isGain ? 'gain' : 'maintain',
    });
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 4000);
  };

  const handleAdoptRecommended = () => {
    setTargetWeeks(recommendedWeeks);
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-1">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-emerald-600" />
          Nutritional Goal & Timeline Calculator
        </h1>
        <p className="text-xs text-slate-500">
          Simulate realistic body composition timelines before committing to a daily deficit or surplus.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              min={35}
              max={250}
              value={currentWeight}
              onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 70)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Goal Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              min={35}
              max={250}
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 65)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Desired Timeline (Weeks)
            </label>
            <input
              type="number"
              min={2}
              max={52}
              value={targetWeeks}
              onChange={(e) => setTargetWeeks(parseInt(e.target.value, 10) || 12)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Safety Warning for Aggressive Loss (Section 17) */}
        {isAggressive && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Caution: Aggressive Rate of Weight Loss</span>
            </div>
            <p className="leading-relaxed">
              Targeting a loss of <strong>{weeklyRateKg} kg/week</strong> requires an extreme deficit of{' '}
              <strong>{dailyCaloriesDiff} kcal/day</strong>. Diets with over 1.0 kg/week loss trigger high rates of muscle wasting, metabolic slowdown, and gallstones.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-amber-800 font-medium">
                Recommended sustainable timeline: <strong>{recommendedWeeks} weeks</strong> (0.5 kg/week)
              </span>
              <button
                type="button"
                onClick={handleAdoptRecommended}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition text-xs"
              >
                Use {recommendedWeeks} Weeks
              </button>
            </div>
          </div>
        )}

        {isBelowFloor && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Dangerous Calorie Level Warning</p>
              <p className="mt-0.5 leading-relaxed">
                The calculated target ({calculatedDailyTarget} kcal) is below the minimum clinical safe floor ({minFloor} kcal/day). We strongly advise extending your timeline to safeguard your hormone and organ health.
              </p>
            </div>
          </div>
        )}

        {/* Live Calculation Output Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated TDEE</span>
              <span className="text-xl font-bold text-slate-200 font-mono mt-0.5 block">{tdee} kcal</span>
              <span className="text-[10px] text-slate-500">Maintenance baseline</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Required Weekly Rate</span>
              <span className="text-xl font-bold text-slate-200 font-mono mt-0.5 block">
                {weeklyRateKg} kg / week
              </span>
              <span className="text-[10px] text-slate-500">{diffKg} kg total shift</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Daily {isLoss ? 'Deficit' : isGain ? 'Surplus' : 'Adjustment'}
              </span>
              <span
                className={`text-xl font-bold font-mono mt-0.5 block ${
                  isLoss ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isLoss ? `-${dailyCaloriesDiff}` : `+${dailyCaloriesDiff}`} kcal/day
              </span>
              <span className="text-[10px] text-slate-500">From maintenance</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                Recommended Daily Calorie Target:
              </span>
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {Math.max(minFloor, calculatedDailyTarget)}{' '}
                <span className="text-sm font-normal text-slate-400">kcal / day</span>
              </span>
            </div>

            <button
              onClick={handleApplyToProfile}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              {appliedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Goal Applied Successfully!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Apply this Goal to my Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nutritional Guidance Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sustainable Weight Management Principles</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px] leading-relaxed">
            <li>A 500 kcal/day deficit yields approximately 0.45 - 0.5 kg of pure fat loss per week without sacrificing muscle.</li>
            <li>Maintain daily protein at 1.8–2.0g per kg of body weight during calorie restriction to preserve lean mass.</li>
            <li>Exercise burns extra energy, but do not eat back all exercise calories to preserve a stable deficit.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
