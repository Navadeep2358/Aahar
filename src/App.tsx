/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NutritionProvider, useNutrition } from './context/NutritionContext';
import { ActiveTab, Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SetupWizard } from './components/SetupWizard';
import { AuthScreen } from './components/AuthScreen';
import { GoogleFitModal } from './components/GoogleFitModal';
import { AddFoodModal } from './components/AddFoodModal';
import { MealScannerModal } from './components/MealScannerModal';
import { AddExerciseModal } from './components/AddExerciseModal';
import { WeightLogModal } from './components/WeightLogModal';
import { CalculationTransparencyModal } from './components/CalculationTransparencyModal';
import { WeightProgressView } from './components/WeightProgressView';
import { AnalyticsView } from './components/AnalyticsView';
import { GoalCalculatorView } from './components/GoalCalculatorView';
import { FoodHistoryView } from './components/FoodHistoryView';
import { RecipeBuilderView } from './components/RecipeBuilderView';
import { ProfileView } from './components/ProfileView';
import { MealType } from './types/nutrition';

function AppContent() {
  const { isAuthenticated, userProfile } = useNutrition();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showWizard, setShowWizard] = useState<boolean>(false);

  // Modals state
  const [isAddFoodOpen, setIsAddFoodOpen] = useState<boolean>(false);
  const [targetMealSlot, setTargetMealSlot] = useState<MealType>('lunch');
  const [isScanMealOpen, setIsScanMealOpen] = useState<boolean>(false);
  const [isExerciseOpen, setIsExerciseOpen] = useState<boolean>(false);
  const [isWeightOpen, setIsWeightOpen] = useState<boolean>(false);
  const [isTransparencyOpen, setIsTransparencyOpen] = useState<boolean>(false);
  const [isGoogleFitOpen, setIsGoogleFitOpen] = useState<boolean>(false);

  const handleOpenAddFood = (mealSlot?: MealType) => {
    if (mealSlot) setTargetMealSlot(mealSlot);
    setIsAddFoodOpen(true);
  };

  const handleOpenScanMeal = (mealSlot?: MealType) => {
    if (mealSlot) setTargetMealSlot(mealSlot);
    setIsScanMealOpen(true);
  };

  // 1. If not logged in, show AuthScreen (Login & Register)
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // 2. If logged in but profile is not completed yet, show SetupWizard to gather required info
  if (!userProfile.isProfileSetup || showWizard) {
    return <SetupWizard onComplete={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar & Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddFood={() => handleOpenAddFood('lunch')}
        onOpenScanMeal={() => handleOpenScanMeal('lunch')}
        onOpenGoogleFit={() => setIsGoogleFitOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddFood={handleOpenAddFood}
            onOpenScanMeal={handleOpenScanMeal}
            onOpenAddExercise={() => setIsExerciseOpen(true)}
            onOpenLogWeight={() => setIsWeightOpen(true)}
            onOpenTransparency={() => setIsTransparencyOpen(true)}
            onOpenGoogleFit={() => setIsGoogleFitOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <FoodHistoryView onOpenAddFood={handleOpenAddFood} />
        )}

        {activeTab === 'progress' && (
          <WeightProgressView onOpenLogWeight={() => setIsWeightOpen(true)} />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'goals' && <GoalCalculatorView />}

        {activeTab === 'recipes' && (
          <RecipeBuilderView onOpenAddFood={handleOpenAddFood} />
        )}

        {activeTab === 'profile' && (
          <ProfileView onOpenWizard={() => setShowWizard(true)} />
        )}
      </main>

      {/* Global Modals */}
      <AddFoodModal
        isOpen={isAddFoodOpen}
        onClose={() => setIsAddFoodOpen(false)}
        initialMealType={targetMealSlot}
      />

      <MealScannerModal
        isOpen={isScanMealOpen}
        onClose={() => setIsScanMealOpen(false)}
        initialMealType={targetMealSlot}
      />

      <GoogleFitModal
        isOpen={isGoogleFitOpen}
        onClose={() => setIsGoogleFitOpen(false)}
      />

      <AddExerciseModal
        isOpen={isExerciseOpen}
        onClose={() => setIsExerciseOpen(false)}
      />

      <WeightLogModal
        isOpen={isWeightOpen}
        onClose={() => setIsWeightOpen(false)}
      />

      <CalculationTransparencyModal
        isOpen={isTransparencyOpen}
        onClose={() => setIsTransparencyOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <NutritionProvider>
      <AppContent />
    </NutritionProvider>
  );
}
