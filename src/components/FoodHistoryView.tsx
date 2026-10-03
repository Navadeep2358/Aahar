import React, { useState, useMemo } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { MealType, LoggedMealItem } from '../types/nutrition';
import {
  History,
  Search,
  Calendar,
  RotateCcw,
  Star,
  Plus,
  Trash2,
  Sparkles,
  Filter,
} from 'lucide-react';
import { getTodayDateString } from '../utils/storage';

interface FoodHistoryViewProps {
  onOpenAddFood: (mealType?: MealType) => void;
}

export const FoodHistoryView: React.FC<FoodHistoryViewProps> = ({ onOpenAddFood }) => {
  const {
    dayLogs,
    addMealItem,
    toggleFavorite,
    favoriteFoodIds,
    repeatMeal,
  } = useNutrition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealSlot, setSelectedMealSlot] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Flatten all logged meals with their day and meal slot
  const allLoggedItems = useMemo(() => {
    const list: {
      date: string;
      mealType: MealType;
      item: LoggedMealItem;
    }[] = [];

    const dates = Object.keys(dayLogs).sort((a, b) => b.localeCompare(a));
    const mealKeys: MealType[] = [
      'breakfast',
      'morning_snack',
      'lunch',
      'evening_snack',
      'dinner',
      'late_night',
    ];

    dates.forEach((date) => {
      const day = dayLogs[date];
      if (!day) return;
      mealKeys.forEach((m) => {
        (day.meals[m] || []).forEach((item) => {
          list.push({ date, mealType: m, item });
        });
      });
    });

    return list;
  }, [dayLogs]);

  // Unique dates for dropdown
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(allLoggedItems.map((it) => it.date)));
  }, [allLoggedItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allLoggedItems.filter(({ date, mealType, item }) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!item.name.toLowerCase().includes(q)) return false;
      }
      if (selectedMealSlot !== 'all' && mealType !== selectedMealSlot) {
        return false;
      }
      if (selectedDateFilter !== 'all' && date !== selectedDateFilter) {
        return false;
      }
      return true;
    });
  }, [allLoggedItems, searchQuery, selectedMealSlot, selectedDateFilter]);

  // Frequently consumed foods (top 5)
  const frequentFoods = useMemo(() => {
    const counts: Record<string, { item: LoggedMealItem; count: number; mealType: MealType }> = {};
    allLoggedItems.forEach(({ item, mealType }) => {
      if (!counts[item.name]) {
        counts[item.name] = { item, count: 1, mealType };
      } else {
        counts[item.name].count += 1;
      }
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allLoggedItems]);

  const handleQuickReAdd = (item: LoggedMealItem, mealType: MealType) => {
    const today = getTodayDateString();
    const cloned: LoggedMealItem = {
      ...item,
      id: `quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      loggedAt: new Date().toISOString(),
    };
    addMealItem(mealType, cloned, today);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Food History & Favorites
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly browse previous foods, repeat meals from past dates, or manage favorite staples.
          </p>
        </div>

        <button
          onClick={() => onOpenAddFood()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Food to Today
        </button>
      </div>

      {/* FREQUENTLY CONSUMED FOODS (Section 18) */}
      {frequentFoods.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Frequently Consumed Foods — Quick 1-Tap Add to Today
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {frequentFoods.map(({ item, count, mealType }) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleQuickReAdd(item, mealType)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 rounded-2xl text-left transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded capitalize">
                    {mealType.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{count}× logged</span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-800">
                  {item.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {item.calories} kcal • {item.protein}g P
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous foods..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter by Meal Slot */}
          <div>
            <select
              value={selectedMealSlot}
              onChange={(e) => setSelectedMealSlot(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 capitalize"
            >
              <option value="all">All Meal Slots</option>
              <option value="breakfast">Breakfast</option>
              <option value="morning_snack">Morning Snack</option>
              <option value="lunch">Lunch</option>
              <option value="evening_snack">Evening Snack</option>
              <option value="dinner">Dinner</option>
              <option value="late_night">Late-Night Snack</option>
            </select>
          </div>

          {/* Filter by Date */}
          <div>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Dates</option>
              {uniqueDates.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FOOD LOGS TABLE */}
        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching logged foods found in history.
            </div>
          ) : (
            filteredItems.map(({ date, mealType, item }) => {
              const isFav = favoriteFoodIds.includes(item.foodId);

              return (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/70 rounded-xl px-2 transition group"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(item.foodId)}
                      className={`p-1 mt-0.5 rounded ${
                        isFav ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded capitalize font-medium">
                          {mealType.replace('_', ' ')}
                        </span>
                        {item.cookingMethod && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.cookingMethod}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.selectedPortion.label} • {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g | Fib: {item.fiber}g
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 font-mono text-sm">
                        {item.calories}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-0.5">kcal</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickReAdd(item, mealType)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-slate-700 text-xs transition flex items-center gap-1"
                      title="Log this item again today"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Today
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
