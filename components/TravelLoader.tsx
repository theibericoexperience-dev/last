"use client";

import React from "react";

const TravelLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-medium text-white animate-pulse tracking-wide">
          Loading your next page...
        </h2>
      </div>
    </div>
  );
};

export default TravelLoader;
