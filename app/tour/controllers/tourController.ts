"use client";

import useTourItinerary from "../hooks/useTourItinerary";
import useTourLayout from "../hooks/useTourLayout";
import useTourMedia from "../hooks/useTourMedia";

export default function useTourController() {
  const itineraryCtrl = useTourItinerary();
  const layoutCtrl = useTourLayout();
  const mediaCtrl = useTourMedia();

  const selectedDay = layoutCtrl.selectedDay;
  const currentDay = selectedDay ? itineraryCtrl.getDay(selectedDay) : null;
  const currentMediaDayIndex = selectedDay ?? mediaCtrl.currentIndex;
  const currentMedia = currentMediaDayIndex != null ? mediaCtrl.media[currentMediaDayIndex] : null;

  const dayCounter = `${selectedDay ?? 0} / ${itineraryCtrl.daysList().length}`;
  const mediaCounter = `${currentMediaDayIndex ?? 0} / ${mediaCtrl.length}`;

  const hasPrevDay = (layoutCtrl.selectedDay != null) && (layoutCtrl.selectedDay > 0);
  const hasNextDay = (layoutCtrl.selectedDay != null) && (layoutCtrl.selectedDay < itineraryCtrl.daysList().length - 1);
  const hasPrevMedia = mediaCtrl.hasPrev;
  const hasNextMedia = mediaCtrl.hasNext;

  const setSelectedDay = layoutCtrl.setSelectedDay;
  const nextDay = () => { if (hasNextDay) setSelectedDay(layoutCtrl.selectedDay! + 1); };
  const prevDay = () => { if (hasPrevDay) setSelectedDay(layoutCtrl.selectedDay! - 1); };
  const nextMedia = mediaCtrl.next;
  const prevMedia = mediaCtrl.prev;
  const selectMediaByIndex = mediaCtrl.selectIndex;

  return {
    // state
    selectedDay,
    currentDay,
    days: itineraryCtrl.daysList(),
    currentMedia,
    media: mediaCtrl.media,
    dayCounter,
    mediaCounter,
    // actions
    setSelectedDay,
    nextDay,
    prevDay,
    nextMedia,
    prevMedia,
    selectMediaByIndex,
    // derived booleans
    hasPrevDay,
    hasNextDay,
    hasPrevMedia,
    hasNextMedia,
  };
}
