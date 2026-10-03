import React, { useState, useMemo } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { DayLog, MealType } from '../types/nutrition';
import {
  BarChart3,
  Calendar,
  Flame,
  Award,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { dayLogs, caloriePlan, userProfile, weightHistory } = useNutrition();

  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d' | '90d'>('7d');
  const [activeMetric, setActiveMetric] = useState<'calories' | 'deficit' | 'protein' | 'exercise'>('calories');

  const daysCount = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : timeframe === '30d' ? 30 : 90;

  // Build daily stats array for the chosen timeframe
  const dailyStats = useMemo(() => {
    const list: {
      date: string;
      label: string;
      calories: number;
      target: number;
      deficit: number;
      protein: number;
      proteinTarget: number;
      carbs: number;
      fat: number;
      fiber: number;
      water: number;
      exerciseCals: number;
      exerciseMins: number;
    }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const day = dayLogs[dateStr];

      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      let fiber = 0;
      let water = day ? day.waterMl || 0 : 0;
      let exerciseCals = 0;
      let exerciseMins = 0;

      if (day) {
        const mealTypes: MealType[] = [
          'breakfast',
          'morning_snack',
          'lunch',
          'evening_snack',
          'dinner',
          'late_night',
        ];
        mealTypes.forEach((m) => {
          (day.meals[m] || []).forEach((item) => {
            calories += item.calories;
            protein += item.protein;
            carbs += item.carbs;
            fat += item.fat;
            fiber += item.fiber;
          });
        });

        (day.exercises || []).forEach((ex) => {
          exerciseCals += ex.caloriesBurned;
          exerciseMins += ex.durationMins;
        });
      }

      const totalExpenditure = caloriePlan.tdee + exerciseCals;
      const deficit = calories > 0 ? calories - totalExpenditure : 0;

      list.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        calories: Math.round(calories),
        target: caloriePlan.dailyCalorieTarget,
        deficit: Math.round(deficit),
        protein: Number(protein.toFixed(1)),
        proteinTarget: caloriePlan.macroTargets.proteinG,
        carbs: Number(carbs.toFixed(1)),
        fat: Number(fat.toFixed(1)),
        fiber: Number(fiber.toFixed(1)),
        water,
        exerciseCals: Math.round(exerciseCals),
        exerciseMins,
      });
    }

    return list;
  }, [dayLogs, daysCount, caloriePlan]);

  // Weekly Report Averages
  const loggedDays = dailyStats.filter((d) => d.calories > 0);
  const count = Math.max(1, loggedDays.length);

  const avgCalories = Math.round(loggedDays.reduce((sum, d) => sum + d.calories, 0) / count);
  const avgTarget = caloriePlan.dailyCalorieTarget;
  const avgDeficit = Math.round(loggedDays.reduce((sum, d) => sum + d.deficit, 0) / count);
  const avgProtein = Number((loggedDays.reduce((sum, d) => sum + d.protein, 0) / count).toFixed(1));
  const avgCarbs = Number((loggedDays.reduce((sum, d) => sum + d.carbs, 0) / count).toFixed(1));
  const avgFat = Number((loggedDays.reduce((sum, d) => sum + d.fat, 0) / count).toFixed(1));
  const avgFiber = Number((loggedDays.reduce((sum, d) => sum + d.fiber, 0) / count).toFixed(1));
  const avgWater = Math.round(loggedDays.reduce((sum, d) => sum + d.water, 0) / count);

  const daysWithinTarget = loggedDays.filter(
    (d) => Math.abs(d.calories - d.target) <= d.target * 0.1
  ).length;
  const daysAboveTarget = loggedDays.filter((d) => d.calories > d.target * 1.1).length;
  const daysBelowTarget = loggedDays.filter((d) => d.calories < d.target * 0.9).length;

  const avgProteinCompletion = Math.min(
    150,
    Math.round((avgProtein / Math.max(1, caloriePlan.macroTargets.proteinG)) * 100)
  );

  // Personalized Insights Generator (Section 16)
  const insights = useMemo(() => {
    const list: { text: string; type: 'positive' | 'neutral' | 'suggestion' }[] = [];

    if (loggedDays.length < 3) {
      list.push({
        text: 'Keep logging meals consistently for 3 or more days to generate deeper behavioral trends.',
        type: 'neutral',
      });
      return list;
    }

    // Protein insight
    if (avgProteinCompletion >= 90) {
      list.push({
        text: `Outstanding protein consistency! You are hitting ${avgProteinCompletion}% of your daily protein goal on average, supporting muscle preservation.`,
        type: 'positive',
      });
    } else {
      list.push({
        text: `Your average protein intake (${avgProtein}g) was below your target of ${caloriePlan.macroTargets.proteinG}g. Consider adding boiled eggs, paneer, sprouts, or Greek yogurt to your breakfast or evening snack.`,
        type: 'suggestion',
      });
    }

    // Calorie consistency
    if (daysWithinTarget >= Math.round(count * 0.6)) {
      list.push({
        text: `Your calorie intake was relatively consistent this period (${daysWithinTarget} of ${count} days within 10% of target).`,
        type: 'positive',
      });
    } else if (daysAboveTarget >= Math.round(count * 0.4)) {
      list.push({
        text: `Calorie intake exceeded target on ${daysAboveTarget} days. Remember that weekly adherence is what drives progress—one high day can easily be balanced out across the week.`,
        type: 'neutral',
      });
    }

    // Fiber insight
    if (avgFiber < 22) {
      list.push({
        text: `Your fiber intake averaged ${avgFiber}g/day (recommended: ${caloriePlan.macroTargets.fiberG}g). Adding more vegetables like bhindi, guava, papaya, and whole pulses will promote satiety.`,
        type: 'suggestion',
      });
    } else {
      list.push({
        text: `Great dietary fiber intake (${avgFiber}g/day), aiding steady digestion and glycemic regulation.`,
        type: 'positive',
      });
    }

    // Deficit insight
    if (userProfile.goalType === 'lose') {
      if (Math.abs(avgDeficit) > 750) {
        list.push({
          text: `Your average deficit (${Math.abs(avgDeficit)} kcal/day) is larger than your planned deficit. Ensure you are eating enough to avoid fatigue.`,
          type: 'suggestion',
        });
      } else {
        list.push({
          text: `Your average energy deficit is moving in alignment with your planned fat-loss trajectory.`,
          type: 'positive',
        });
      }
    }

    return list;
  }, [
    loggedDays,
    avgProteinCompletion,
    avgProtein,
    caloriePlan,
    daysWithinTarget,
    count,
    daysAboveTarget,
    avgFiber,
    userProfile,
    avgDeficit,
  ]);

  // Render SVG Trend Chart
  const renderTrendChart = () => {
    const svgWidth = 600;
    const svgHeight = 220;
    const padding = 35;

    let values: number[] = [];
    let targetVal = 0;

    if (activeMetric === 'calories') {
      values = dailyStats.map((d) => d.calories);
      targetVal = caloriePlan.dailyCalorieTarget;
    } else if (activeMetric === 'protein') {
      values = dailyStats.map((d) => d.protein);
      targetVal = caloriePlan.macroTargets.proteinG;
    } else if (activeMetric === 'exercise') {
      values = dailyStats.map((d) => d.exerciseCals);
      targetVal = 250;
    } else {
      // Deficit
      values = dailyStats.map((d) => d.deficit);
      targetVal = caloriePlan.dailyCalorieDeficitOrSurplus;
    }

    const minV = Math.min(0, Math.min(...values, targetVal));
    const maxV = Math.max(10, Math.max(...values, targetVal) * 1.15);
    const range = Math.max(1, maxV - minV);

    const getX = (idx: number) => {
      return padding + (idx / Math.max(1, dailyStats.length - 1)) * (svgWidth - 2 * padding);
    };

    const getY = (val: number) => {
      const norm = (val - minV) / range;
      return svgHeight - padding - norm * (svgHeight - 2 * padding);
    };

    const targetY = getY(targetVal);

    return (
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 text-slate-400 overflow-visible"
        >
          {/* Target Reference Line */}
          <line
            x1={padding}
            y1={targetY}
            x2={svgWidth - padding}
            y2={targetY}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <text
            x={svgWidth - padding + 5}
            y={targetY + 4}
            className="text-[10px] fill-emerald-600 font-bold"
          >
            Target ({Math.round(targetVal)})
          </text>

          {/* Bars / Lines */}
          {dailyStats.map((day, idx) => {
            const x = getX(idx);
            const val =
              activeMetric === 'calories'
                ? day.calories
                : activeMetric === 'protein'
                ? day.protein
                : activeMetric === 'exercise'
                ? day.exerciseCals
                : day.deficit;

            const y = getY(val);
            const zeroY = getY(0);

            return (
              <g key={day.date} className="group cursor-pointer">
                {/* Bar */}
                <rect
                  x={x - 6}
                  y={Math.min(y, zeroY)}
                  width="12"
                  height={Math.max(2, Math.abs(y - zeroY))}
                  rx="4"
                  className={`${
                    activeMetric === 'calories'
                      ? day.calories > day.target * 1.1
                        ? 'fill-rose-400'
                        : 'fill-emerald-500'
                      : activeMetric === 'protein'
                      ? 'fill-blue-500'
                      : activeMetric === 'exercise'
                      ? 'fill-orange-500'
                      : val < 0
                      ? 'fill-teal-500'
                      : 'fill-rose-400'
                  } group-hover:opacity-80 transition`}
                />

                {/* Tooltip Hover Value */}
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-800 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {val}
                </text>

                {/* Date on X Axis (Show subset if dense) */}
                {(dailyStats.length <= 14 || idx % Math.ceil(dailyStats.length / 8) === 0) && (
                  <text
                    x={x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 font-mono"
                  >
                    {day.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Nutritional Analytics & Trend Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate long-term adherence, macro consistency, and energy deficit patterns.
          </p>
        </div>

        {/* Timeframe Switcher (Section 14) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Days' },
            { id: '14d', label: '14 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id as any)}
              className={`px-3 py-1.5 rounded-xl transition ${
                timeframe === t.id ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* INTERACTIVE TREND GRAPH (Section 14) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'calories', label: 'Daily Calories', icon: '🔥' },
            { id: 'deficit', label: 'Energy Deficit / Surplus', icon: '⚖️' },
            { id: 'protein', label: 'Protein Intake (g)', icon: '🥩' },
            { id: 'exercise', label: 'Exercise Calories Burned', icon: '🏃' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeMetric === m.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {renderTrendChart()}
      </div>

      {/* WEEKLY NUTRITION REPORT (Section 15) */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Periodic Nutrition Summary ({timeframe.toUpperCase()})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {count} logged day{count > 1 ? 's' : ''} evaluated
          </span>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Daily Intake</span>
            <span className="text-base font-black text-slate-800 font-mono mt-0.5 block">
              {avgCalories} <span className="text-[10px] font-normal text-slate-400">kcal</span>
            </span>
            <span className="text-[10px] text-slate-400">Target: {avgTarget} kcal</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Net Deficit</span>
            <span
              className={`text-base font-black font-mono mt-0.5 block ${
                avgDeficit < 0 ? 'text-emerald-600' : 'text-slate-800'
              }`}
            >
              {avgDeficit} <span className="text-[10px] font-normal text-slate-400">kcal/day</span>
            </span>
            <span className="text-[10px] text-slate-400">TDEE balance</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Protein</span>
            <span className="text-base font-black text-blue-600 font-mono mt-0.5 block">
              {avgProtein}g <span className="text-[10px] font-normal text-slate-400">/ {caloriePlan.macroTargets.proteinG}g</span>
            </span>
            <span className="text-[10px] text-slate-400">{avgProteinCompletion}% completion</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Hydration</span>
            <span className="text-base font-black text-cyan-600 font-mono mt-0.5 block">
              {avgWater} <span className="text-[10px] font-normal text-slate-400">ml</span>
            </span>
            <span className="text-[10px] text-slate-400">Target: {caloriePlan.macroTargets.waterMl} ml</span>
          </div>
        </div>

        {/* Days Distribution (Section 15) */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
            <span className="text-emerald-800 font-black text-lg block">{daysWithinTarget}</span>
            <span className="text-[10px] text-emerald-700 font-medium">Days Within Target (±10%)</span>
          </div>
          <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl">
            <span className="text-rose-800 font-black text-lg block">{daysAboveTarget}</span>
            <span className="text-[10px] text-rose-700 font-medium">Days Above Target</span>
          </div>
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
            <span className="text-blue-800 font-black text-lg block">{daysBelowTarget}</span>
            <span className="text-[10px] text-blue-700 font-medium">Days Below Target</span>
          </div>
        </div>
      </div>

      {/* PERSONALIZED OBSERVATIONS & INSIGHTS (Section 16) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-7 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            Personalized Behavioral Insights
          </h2>
        </div>

        <div className="space-y-2.5 text-xs">
          {insights.map((ins, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-start gap-2.5 leading-relaxed text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{ins.text}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 pt-1">
          * Observations are factual interpretations of your logged records and do not constitute clinical medical advice.
        </p>
      </div>
    </div>
  );
};
