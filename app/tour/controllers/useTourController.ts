"use client";

import { useState, useCallback } from 'react';
import { publishLandingScrollTo } from '../../../lib/navigation/intents';

export interface TourState {
  selectedDayNumber: number | null;
  activeTab: 'itinerary' | 'ibero' | 'reservation' | '';
  sectionOpen: boolean;
  cartItems: any[];
  addons: { preArrival: boolean; extension: boolean };
}

export interface TourActions {
  selectDay: (day: number | null) => void;
  setActiveTab: (tab: TourState['activeTab']) => void;
  setSectionOpen: (open: boolean) => void;
  toggleSection: () => void;
  addToCart: (item: any) => void;
  removeFromCart: (itemId: string) => void;
  updateAddons: (addons: Partial<TourState['addons']>) => void;
  goToLandingSection: (id: string) => void;
}

export function useTourController(initialDay?: number | null): TourState & TourActions {
  // Estado principal
  const [sectionOpen, setSectionOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TourState['activeTab']>('itinerary');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(initialDay || null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addons, setAddons] = useState({ preArrival: false, extension: false });

  // Acciones
  const selectDay = useCallback((day: number | null) => {
    setSelectedDayNumber(day);
  }, []);

  const setSectionOpenAction = useCallback((open: boolean) => {
    setSectionOpen(open);
  }, []);

  const toggleSection = useCallback(() => {
    setSectionOpen(prev => !prev);
  }, []);

  const addToCart = useCallback((item: any) => {
    setCartItems(prev => [...prev, item]);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateAddons = useCallback((newAddons: Partial<TourState['addons']>) => {
    setAddons(prev => ({ ...prev, ...newAddons }));
  }, []);

  const goToLandingSection = useCallback((id: string) => {
    publishLandingScrollTo(id);
  }, []);

  return {
    // Estado
    selectedDayNumber,
    activeTab,
    sectionOpen,
    cartItems,
    addons,
    // Acciones
    selectDay,
    setActiveTab,
    setSectionOpen: setSectionOpenAction,
    toggleSection,
    addToCart,
    removeFromCart,
    updateAddons,
    goToLandingSection,
  };
}