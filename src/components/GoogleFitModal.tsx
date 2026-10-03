import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  Activity,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Zap,
  Footprints,
  Flame,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface GoogleFitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleFitModal: React.FC<GoogleFitModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    connectGoogleFit,
    syncGoogleFit,
    disconnectGoogleFit,
    googleFitSyncData,
    isSyncingGoogleFit,
    selectedDate,
  } = useNutrition();

  const [customSteps, setCustomSteps] = useState<number>(8500);
  const [customMins, setCustomMins] = useState<number>(45);
  const [manualSyncOpen, setManualSyncOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = !!currentUser?.googleFitConnected;

  const handleConnect = async () => {
    const ok = await connectGoogleFit();
    if (ok) {
      setSuccessToast('Connected to Google Fit & synced today’s activity!');
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleSyncNow = async () => {
    const res = await syncGoogleFit(selectedDate);
    if (res) {
      setSuccessToast(`Synced ${res.steps.toLocaleString()} steps with AI analysis!`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-4">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Google Fit Integration</h2>
              <p className="text-xs text-blue-100">
                Sync live steps, active minutes & AI-calculated calorie burns
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

        <div className="p-5 sm:p-6 space-y-5">
          {successToast && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Connection Status Box */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isConnected ? 'Google Fit Connected' : 'Google Fit Not Linked'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isConnected
                    ? `Last synced: ${googleFitSyncData?.lastSyncTime || 'Just now'}`
                    : 'Link your Google Fit account to automatically pull today’s steps'}
                </p>
              </div>
            </div>

            {isConnected ? (
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncingGoogleFit}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogleFit ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
              >
                <span>Connect App</span>
              </button>
            )}
          </div>

          {/* LATEST SYNCED DATA CARD */}
          {googleFitSyncData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">Steps</span>
                  <span className="text-lg font-black text-blue-900 font-mono mt-0.5 block">
                    {googleFitSyncData.steps.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-blue-500">steps today</span>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">AI Net Burn</span>
                  <span className="text-lg font-black text-emerald-900 font-mono mt-0.5 block">
                    {googleFitSyncData.caloriesBurned}
                  </span>
                  <span className="text-[10px] text-emerald-600">kcal active</span>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
                  <span className="text-[10px] uppercase font-bold text-amber-600 block">Active Time</span>
                  <span className="text-lg font-black text-amber-900 font-mono mt-0.5 block">
                    {googleFitSyncData.activeMinutes}
                  </span>
                  <span className="text-[10px] text-amber-600">minutes</span>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                  <span className="text-[10px] uppercase font-bold text-purple-600 block">Distance</span>
                  <span className="text-lg font-black text-purple-900 font-mono mt-0.5 block">
                    {(googleFitSyncData.distanceMeters / 1000).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-purple-600">km traveled</span>
                </div>
              </div>

              {/* AI BIOMECHANICAL ANALYSIS BREAKDOWN */}
              {googleFitSyncData.aiAnalysis && (
                <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      AI Sports Science & Metabolic Analysis
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Step Cadence Intensity:</span>
                      <span className="font-semibold text-white">
                        {googleFitSyncData.aiAnalysis.stepCadenceIntensity}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Net Active Movement Calories:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {googleFitSyncData.aiAnalysis.estimatedNetCalories} kcal
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Gross Expenditure (with basal burn):</span>
                      <span className="font-mono font-bold text-slate-200">
                        {googleFitSyncData.aiAnalysis.estimatedGrossCalories} kcal
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-3 text-[11px] leading-relaxed text-slate-200 border border-white/10">
                    <p className="font-bold text-emerald-300 mb-0.5">Deficit Impact:</p>
                    <p>{googleFitSyncData.aiAnalysis.energyDeficitContribution}</p>
                    <p className="mt-1 text-slate-300 italic">{googleFitSyncData.aiAnalysis.coachingTip}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs space-y-2">
              <Footprints className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700">No Google Fit data synced for today yet.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Connect your account or use the direct sync button to calculate your daily steps and exercise burn.
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            {isConnected ? (
              <button
                type="button"
                onClick={disconnectGoogleFit}
                className="text-rose-600 hover:text-rose-700 font-semibold"
              >
                Disconnect Google Fit
              </button>
            ) : (
              <span className="text-slate-400 text-[11px]">OAuth Google Fitness REST API</span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
