import React, { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { CustomRecipe, CustomRecipeIngredient, FoodItem, MealType } from '../types/nutrition';
import {
  ChefHat,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Utensils,
  Search,
  BookOpen,
  Info,
} from 'lucide-react';
import { getTodayDateString } from '../utils/storage';

interface RecipeBuilderViewProps {
  onOpenAddFood: (mealType?: MealType) => void;
}

export const RecipeBuilderView: React.FC<RecipeBuilderViewProps> = ({ onOpenAddFood }) => {
  const { allFoods, customRecipes, saveRecipe, deleteRecipe, addMealItem } = useNutrition();

  const [recipeName, setRecipeName] = useState('Homemade Paneer Bhurji');
  const [recipeDesc, setRecipeDesc] = useState('Scrambled paneer with onions, tomatoes, and light ghee');
  const [servings, setServings] = useState<number>(3);
  const [ingredients, setIngredients] = useState<CustomRecipeIngredient[]>([
    {
      foodId: 'dairy_paneer_raw',
      foodName: 'Raw Paneer',
      grams: 250,
      portionLabel: '250g slab',
      calories: 738,
      protein: 45.8,
      carbs: 8.5,
      fat: 57.5,
      fiber: 0,
    },
    {
      foodId: 'curry_vegetable',
      foodName: 'Chopped Onions & Tomatoes',
      grams: 150,
      portionLabel: '150g',
      calories: 60,
      protein: 2.0,
      carbs: 12.0,
      fat: 0.5,
      fiber: 3.5,
    },
    {
      foodId: 'fat_ghee',
      foodName: 'Desi Ghee',
      grams: 10,
      portionLabel: '2 tsp (10g)',
      calories: 90,
      protein: 0,
      carbs: 0,
      fat: 10,
      fiber: 0,
    },
  ]);

  // Ingredient search modal states
  const [isAddingIngredient, setIsAddingIngredient] = useState<boolean>(false);
  const [ingredientSearch, setIngredientSearch] = useState<string>('');
  const [ingredientGrams, setIngredientGrams] = useState<number>(100);

  // Totals
  const totalCalories = ingredients.reduce((sum, it) => sum + it.calories, 0);
  const totalProtein = Number(ingredients.reduce((sum, it) => sum + it.protein, 0).toFixed(1));
  const totalCarbs = Number(ingredients.reduce((sum, it) => sum + it.carbs, 0).toFixed(1));
  const totalFat = Number(ingredients.reduce((sum, it) => sum + it.fat, 0).toFixed(1));
  const totalFiber = Number(ingredients.reduce((sum, it) => sum + it.fiber, 0).toFixed(1));

  // Per Serving
  const safeServings = Math.max(1, servings);
  const perServingCalories = Math.round(totalCalories / safeServings);
  const perServingProtein = Number((totalProtein / safeServings).toFixed(1));
  const perServingCarbs = Number((totalCarbs / safeServings).toFixed(1));
  const perServingFat = Number((totalFat / safeServings).toFixed(1));
  const perServingFiber = Number((totalFiber / safeServings).toFixed(1));

  const handleSaveRecipe = () => {
    if (!recipeName.trim() || ingredients.length === 0) return;

    const newRecipe: CustomRecipe = {
      id: `recipe_${Date.now()}`,
      name: recipeName.trim(),
      description: recipeDesc.trim() || 'Custom homemade recipe',
      servings: safeServings,
      ingredients,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      perServingCalories,
      perServingProtein,
      perServingCarbs,
      perServingFat,
      perServingFiber,
      createdAt: new Date().toISOString(),
    };

    saveRecipe(newRecipe);
    setRecipeName('');
    setRecipeDesc('');
    setIngredients([]);
  };

  const handleAddSelectedFoodToIngredients = (food: FoodItem) => {
    const ratio = ingredientGrams / 100;
    const newIng: CustomRecipeIngredient = {
      foodId: food.id,
      foodName: food.name,
      grams: ingredientGrams,
      portionLabel: `${ingredientGrams}g`,
      calories: Math.round(food.caloriesPer100g * ratio),
      protein: Number((food.proteinPer100g * ratio).toFixed(1)),
      carbs: Number((food.carbsPer100g * ratio).toFixed(1)),
      fat: Number((food.fatPer100g * ratio).toFixed(1)),
      fiber: Number((food.fiberPer100g * ratio).toFixed(1)),
    };

    setIngredients((prev) => [...prev, newIng]);
    setIsAddingIngredient(false);
    setIngredientSearch('');
  };

  const handleLogServingToToday = (recipe: CustomRecipe) => {
    const today = getTodayDateString();
    addMealItem('lunch', {
      id: `rec_item_${Date.now()}`,
      foodId: recipe.id,
      name: recipe.name,
      category: 'recipe',
      quantity: 1,
      selectedPortion: { label: '1 serving', grams: 200, isHousehold: true },
      totalGrams: 200,
      calories: recipe.perServingCalories,
      protein: recipe.perServingProtein,
      carbs: recipe.perServingCarbs,
      fat: recipe.perServingFat,
      fiber: recipe.perServingFiber,
      state: 'cooked',
      confidenceIndicator: 'user_entered',
      loggedAt: new Date().toISOString(),
    }, today);
  };

  const filteredFoods = allFoods
    .filter((f) => f.category !== 'recipe')
    .filter((f) => f.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
    .slice(0, 15);

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-1">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-emerald-600" />
          Recipe Builder & Custom Homemade Foods
        </h1>
        <p className="text-xs text-slate-500">
          Combine ingredients to calculate total and per-serving nutrition for Indian home cooking.
        </p>
      </div>

      {/* RECIPE BUILDER FORM (Section 19) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Create New Recipe
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipe Name *
            </label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g. Homemade Palak Chicken Curry"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Number of Servings Produced *
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={servings}
              onChange={(e) => setServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-700 font-mono focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Short Recipe Notes / Cooking Details
          </label>
          <input
            type="text"
            value={recipeDesc}
            onChange={(e) => setRecipeDesc(e.target.value)}
            placeholder="e.g. Cooked with 2 tsp mustard oil, pressure cooked"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* INGREDIENTS LIST */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recipe Ingredients ({ingredients.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAddingIngredient(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Ingredient
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
            {ingredients.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No ingredients added yet. Tap "+ Add Ingredient" to pick from Indian food database.
              </div>
            ) : (
              ingredients.map((ing, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{ing.foodName}</span>
                    <p className="text-[11px] text-slate-500">
                      {ing.portionLabel} • P: {ing.protein}g | C: {ing.carbs}g | F: {ing.fat}g | Fib: {ing.fiber}g
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800">
                      {ing.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NUTRITION TOTALS & PER SERVING CARD */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Total Recipe Batch ({servings} servings)
              </span>
              <span className="text-xl font-black text-slate-200 font-mono mt-0.5 block">
                {totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                P: {totalProtein}g | C: {totalCarbs}g | F: {totalFat}g | Fib: {totalFiber}g
              </p>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                Per 1 Serving Nutrition
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                {perServingCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </span>
              <p className="text-[10px] text-slate-300 mt-0.5">
                P: <strong>{perServingProtein}g</strong> | C: <strong>{perServingCarbs}g</strong> | F: <strong>{perServingFat}g</strong> | Fib: <strong>{perServingFiber}g</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveRecipe}
            disabled={!recipeName.trim() || ingredients.length === 0}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Recipe to My Custom Library
          </button>
        </div>
      </div>

      {/* SAVED RECIPES LIBRARY */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Saved Custom Recipes ({customRecipes.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customRecipes.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{rec.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteRecipe(rec.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 font-mono">
                    {rec.perServingCalories} kcal
                  </span>
                  <span className="text-[10px] text-slate-400 block">per serving</span>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  <span>P: {rec.perServingProtein}g | C: {rec.perServingCarbs}g</span>
                  <span className="block">F: {rec.perServingFat}g | Fib: {rec.perServingFiber}g</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogServingToToday(rec)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Log 1 Serving to Today's Lunch
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL TO ADD INGREDIENT FROM DATABASE */}
      {isAddingIngredient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Ingredient to Recipe</h3>
              <button
                onClick={() => setIsAddingIngredient(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                placeholder="Search food ingredient (Chicken, Onion, Rice, Oil...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Weight to Add:</span>
              <input
                type="number"
                min={5}
                max={2000}
                value={ingredientGrams}
                onChange={(e) => setIngredientGrams(Math.max(1, parseInt(e.target.value, 10) || 100))}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
              />
              <span className="text-xs text-slate-400">grams</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-60 pr-1">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleAddSelectedFoodToIngredients(food)}
                  className="py-2.5 px-2 hover:bg-emerald-50 rounded-xl cursor-pointer flex items-center justify-between text-xs group"
                >
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-emerald-700">{food.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {food.caloriesPer100g} kcal / 100g • {food.proteinPer100g}g protein
                    </p>
                  </div>
                  <span className="text-emerald-600 font-bold text-xs opacity-0 group-hover:opacity-100">
                    + Add
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
