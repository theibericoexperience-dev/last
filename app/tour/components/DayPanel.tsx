import React from "react";
import { ItDay } from "../hooks/useTourItinerary";

type DayPanelProps = {
  currentDay: ItDay | null;
  dayCounter: string;
  onPrev?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
};

export default function DayPanel({ currentDay, dayCounter, onPrev, onNext }: DayPanelProps) {
  return (
    <section style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
      <h3>Day Panel ({dayCounter})</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>{currentDay ? JSON.stringify(currentDay, null, 2) : "No day selected"}</pre>
      <div style={{ marginTop: 4 }}>
        <button onClick={onPrev} disabled={!onPrev} style={{ marginRight: 4 }}>Prev Day</button>
        <button onClick={onNext} disabled={!onNext}>Next Day</button>
      </div>
    </section>
  );
}
