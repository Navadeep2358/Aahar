import React, { useState, useMemo } from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  FoodItem,
  MealType,
  LoggedMealItem,
  PortionOption,
  FoodCategory,
} from '../types/nutrition';
import {
  X,
  Search,
  Plus,
  Flame,
  Check,
  Sparkles,
  Layers,
  ChefHat,
  Droplet,
  Tag,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMealType?: MealType;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  initialMealType = 'lunch',
}) => {
  const { allFoods, addMealItem, saveCustomFood, toggleFavorite, favoriteFoodIds, lookupFoodNutrition } = useNutrition();

  const [activeTab, setActiveTab] = useState<'database' | 'packaged'>('database');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType);
  const [isLookingUpAI, setIsLookingUpAI] = useState<boolean>(false);
  const [aiLookupError, setAiLookupError] = useState<string | null>(null);

  // Selected food item for portion customizing
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<PortionOption | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customGrams, setCustomGrams] = useState<number>(100);
  const [isCustomGramMode, setIsCustomGramMode] = useState<boolean>(false);

  // Raw vs Cooked choice
  const [isRawState, setIsRawState] = useState<boolean>(false);

  // Cooking method
  const [selectedCookingMethod, setSelectedCookingMethod] = useState<string>('');

  // Added fat or sugar
  const [addedFatType, setAddedFatType] = useState<'none' | 'ghee' | 'oil' | 'butter' | 'sugar'>('none');
  const [addedFatTsp, setAddedFatTsp] = useState<number>(1);

  // Packaged food manual entry state
  const [packagedName, setPackagedName] = useState('');
  const [packagedBrand, setPackagedBrand] = useState('');
  const [packagedPortionLabel, setPackagedPortionLabel] = useState('1 packet (50g)');
  const [packagedCalories, setPackagedCalories] = useState<number>(250);
  const [packagedProtein, setPackagedProtein] = useState<number>(4);
  const [packagedCarbs, setPackagedCarbs] = useState<number>(30);
  const [packagedFat, setPackagedFat] = useState<number>(12);
  const [packagedFiber, setPackagedFiber] = useState<number>(2);

  // Filter foods
  const filteredFoods = useMemo(() => {
    let list = allFoods;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.regionalName && f.regionalName.toLowerCase().includes(q)) ||
          (f.notes && f.notes.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'favorites') {
        list = list.filter((f) => favoriteFoodIds.includes(f.id));
      } else {
        list = list.filter((f) => f.category === selectedCategory);
      }
    }

    if (selectedDiet !== 'all') {
      list = list.filter((f) => f.dietType === selectedDiet);
    }

    return list;
  }, [allFoods, searchQuery, selectedCategory, selectedDiet, favoriteFoodIds]);

  if (!isOpen) return null;

  // Select a food to configure portion
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    const defaultOption = food.portionOptions[0] || {
      label: food.defaultPortionLabel,
      grams: food.defaultGrams,
      isHousehold: true,
    };
    setSelectedPortion(defaultOption);
    setQuantity(1);
    setCustomGrams(food.defaultGrams);
    setIsCustomGramMode(false);
    setIsRawState(food.isRaw || false);
    setSelectedCookingMethod(food.cookingMethodsAllowed ? food.cookingMethodsAllowed[0] : 'Standard');
    setAddedFatType('none');
    setAddedFatTsp(1);
  };

  // Instant AI Nutrition Lookup for unlisted items (ABC juice, smoothies, veggies, dishes)
  const handleAILookup = async (queryToLookup?: string) => {
    const q = (queryToLookup || searchQuery).trim();
    if (!q) return;
    setIsLookingUpAI(true);
    setAiLookupError(null);
    try {
      const item = await lookupFoodNutrition(q);
      if (item) {
        saveCustomFood(item);
        handleSelectFood(item);
      } else {
        setAiLookupError(`Could not analyze "${q}". Try switching to the packaged food tab or refine the query.`);
      }
    } catch {
      setAiLookupError('Failed to complete AI nutrition lookup. Please check connection and try again.');
    } finally {
      setIsLookingUpAI(false);
    }
  };

  // Compute calculated nutrition for current configuration
  const currentItemNutrition = () => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, grams: 0 };

    let effectiveGrams = isCustomGramMode
      ? customGrams * quantity
      : (selectedPortion ? selectedPortion.grams : selectedFood.defaultGrams) * quantity;

    let calRatio = effectiveGrams / 100;

    let calories = selectedFood.caloriesPer100g * calRatio;
    let protein = selectedFood.proteinPer100g * calRatio;
    let carbs = selectedFood.carbsPer100g * calRatio;
    let fat = selectedFood.fatPer100g * calRatio;
    let fiber = selectedFood.fiberPer100g * calRatio;

    // Cooking method modifiers
    if (selectedCookingMethod.includes('Deep fried')) {
      calories += 80 * quantity;
      fat += 9 * quantity;
    } else if (selectedCookingMethod.includes('Butter') || selectedCookingMethod.includes('Ghee roast')) {
      calories += 60 * quantity;
      fat += 6 * quantity;
    }

    // Separate added oil / butter / ghee / sugar
    let addedFatCalories = 0;
    if (addedFatType !== 'none') {
      if (addedFatType === 'oil') {
        addedFatCalories = addedFatTsp * 40;
        fat += addedFatTsp * 4.5;
      } else if (addedFatType === 'ghee') {
        addedFatCalories = addedFatTsp * 45;
        fat += addedFatTsp * 5;
      } else if (addedFatType === 'butter') {
        addedFatCalories = addedFatTsp * 36;
        fat += addedFatTsp * 4;
      } else if (addedFatType === 'sugar') {
        addedFatCalories = addedFatTsp * 16;
        carbs += addedFatTsp * 4;
      }
      calories += addedFatCalories;
    }

    return {
      calories: Math.round(calories),
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fat: Number(fat.toFixed(1)),
      fiber: Number(fiber.toFixed(1)),
      grams: Math.round(effectiveGrams),
    };
  };

  const handleAddConfiguredFood = () => {
    if (!selectedFood) return;

    const nutrition = currentItemNutrition();
    const portionName = isCustomGramMode
      ? `${nutrition.grams}g custom weight`
      : `${quantity > 1 ? `${quantity} × ` : ''}${selectedPortion?.label || selectedFood.defaultPortionLabel}`;

    const loggedItem: LoggedMealItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      foodId: selectedFood.id,
      name: selectedFood.name,
      category: selectedFood.category,
      quantity,
      selectedPortion: selectedPortion || {
        label: portionName,
        grams: nutrition.grams,
        isHousehold: false,
      },
      totalGrams: nutrition.grams,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      state: isRawState ? 'raw' : 'cooked',
      cookingMethod: selectedCookingMethod || undefined,
      addedFat:
        addedFatType !== 'none'
          ? {
              type: addedFatType,
              tsp: addedFatTsp,
              calories:
                addedFatType === 'ghee'
                  ? addedFatTsp * 45
                  : addedFatType === 'oil'
                  ? addedFatTsp * 40
                  : addedFatType === 'butter'
                  ? addedFatTsp * 36
                  : addedFatTsp * 16,
              fatG: addedFatType === 'sugar' ? 0 : addedFatTsp * 4.5,
              carbsG: addedFatType === 'sugar' ? addedFatTsp * 4 : 0,
            }
          : undefined,
      confidenceIndicator: selectedFood.confidence === 'user_entered' ? 'user_entered' : 'calculated',
      loggedAt: new Date().toISOString(),
    };

    addMealItem(selectedMealType, loggedItem);
    setSelectedFood(null);
    onClose();
  };

  const handleAddPackagedFood = () => {
    if (!packagedName.trim()) return;

    const customId = `pkg_${Date.now()}`;
    const newFood: FoodItem = {
      id: customId,
      name: packagedBrand ? `${packagedName.trim()} (${packagedBrand.trim()})` : packagedName.trim(),
      category: 'custom',
      dietType: 'veg',
      defaultPortionLabel: packagedPortionLabel || '1 serving',
      defaultGrams: 100,
      caloriesPer100g: Number(packagedCalories) || 200,
      proteinPer100g: Number(packagedProtein) || 0,
      carbsPer100g: Number(packagedCarbs) || 0,
      fatPer100g: Number(packagedFat) || 0,
      fiberPer100g: Number(packagedFiber) || 0,
      portionOptions: [
        { label: packagedPortionLabel || '1 serving', grams: 100, isHousehold: true },
        { label: '1/2 serving', grams: 50, isHousehold: true },
        { label: '100g', grams: 100, isHousehold: false },
      ],
      confidence: 'user_entered',
      notes: 'Logged from packaged food nutrition facts label',
    };

    saveCustomFood(newFood);

    const loggedItem: LoggedMealItem = {
      id: `item_${Date.now()}`,
      foodId: customId,
      name: newFood.name,
      category: 'custom',
      quantity: 1,
      selectedPortion: { label: packagedPortionLabel, grams: 100, isHousehold: true },
      totalGrams: 100,
      calories: Number(packagedCalories) || 0,
      protein: Number(packagedProtein) || 0,
      carbs: Number(packagedCarbs) || 0,
      fat: Number(packagedFat) || 0,
      fiber: Number(packagedFiber) || 0,
      state: 'generic',
      confidenceIndicator: 'user_entered',
      loggedAt: new Date().toISOString(),
    };

    addMealItem(selectedMealType, loggedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Food to Meal</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">Target slot:</span>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 focus:outline-none"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="morning_snack">Morning Snack</option>
                  <option value="lunch">Lunch</option>
                  <option value="evening_snack">Evening Snack</option>
                  <option value="dinner">Dinner</option>
                  <option value="late_night">Late-Night Snack</option>
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedFood) {
                setSelectedFood(null);
              } else {
                onClose();
              }
            }}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Database search vs Packaged food */}
        {!selectedFood && (
          <div className="flex border-b border-slate-100 bg-white px-5 pt-2 shrink-0">
            <button
              onClick={() => setActiveTab('database')}
              className={`pb-2.5 text-xs font-bold px-3 border-b-2 transition ${
                activeTab === 'database'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Indian Food Database
            </button>
            <button
              onClick={() => setActiveTab('packaged')}
              className={`pb-2.5 text-xs font-bold px-3 border-b-2 transition ${
                activeTab === 'packaged'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Packaged Food / Nutrition Label Entry
            </button>
          </div>
        )}

        {/* PORTION & PREPARATION CUSTOMIZER (Shown when a food is selected) */}
        {selectedFood ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedFood.category.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedFood.name}</h3>
                {selectedFood.regionalName && (
                  <p className="text-xs text-slate-400">{selectedFood.regionalName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Change Food
              </button>
            </div>

            {/* RAW VS COOKED DISTINCTION (Section 5 & 6) */}
            {selectedFood.hasRawCookedPair && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Important: Raw vs Cooked Distinction</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Raw rice/grains absorb ~2.5x to 2.8x their weight in water during cooking. 100g of raw rice contains ~360 kcal, while 100g of cooked rice contains ~130 kcal.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRawState(false)}
                    className={`flex-1 py-1.5 rounded-xl font-semibold transition ${
                      !isRawState
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Cooked Rice / Grains
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRawState(true)}
                    className={`flex-1 py-1.5 rounded-xl font-semibold transition ${
                      isRawState
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Raw Uncooked Weight
                  </button>
                </div>
              </div>
            )}

            {/* PORTION-SIZE SELECTOR (Section 5) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select Convenient Portion
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomGramMode(!isCustomGramMode)}
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  {isCustomGramMode ? 'Use Household Portions' : 'Enter Exact Grams (g/ml)'}
                </button>
              </div>

              {!isCustomGramMode ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedFood.portionOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => setSelectedPortion(opt)}
                      className={`p-2.5 text-xs text-left rounded-xl border transition ${
                        selectedPortion?.label === opt.label
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {Math.round((selectedFood.caloriesPer100g * opt.grams) / 100)} kcal
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={1500}
                    value={customGrams}
                    onChange={(e) => setCustomGrams(Math.max(1, parseInt(e.target.value, 10) || 100))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="absolute right-4 top-2.5 text-xs font-medium text-slate-400">
                    grams / ml
                  </span>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-600">Quantity Multiplier:</span>
                <div className="flex items-center gap-2">
                  {[0.5, 1, 1.5, 2, 3].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setQuantity(val)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        quantity === val
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {val}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COOKING METHOD VARIATION (Section 6) */}
            {selectedFood.cookingMethodsAllowed && selectedFood.cookingMethodsAllowed.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Cooking / Preparation Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedFood.cookingMethodsAllowed.map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setSelectedCookingMethod(method)}
                      className={`p-2 text-xs text-center rounded-xl border transition ${
                        selectedCookingMethod === method
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SEPARATE ADDITIONS: Oil, Ghee, Butter, Sugar (Section 6) */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-amber-500" />
                  Add Extra Oil / Ghee / Butter / Sugar
                </label>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'oil', label: 'Oil (+40k)' },
                  { id: 'ghee', label: 'Ghee (+45k)' },
                  { id: 'butter', label: 'Butter (+36k)' },
                  { id: 'sugar', label: 'Sugar (+16k)' },
                ].map((fat) => (
                  <button
                    type="button"
                    key={fat.id}
                    onClick={() => setAddedFatType(fat.id as any)}
                    className={`py-1.5 text-[11px] rounded-lg border font-medium transition text-center ${
                      addedFatType === fat.id
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {fat.label}
                  </button>
                ))}
              </div>
              {addedFatType !== 'none' && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Teaspoons (tsp):</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((tsp) => (
                      <button
                        type="button"
                        key={tsp}
                        onClick={() => setAddedFatTsp(tsp)}
                        className={`w-7 h-7 rounded-lg font-bold text-xs ${
                          addedFatTsp === tsp
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {tsp}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* LIVE NUTRITION PREVIEW FOR THIS ITEM */}
            {(() => {
              const nut = currentItemNutrition();
              return (
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Total Calculated Serving:</span>
                      <p className="text-sm font-bold text-slate-200">{nut.grams} grams</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-emerald-400">{nut.calories}</span>
                      <span className="text-xs text-slate-400 ml-1">kcal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Protein</span>
                      <span className="font-bold text-blue-400">{nut.protein}g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Carbs</span>
                      <span className="font-bold text-amber-400">{nut.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fat</span>
                      <span className="font-bold text-rose-400">{nut.fat}g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fiber</span>
                      <span className="font-bold text-emerald-400">{nut.fiber}g</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAddConfiguredFood}
                className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Add to {selectedMealType.replace('_', ' ')}
              </button>
            </div>
          </div>
        ) : activeTab === 'database' ? (
          /* DATABASE SEARCH VIEW */
          <div className="p-4 sm:p-5 flex flex-col flex-1 overflow-hidden space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    e.preventDefault();
                    if (filteredFoods.length === 0) {
                      handleAILookup();
                    }
                  }
                }}
                placeholder="Search ABC Juice, Carrot, Beetroot, Idli, Dal, Biryani, Roti..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1 py-1"
                  >
                    Clear
                  </button>
                )}
                {searchQuery.trim().length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleAILookup()}
                    disabled={isLookingUpAI}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                    title="Lookup precise nutrition with AI"
                  >
                    {isLookingUpAI ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    AI
                  </button>
                )}
              </div>
            </div>

            {/* AI Lookup Banner when user types */}
            {searchQuery.trim().length > 1 && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Looking for &ldquo;{searchQuery}&rdquo;?
                    </p>
                    <p className="text-[11px] text-emerald-700 truncate">
                      Instant biochemical nutrition analysis via AI
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAILookup()}
                  disabled={isLookingUpAI}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isLookingUpAI ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Analyze & Add
                    </>
                  )}
                </button>
              </div>
            )}

            {aiLookupError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiLookupError}</span>
              </div>
            )}

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0 no-scrollbar">
              {[
                { id: 'all', label: 'All Foods' },
                { id: 'favorites', label: '⭐ Favorites' },
                { id: 'drinks', label: '🧃 Juices & Drinks' },
                { id: 'fruits', label: '🥕 Veggies & Fruits' },
                { id: 'south_indian', label: 'South Indian' },
                { id: 'rice_staples', label: 'Rice & Roti' },
                { id: 'curries', label: 'Curries & Dals' },
                { id: 'snacks_breakfast', label: 'Snacks & Eggs' },
                { id: 'dairy', label: 'Dairy' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Diet Filter Pills */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
              <span className="font-semibold">Diet:</span>
              {['all', 'veg', 'non_veg', 'egg', 'vegan'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDiet(d)}
                  className={`px-2 py-0.5 rounded-md capitalize transition ${
                    selectedDiet === d
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Food List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1 space-y-1">
              {filteredFoods.length === 0 ? (
                <div className="p-6 text-center space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {searchQuery
                        ? `No exact match in local database for "${searchQuery}"`
                        : 'No foods match the selected filters'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Tap below to analyze this item with real-time AI nutrition, or enter custom label facts.'
                        : 'Try searching for ABC juice, carrot, beetroot, or change category filters.'}
                    </p>
                  </div>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAILookup()}
                      disabled={isLookingUpAI}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 transition disabled:opacity-50"
                    >
                      {isLookingUpAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Look Up &ldquo;{searchQuery}&rdquo; with Real-time AI
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                filteredFoods.map((food) => {
                  const isFav = favoriteFoodIds.includes(food.id);
                  const defaultCals = Math.round((food.caloriesPer100g * food.defaultGrams) / 100);

                  return (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            food.dietType === 'non_veg'
                              ? 'bg-rose-500'
                              : food.dietType === 'egg'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                            {food.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {food.defaultPortionLabel} • {food.proteinPer100g}g protein / 100g
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-800 font-mono">
                            {defaultCals}
                          </span>
                          <span className="text-[10px] text-slate-400 block">kcal</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(food.id);
                          }}
                          className={`p-1.5 rounded-lg text-xs ${
                            isFav ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
                          }`}
                        >
                          ★
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* PACKAGED FOOD / NUTRITION FACTS LABEL ENTRY TAB */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Packaged Food / Nutrition Label Entry
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Directly enter values printed on the nutrition facts panel of biscuits, chips, protein bars, or packaged items.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Item Name *
                </label>
                <input
                  type="text"
                  value={packagedName}
                  onChange={(e) => setPackagedName(e.target.value)}
                  placeholder="e.g. Marie Gold Biscuits"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={packagedBrand}
                  onChange={(e) => setPackagedBrand(e.target.value)}
                  placeholder="e.g. Britannia"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serving Size Description
              </label>
              <input
                type="text"
                value={packagedPortionLabel}
                onChange={(e) => setPackagedPortionLabel(e.target.value)}
                placeholder="e.g. 1 packet (50g) or 4 biscuits"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={packagedCalories}
                  onChange={(e) => setPackagedCalories(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Protein (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={packagedProtein}
                  onChange={(e) => setPackagedProtein(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-blue-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={packagedCarbs}
                  onChange={(e) => setPackagedCarbs(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-amber-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fat (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={packagedFat}
                  onChange={(e) => setPackagedFat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-rose-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fiber (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={packagedFiber}
                  onChange={(e) => setPackagedFiber(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-emerald-600"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPackagedFood}
              disabled={!packagedName.trim()}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save & Log to {selectedMealType.replace('_', ' ')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
