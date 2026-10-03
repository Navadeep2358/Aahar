import React from 'react';
import { useNutrition } from '../context/NutritionContext';
import {
  LayoutDashboard,
  Utensils,
  History,
  Scale,
  BarChart3,
  Target,
  ChefHat,
  User,
  Camera,
  Plus,
  Activity,
  LogOut,
  Footprints,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'history'
  | 'progress'
  | 'analytics'
  | 'goals'
  | 'recipes'
  | 'profile';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddFood: () => void;
  onOpenScanMeal: () => void;
  onOpenGoogleFit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddFood,
  onOpenScanMeal,
  onOpenGoogleFit,
}) => {
  const { currentUser, logout, googleFitSyncData } = useNutrition();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'progress', label: 'Weight', icon: <Scale className="w-4 h-4" /> },
    { id: 'analytics', label: 'Trends', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { id: 'recipes', label: 'Recipes', icon: <ChefHat className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Branding */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight block leading-tight">
                Aahaar
              </span>
              <span className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase block">
                Nutrition & Calorie Tracker
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Quick Header Buttons */}
          <div className="flex items-center gap-2">
            {/* Google Fit Sync Button */}
            <button
              onClick={onOpenGoogleFit}
              title={
                currentUser?.googleFitConnected
                  ? `Google Fit: ${googleFitSyncData?.steps.toLocaleString() || 'Synced'}`
                  : 'Connect Google Fit'
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                currentUser?.googleFitConnected
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">
                {currentUser?.googleFitConnected
                  ? `${googleFitSyncData?.steps.toLocaleString() || 'Linked'} Steps`
                  : 'Google Fit'}
              </span>
            </button>

            <button
              onClick={onOpenScanMeal}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 border border-teal-200"
            >
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Scan Photo</span>
            </button>

            <button
              onClick={onOpenAddFood}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Food</span>
            </button>

            {/* Logout button */}
            {currentUser && (
              <button
                onClick={logout}
                title={`Logged in as ${currentUser.email}. Click to log out.`}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-2 py-1.5 shadow-lg flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition ${
              activeTab === item.id
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {item.icon}
            <span className="mt-0.5">{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenGoogleFit}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold text-blue-600"
        >
          <Activity className="w-4 h-4" />
          <span className="mt-0.5">Fit</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition ${
            activeTab === 'profile'
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="mt-0.5">Profile</span>
        </button>
      </nav>
    </>
  );
};
