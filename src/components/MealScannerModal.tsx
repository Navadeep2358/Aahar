import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { MealType, LoggedMealItem } from '../types/nutrition';
import {
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  Check,
  X,
  Loader2,
  Trash2,
  ShieldCheck,
  Edit2,
} from 'lucide-react';

interface MealScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMealType?: MealType;
}

interface DetectedItem {
  id: string;
  name: string;
  portion: string;
  servingWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  cookingMethod: string;
  confidence: 'high' | 'medium' | 'low';
}

const SAMPLE_PRESET_MEALS = [
  {
    title: 'South Indian Thali',
    desc: 'Rice, Sambar, Rasam, Sabzi, Curd',
    notes: 'South Indian lunch thali with boiled rice, sambar, and vegetables',
    previewUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&auto=format&fit=crop&q=80',
  },
  {
    title: 'Chicken Biryani & Raita',
    desc: 'Basmati rice, chicken pieces, curd raita',
    notes: 'Chicken biryani with raita and boiled egg',
    previewUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
  },
  {
    title: 'Idli, Vada & Sambar',
    desc: 'Steamed idlis, medu vada, coconut chutney',
    notes: 'South Indian breakfast with idli, vada, sambar, and chutney',
    previewUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
  },
  {
    title: 'Phulka, Dal & Paneer',
    desc: '2 rotis, yellow dal tadka, paneer sabzi',
    notes: 'North Indian dinner with phulka, dal tadka, and paneer bhurji',
    previewUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=80',
  },
];

