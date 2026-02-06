import React, { ReactNode } from "react";

interface TourShellProps {
  children: ReactNode;
}

export default function TourShell({ children }: TourShellProps) {
  return (
    <div
      className="tour-shell"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr",
        gap: 16,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}
