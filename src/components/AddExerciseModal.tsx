import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { LoggedExercise } from '../types/nutrition';
import {
  EXERCISE_MET_DATABASE,
  estimateExerciseCalories,
} from '../utils/nutritionCalculations';
import {
  Activity,
  Flame,
  Clock,
  Watch,
  Check,
  X,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile, addExercise } = useNutrition();

  const [mode, setMode] = useState<'calculate' | 'tracker'>('calculate');
  const [exerciseKey, setExerciseKey] = useState<string>('walking');
  const [durationMins, setDurationMins] = useState<number>(30);
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [notes, setNotes] = useState<string>('');

  // Manual tracker mode
  const [trackerExerciseName, setTrackerExerciseName] = useState<string>('Fitness Watch Workout');
  const [trackerCalories, setTrackerCalories] = useState<number>(250);
  const [trackerDurationMins, setTrackerDurationMins] = useState<number>(45);

  if (!isOpen) return null;

  const currentWeightKg = userProfile.currentWeightKg || 70;
  const { caloriesBurned, met } = estimateExerciseCalories(
    exerciseKey,
    durationMins,
    intensity,
    currentWeightKg
  );

  const handleSave = () => {
    if (mode === 'calculate') {
      const exercise: LoggedExercise = {
        id: `ex_${Date.now()}`,
        type: EXERCISE_MET_DATABASE[exerciseKey]?.name || 'Exercise',
        durationMins,
        intensity,
        metValue: met,
        caloriesBurned,
        isManualEntry: false,
        notes: notes.trim() || undefined,
        loggedAt: new Date().toISOString(),
      };
      addExercise(exercise);
    } else {
      const exercise: LoggedExercise = {
        id: `ex_tracker_${Date.now()}`,
        type: trackerExerciseName.trim() || 'Fitness Tracker Activity',
        durationMins: trackerDurationMins,
        intensity: 'moderate',
        metValue: 5.0,
        caloriesBurned: Math.max(1, Number(trackerCalories) || 0),
        isManualEntry: true,
        notes: 'Entered from wearable fitness device',
        loggedAt: new Date().toISOString(),
      };
      addExercise(exercise);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Log Exercise & Activity</h2>
              <p className="text-xs text-orange-100">
                MET-based scientific calorie expenditure calculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('calculate')}
            className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
              mode === 'calculate'
                ? 'bg-white shadow-xs text-orange-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Calculate with MET Formula
          </button>
          <button
            type="button"
            onClick={() => setMode('tracker')}
            className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
              mode === 'tracker'
                ? 'bg-white shadow-xs text-orange-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Watch className="w-3.5 h-3.5" />
            From Watch / Tracker
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {mode === 'calculate' ? (
            <>
              {/* Exercise Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Activity
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(EXERCISE_MET_DATABASE).map(([key, ex]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setExerciseKey(key)}
                      className={`p-2.5 rounded-xl border text-xs text-left font-medium transition ${
                        exerciseKey === key
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold ring-1 ring-orange-500'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block truncate">{ex.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{ex.category}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration and Intensity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={durationMins}
                    onChange={(e) => setDurationMins(Math.max(1, parseInt(e.target.value, 10) || 30))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                    Intensity Level
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['low', 'moderate', 'high'] as const).map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setIntensity(lvl)}
                        className={`py-2 text-[11px] font-bold capitalize rounded-xl border transition ${
                          intensity === lvl
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculated Result Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Estimated Calorie Expenditure:</span>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                    MET ({met}) × {currentWeightKg} kg × {(durationMins / 60).toFixed(2)} hrs
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-orange-400">{caloriesBurned}</span>
                  <span className="text-xs text-slate-400 ml-1">kcal</span>
                </div>
              </div>
            </>
          ) : (
            /* MANUAL TRACKER MODE */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={trackerExerciseName}
                  onChange={(e) => setTrackerExerciseName(e.target.value)}
                  placeholder="e.g. Apple Watch Outdoor Run"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calories Burned (kcal) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={3000}
                    value={trackerCalories}
                    onChange={(e) => setTrackerCalories(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-orange-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={trackerDurationMins}
                    onChange={(e) => setTrackerDurationMins(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mandatory Section 3 Educational Disclaimer */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Notice:</strong> Exercise calories are scientific estimates. They should not automatically be treated as permission to eat back every single calorie burned, as wearable devices can overestimate expenditure by 20–40%.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Log Activity
          </button>
        </div>
      </div>
    </div>
  );
};