export const MealScannerModal: React.FC<MealScannerModalProps> = ({
  isOpen,
  onClose,
  initialMealType = 'lunch',
}) => {
  const { addMealItem } = useNutrition();

  const [selectedMealSlot, setSelectedMealSlot] = useState<MealType>(initialMealType);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis result
  const [detectedMealName, setDetectedMealName] = useState<string>('');
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number>(85);
  const [confidenceLabel, setConfidenceLabel] = useState<string>('High');
  const [disclaimer, setDisclaimer] = useState<string>('');

  if (!isOpen) return null;

  const handleImageFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_PRESET_MEALS[0]) => {
    setImagePreview(sample.previewUrl);
    setUserNotes(sample.notes);
  };

  const runAnalysis = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: 'image/jpeg',
          userNotes,
          mealSlot: selectedMealSlot,
        }),
      });

      const data = await response.json();
      if (data && data.success && data.analysis) {
        const a = data.analysis;
        setDetectedMealName(a.mealName || 'Detected Meal');
        setConfidenceScore(a.confidenceScore || 80);
        setConfidenceLabel(a.confidenceLabel || 'High');
        setDisclaimer(
          a.disclaimer ||
            'Estimated nutrition. Food image recognition is inherently approximate. Please adjust portions and cooking methods before confirming.'
        );

        const items: DetectedItem[] = (a.items || []).map((it: any, idx: number) => ({
          id: `det_${Date.now()}_${idx}`,
          name: it.name || 'Food item',
          portion: it.portion || '1 serving',
          servingWeightGrams: it.servingWeightGrams || 100,
          calories: Math.round(it.calories || 150),
          protein: Number((it.protein || 5).toFixed(1)),
          carbs: Number((it.carbs || 20).toFixed(1)),
          fat: Number((it.fat || 5).toFixed(1)),
          fiber: Number((it.fiber || 2).toFixed(1)),
          cookingMethod: it.cookingMethod || 'Standard',
          confidence: it.confidence || 'high',
        }));

        setDetectedItems(items);
      } else {
        throw new Error(data.error || 'Failed to analyze meal image');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not analyze the photo. Please check your connection or adjust user notes.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Allow user to edit quantity / remove an item before confirmation
  const handleRemoveItem = (id: string) => {
    setDetectedItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItemGrams = (id: string, multiplier: number) => {
    setDetectedItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newWeight = Math.round(it.servingWeightGrams * multiplier);
        return {
          ...it,
          servingWeightGrams: newWeight,
          calories: Math.round(it.calories * multiplier),
          protein: Number((it.protein * multiplier).toFixed(1)),
          carbs: Number((it.carbs * multiplier).toFixed(1)),
          fat: Number((it.fat * multiplier).toFixed(1)),
          fiber: Number((it.fiber * multiplier).toFixed(1)),
          portion: `${newWeight}g`,
        };
      })
    );
  };

  const handleConfirmAndAddAll = () => {
    detectedItems.forEach((item) => {
      const logged: LoggedMealItem = {
        id: `img_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        foodId: 'ai_detected',
        name: item.name,
        category: 'custom',
        quantity: 1,
        selectedPortion: {
          label: item.portion,
          grams: item.servingWeightGrams,
          isHousehold: true,
        },
        totalGrams: item.servingWeightGrams,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        state: 'cooked',
        cookingMethod: item.cookingMethod,
        confidenceIndicator: 'estimated',
        loggedAt: new Date().toISOString(),
      };
      addMealItem(selectedMealSlot, logged);
    });

    onClose();
  };

  const totalCals = detectedItems.reduce((sum, it) => sum + it.calories, 0);
  const totalProtein = detectedItems.reduce((sum, it) => sum + it.protein, 0);
  const totalCarbs = detectedItems.reduce((sum, it) => sum + it.carbs, 0);
  const totalFat = detectedItems.reduce((sum, it) => sum + it.fat, 0);
  const totalFiber = detectedItems.reduce((sum, it) => sum + it.fiber, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">AI Meal Photo Scanner</h2>
              <p className="text-xs text-emerald-100">
                Visual breakdown of Indian meals, portions & estimated nutrition
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

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {detectedItems.length === 0 ? (
            /* STEP 1: UPLOAD OR SELECT SAMPLE */
            <div className="space-y-4">
              {/* Target Meal Slot */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Add to meal slot:</span>
                <select
                  value={selectedMealSlot}
                  onChange={(e) => setSelectedMealSlot(e.target.value as MealType)}
                  className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="morning_snack">Morning Snack</option>
                  <option value="lunch">Lunch</option>
                  <option value="evening_snack">Evening Snack</option>
                  <option value="dinner">Dinner</option>
                  <option value="late_night">Late-Night</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center hover:border-emerald-500 transition group cursor-pointer bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Meal Preview"
                      className="max-h-48 mx-auto rounded-2xl object-cover shadow-sm border border-slate-200"
                    />
                    <p className="text-xs text-slate-500 font-medium">Click or tap to replace photo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-105 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Snap a photo or upload meal image
                    </p>
                    <p className="text-xs text-slate-400">
                      PNG, JPG, HEIC up to 15MB • Captures plate, katoris & thalis
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Preset Samples for 1-click test */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Or select a sample Indian meal photo:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_PRESET_MEALS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleSelectSample(preset)}
                      className="p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 text-left transition bg-white hover:bg-emerald-50/40"
                    >
                      <img
                        src={preset.previewUrl}
                        alt={preset.title}
                        className="w-full h-16 object-cover rounded-xl mb-1.5"
                      />
                      <p className="text-xs font-bold text-slate-800 truncate">{preset.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional user notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional notes (e.g. "Low oil, homemade", "2 rotis underneath"):
                </label>
                <input
                  type="text"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Tell AI about hidden ingredients or cooking style..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={runAnalysis}
                disabled={!imagePreview || isAnalyzing}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing meal ingredients & portions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Meal Photo
                  </>
                )}
              </button>
            </div>
          ) : (
            /* STEP 2: REVIEW & CONFIRM DETECTED ITEMS (Section 4A) */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{detectedMealName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Confidence: {confidenceScore}% ({confidenceLabel})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Estimated Nutrition
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDetectedItems([]);
                    setImagePreview(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 underline"
                >
                  Scan Another
                </button>
              </div>

              {/* Mandatory Section 4A Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Estimated nutrition:</strong> Food image calorie estimation is inherently approximate. Please review each item, portion size, and cooking method below before confirming.
                </p>
              </div>

              {/* Items Breakdown list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {detectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {item.cookingMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.portion} • P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm font-mono">
                          {item.calories}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">kcal</span>
                      </div>

                      {/* Portion adjuster multipliers */}
                      <div className="flex rounded-lg bg-white border border-slate-200 p-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemGrams(item.id, 0.75)}
                          title="Reduce portion -25%"
                          className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-slate-600"
                        >
                          -25%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemGrams(item.id, 1.25)}
                          title="Increase portion +25%"
                          className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-slate-600 font-bold"
                        >
                          +25%
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Meal Nutrition Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Total Estimated Meal Calories:</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {totalCals} <span className="text-xs font-normal text-slate-400">kcal</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Protein</span>
                    <span className="font-bold text-blue-400">{totalProtein.toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Carbs</span>
                    <span className="font-bold text-amber-400">{totalCarbs.toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fat</span>
                    <span className="font-bold text-rose-400">{totalFat.toFixed(1)}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fiber</span>
                    <span className="font-bold text-emerald-400">{totalFiber.toFixed(1)}g</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDetectedItems([])}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndAddAll}
                  className="w-2/3 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm & Add to {selectedMealSlot.replace('_', ' ')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
