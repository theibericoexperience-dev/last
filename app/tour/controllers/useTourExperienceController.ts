"use client";

import { useState } from 'react';

export interface CartItem {
  id: string;
  title: string;
  qty: number;
  price: number;
}

export type TourTab = 'itinerary' | 'ibero' | 'reservation' | '';

export interface TourExperienceController {
  sectionOpen: boolean;
  activeTab: TourTab;
  selectedDayNumber: number | null;
  cartItems: CartItem[];
  addons: { preArrival: boolean; extension: boolean };
  setActiveTab(tab: TourTab): void;
  setSectionOpen(open: boolean): void;
  selectDay(day: number): void;
  addToCart(item: CartItem): void;
  removeFromCart(id: string): void;
  goBackToLanding(): void;
}

export function useTourExperienceController(initialDay?: number): TourExperienceController {
  const [sectionOpen] = useState(true);
  const [activeTab] = useState<TourTab>('itinerary');
  const [selectedDayNumber] = useState<number | null>(initialDay ?? null);
  const [cartItems] = useState<CartItem[]>([]);
  const [addons] = useState({ preArrival: false, extension: false });

  function setActiveTab(): void {
    throw new Error('TODO: implement setActiveTab');
  }

  function setSectionOpen(): void {
    throw new Error('TODO: implement setSectionOpen');
  }

  function selectDay(): void {
    throw new Error('TODO: implement selectDay');
  }

  async function addToCart(): Promise<void> {
    throw new Error('TODO: implement addToCart');
  }

  function removeFromCart(): void {
    throw new Error('TODO: implement removeFromCart');
  }

  function goBackToLanding(): void {
    throw new Error('TODO: implement goBackToLanding');
  }

  return {
    sectionOpen,
    activeTab,
    selectedDayNumber,
    cartItems,
    addons,
    setActiveTab,
    setSectionOpen,
    selectDay,
    addToCart,
    removeFromCart,
    goBackToLanding,
  };
}