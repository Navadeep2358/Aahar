import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { Scale, Check, X, Calendar, Sparkles } from 'lucide-react';
import { getTodayDateString } from '../utils/storage';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeightLogModal: React.FC<WeightLogModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, weightHistory, logWeight } = useNutrition();

  const [weightKg, setWeightKg] = useState<number>(userProfile.currentWeightKg || 75);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const displayWeight = unit === 'kg' ? weightKg : Number((weightKg * 2.20462).toFixed(1));

  // Find previous weight measurement for instant comparison
  const previousEntries = [...weightHistory]
    .filter((w) => w.date < date)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastEntry = previousEntries[0];
  const delta = lastEntry ? Number((weightKg - lastEntry.weightKg).toFixed(2)) : null;

  const handleSave = () => {
    logWeight(Number(weightKg.toFixed(1)), date, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Log Body Weight</h2>
              <p className="text-xs text-blue-100">Consistent weigh-ins under same morning conditions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Weight Measurement
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUnit('kg')}
                className={`px-2.5 py-1 rounded-md transition ${
                  unit === 'kg' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                kg
              </button>
              <button
                type="button"
                onClick={() => setUnit('lbs')}
                className={`px-2.5 py-1 rounded-md transition ${
                  unit === 'lbs' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              step="0.1"
              min={30}
              max={300}
              value={displayWeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 70;
                setWeightKg(unit === 'kg' ? val : Number((val * 0.453592).toFixed(1)));
              }}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
            <span className="absolute right-4 top-4 text-sm font-bold text-slate-400">
              {unit}
            </span>
          </div>

          {/* Delta comparison */}
          {delta !== null && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Compared to last measurement ({lastEntry.date}):</span>
              <span
                className={`font-bold font-mono ${
                  delta < 0 ? 'text-emerald-600' : delta > 0 ? 'text-amber-600' : 'text-slate-600'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} kg
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date of Measurement
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning fasting, post workout"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            💡 <strong>Tip:</strong> Daily water retention shifts weight by 0.5–1.5 kg based on sodium, glycogen, and hydration. We look at 7-day moving averages rather than single day numbers.
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Weight Entry
          </button>
        </div>
      </div>
    </div>
  );
};
