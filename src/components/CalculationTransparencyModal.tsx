import React from 'react';
import { useNutrition } from '../context/NutritionContext';
import { X, HelpCircle, Calculator, Info, ShieldCheck, Flame, Scale, Activity } from 'lucide-react';

interface CalculationTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculationTransparencyModal: React.FC<CalculationTransparencyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile, caloriePlan } = useNutrition();

  if (!isOpen) return null;

  const { bmr, activityMultiplier, tdee, dailyCalorieTarget, dailyCalorieDeficitOrSurplus, macroTargets, transparency, safetyFlags } = caloriePlan;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">How was this calculated?</h2>
              <p className="text-xs text-slate-400">
                100% transparent breakdown of clinical formulas and data sources
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: BMR */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                Step 1: Basal Metabolic Rate (BMR)
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">{bmr} kcal/day</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We use the gold-standard <strong>Mifflin-St Jeor formula</strong>, validated across clinical nutritional research to predict 24-hour basal metabolic energy expenditure.
            </p>
            <div className="bg-white rounded-xl p-3 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
              {transparency.bmrFormula}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Inputs: Weight ({userProfile.currentWeightKg} kg), Height ({userProfile.heightCm} cm), Age ({userProfile.age} yrs), Sex ({userProfile.gender}).</span>
            </div>
          </div>

          {/* Step 2: Activity Adjustment & TDEE */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2.5 py-1 rounded-lg">
                Step 2: Maintenance Calories (TDEE)
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">{tdee} kcal/day</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Total Daily Energy Expenditure (TDEE) accounts for the thermic effect of food and daily physical movement (NEAT + intentional exercise).
            </p>
            <div className="bg-white rounded-xl p-3 border border-slate-200 font-mono text-xs text-slate-800">
              TDEE = BMR ({bmr}) × Activity Multiplier ({activityMultiplier}) = <strong>{tdee} kcal</strong>
            </div>
            <p className="text-[11px] text-slate-500">
              {transparency.activityExplanation}
            </p>
          </div>

          {/* Step 3: Goal Adjustment */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                Step 3: Goal Calorie Target
              </span>
              <span className="font-mono font-bold text-slate-900 text-base text-emerald-600">
                {dailyCalorieTarget} kcal/day
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              1 kilogram of human body fat stores approximately <strong>7,700 kcal</strong> of metabolic energy.
            </p>
            <div className="bg-white rounded-xl p-3 border border-slate-200 font-mono text-xs text-slate-800">
              Daily Target = TDEE ({tdee}) {dailyCalorieDeficitOrSurplus >= 0 ? '+' : '-'} {Math.abs(dailyCalorieDeficitOrSurplus)} kcal = <strong>{dailyCalorieTarget} kcal</strong>
            </div>
            <p className="text-[11px] text-slate-500">
              {transparency.goalAdjustmentExplanation}
            </p>

            {safetyFlags.warningMessage && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <span className="font-bold">Safety Guardrail Applied:</span> {safetyFlags.warningMessage}
              </div>
            )}
          </div>

          {/* Step 4: Macronutrient Breakdown */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">
                Step 4: Personalized Macro Allocation
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {transparency.macroExplanation}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-medium">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">Protein</span>
                <span className="text-base font-bold text-blue-600">{macroTargets.proteinG}g</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{macroTargets.proteinG * 4} kcal</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">Carbohydrates</span>
                <span className="text-base font-bold text-amber-600">{macroTargets.carbsG}g</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{macroTargets.carbsG * 4} kcal</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">Fat</span>
                <span className="text-base font-bold text-rose-600">{macroTargets.fatG}g</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{macroTargets.fatG * 9} kcal</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase">Dietary Fiber</span>
                <span className="text-base font-bold text-emerald-600">{macroTargets.fiberG}g</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">14g / 1000 kcal</span>
              </div>
            </div>
          </div>

          {/* Section 29 Requirement: Distinguish Calculated, Estimated, and User-Entered values */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-900 text-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Accuracy & Certainty Disclosure
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We never fabricate certainty. Nutrition science distinguishes three data types in our app:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">Calculated</span>
                <span className="text-slate-300">Formulas with direct mathematical derivation (e.g. BMR, portion multipliers, food weight conversions).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">Estimated</span>
                <span className="text-slate-300">Food photo analysis, homemade curries, restaurant gravies, and exercise calories (which depend on individual metabolism and cooking oil).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">User-Entered</span>
                <span className="text-slate-300">Direct inputs such as smart watch burn, custom packaged food nutrition label values, and manual overrides.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
