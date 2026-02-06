import React from "react";

interface ItineraryListProps {
  days: number[];
  selectedDay?: number | null;
  onSelectDay: (day: number) => void;
}

export default function ItineraryList({ days, selectedDay, onSelectDay }: ItineraryListProps) {
  return (
    <div className="itinerary-list" style={{ padding: 8, border: "1px solid #ccc" }}>
      <h3>Itinerary</h3>
      {days.length === 0 ? (
        <p>No days available</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {days.map((day) => (
            <li key={day} style={{ marginBottom: 6 }}>
              <button
                style={{
                  fontWeight: selectedDay === day ? "bold" : "normal",
                  marginRight: 4,
                }}
                onClick={() => onSelectDay(day)}
                aria-label={`Select day ${day}`}
              >
                Day {day}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
