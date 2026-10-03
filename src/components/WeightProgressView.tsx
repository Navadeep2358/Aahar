import React, { useState, useMemo } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { WeightEntry } from '../types/nutrition';
import {
  Scale,
  Plus,
  TrendingDown,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Sparkles,
  Trash2,
  Info,
} from 'lucide-react';

interface WeightProgressViewProps {
  onOpenLogWeight: () => void;
}

export const WeightProgressView: React.FC<WeightProgressViewProps> = ({
  onOpenLogWeight,
}) => {
  const { userProfile, weightHistory } = useNutrition();

  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Sorted entries ascending
  const sortedEntries = useMemo(() => {
    return [...weightHistory].sort((a, b) => a.date.localeCompare(b.date));
  }, [weightHistory]);

  const startingEntry = sortedEntries[0] || { weightKg: userProfile.currentWeightKg, date: 'Start' };
  const latestEntry = sortedEntries[sortedEntries.length - 1] || { weightKg: userProfile.currentWeightKg, date: 'Now' };

  const startingWeight = startingEntry.weightKg;
  const currentWeight = latestEntry.weightKg;
  const targetWeight = userProfile.targetWeightKg;

  const isLossGoal = userProfile.goalType === 'lose';
  const totalChange = Number((currentWeight - startingWeight).toFixed(1));
  const remainingWeight = Number(Math.abs(currentWeight - targetWeight).toFixed(1));

  // Goal Progress Percentage
  const totalTargetDiff = Math.abs(startingWeight - targetWeight);
  const achievedDiff = Math.abs(startingWeight - currentWeight);
  const percentToGoal = totalTargetDiff > 0 ? Math.min(100, Math.max(0, Math.round((achievedDiff / totalTargetDiff) * 100))) : 100;

  // Average weekly change (based on entries in span)
  const averageWeeklyChange = useMemo(() => {
    if (sortedEntries.length < 2) return 0;
    const first = sortedEntries[0];
    const last = sortedEntries[sortedEntries.length - 1];
    const diffDays = Math.max(1, Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)));
    const diffKg = last.weightKg - first.weightKg;
    const ratePerWeek = (diffKg / diffDays) * 7;
    return Number(ratePerWeek.toFixed(2));
  }, [sortedEntries]);

  // Filtered entries for graph
  const filteredEntries = useMemo(() => {
    if (sortedEntries.length === 0) return [];
    if (timeFilter === 'all') return sortedEntries;

    const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const res = sortedEntries.filter((w) => w.date >= cutoffStr);
    return res.length > 0 ? res : sortedEntries.slice(-7);
  }, [sortedEntries, timeFilter]);

  // Render SVG interactive line chart
  const renderChart = () => {
    if (filteredEntries.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          No weight entries recorded yet. Tap "+ Log Today's Weight" above.
        </div>
      );
    }

    const weights = filteredEntries.map((w) => w.weightKg);
    const minW = Math.floor(Math.min(...weights, targetWeight) - 1);
    const maxW = Math.ceil(Math.max(...weights, startingWeight) + 1);
    const range = Math.max(1, maxW - minW);

    const svgWidth = 600;
    const svgHeight = 220;
    const padding = 40;

    const getX = (idx: number) => {
      if (filteredEntries.length === 1) return svgWidth / 2;
      return padding + (idx / (filteredEntries.length - 1)) * (svgWidth - 2 * padding);
    };

    const getY = (w: number) => {
      const normalized = (w - minW) / range;
      return svgHeight - padding - normalized * (svgHeight - 2 * padding);
    };

    const points = filteredEntries.map((entry, idx) => `${getX(idx)},${getY(entry.weightKg)}`).join(' ');

    // 7-day moving average points for smoothing (Section 13)
    const movingAvgPoints = filteredEntries.map((entry, idx) => {
      const windowStart = Math.max(0, idx - 3);
      const windowEnd = Math.min(filteredEntries.length - 1, idx + 3);
      const sub = filteredEntries.slice(windowStart, windowEnd + 1);
      const avg = sub.reduce((acc, it) => acc + it.weightKg, 0) / sub.length;
      return `${getX(idx)},${getY(avg)}`;
    }).join(' ');

    const targetY = getY(targetWeight);

    return (
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 text-slate-400 overflow-visible"
        >
          {/* Grid lines */}
          {[minW, Math.round((minW + maxW) / 2), maxW].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding}
                  y1={y}
                  x2={svgWidth - padding}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {val} kg
                </text>
              </g>
            );
          })}

          {/* Target Weight dashed line */}
          <line
            x1={padding}
            y1={targetY}
            x2={svgWidth - padding}
            y2={targetY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <text
            x={svgWidth - padding + 5}
            y={targetY + 3}
            className="text-[10px] fill-emerald-600 font-bold"
          >
            Goal ({targetWeight}kg)
          </text>

          {/* Smooth Moving Average Line */}
          <polyline
            fill="none"
            stroke="#93c5fd"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={movingAvgPoints}
          />

          {/* Daily Actual Points Polyline */}
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            strokeDasharray="2 2"
            points={points}
          />

          {/* Data Points */}
          {filteredEntries.map((entry, idx) => {
            const cx = getX(idx);
            const cy = getY(entry.weightKg);
            return (
              <g key={entry.id || idx} className="group cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  className="fill-blue-600 stroke-white stroke-2 group-hover:r-6 transition-all"
                />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-800 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {entry.weightKg} kg
                </text>
                <text
                  x={cx}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400"
                >
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-blue-300 rounded-full" />
            <span>7-Day Smoothed Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-blue-600" />
            <span>Daily Log Points</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-emerald-500" />
            <span>Target Goal Line</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" />
            Weight Progress & Body Trends
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Focus on weekly smoothed averages to disregard natural daily fluid fluctuations.
          </p>
        </div>

        <button
          onClick={onOpenLogWeight}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Weight Entry
        </button>
      </div>

      {/* METRIC CARDS ROW (Section 13) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Starting Weight */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting Weight</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-800 font-mono">{startingWeight}</span>
            <span className="text-xs text-slate-400">kg</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Day 1 baseline</span>
        </div>

        {/* Current Weight */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-600 block">Current Weight</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-blue-700 font-mono">{currentWeight}</span>
            <span className="text-xs text-blue-500">kg</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Latest log</span>
        </div>

        {/* Target Weight */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Target Goal</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-emerald-700 font-mono">{targetWeight}</span>
            <span className="text-xs text-emerald-500">kg</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            {remainingWeight} kg remaining
          </span>
        </div>

        {/* Average Weekly Rate */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Weekly Rate</span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-xl font-black font-mono ${
                isLossGoal && averageWeeklyChange < 0
                  ? 'text-emerald-600'
                  : !isLossGoal && averageWeeklyChange > 0
                  ? 'text-emerald-600'
                  : 'text-slate-800'
              }`}
            >
              {averageWeeklyChange > 0 ? `+${averageWeeklyChange}` : averageWeeklyChange}
            </span>
            <span className="text-xs text-slate-400">kg/wk</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Moving trend</span>
        </div>
      </div>

      {/* GOAL PROGRESS BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800">
            Progress Toward Goal ({percentToGoal}% Achieved)
          </span>
          <span className="text-slate-500 font-mono font-bold">
            {achievedDiff.toFixed(1)} kg shifted of {totalTargetDiff.toFixed(1)} kg goal
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${percentToGoal}%` }}
          />
        </div>
      </div>

      {/* INTERACTIVE WEIGHT CHART */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Weight Trajectory Over Time
          </h2>

          {/* Timeframe Filter Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '3 Months' },
              { id: 'all', label: 'All-Time' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id as any)}
                className={`px-3 py-1 rounded-lg transition ${
                  timeFilter === f.id ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {renderChart()}
      </div>

      {/* WEIGHT HISTORY LOG TABLE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Recorded Weight Entries ({sortedEntries.length})
        </h2>

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {[...sortedEntries].reverse().map((entry) => (
            <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-bold text-slate-800">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {entry.notes && <p className="text-[11px] text-slate-400">{entry.notes}</p>}
                </div>
              </div>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {entry.weightKg} kg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
