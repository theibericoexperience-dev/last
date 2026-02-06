"use client";
import React from 'react';

type Props = { onSelect?: (id: string) => void };

// Lightweight, sanitized inline SVG world map used for selection in the Tour Creator.
// The shapes are intentionally simplified to keep the bundle small.
export default function SvgWorldMap({ onSelect }: Props) {
  function handleClick(id: string) {
    try { if (onSelect) onSelect(id); } catch (e) { /* ignore */ }
  }

  return (
    <div className="w-full h-64 bg-transparent rounded overflow-hidden" role="img" aria-label="World map">
      <svg viewBox="0 0 1200 600" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <style>{`.land{fill:#ffd166;stroke:#8338ec;stroke-width:0.6}.sea{fill:#2ec4b6}`}</style>
        </defs>
        <rect className="sea" width="1200" height="600" />
        <g transform="translate(0,20)">
          <path id="EUROPE" className="land" d="M420 140 C 430 120 460 110 490 120 C 520 130 540 150 560 160 C 580 170 600 175 620 170 C 640 165 660 155 680 150 C 700 145 720 150 740 160 C 760 170 780 190 800 200 L 820 210 L 820 240 L 800 250 L 780 240 L 760 230 L 740 220 L 720 215 L 700 210 L 680 205 L 660 200 L 640 198 L 620 196 L 600 194 L 580 190 L 560 185 L 540 178 L 520 172 L 500 168 L 480 160 L 460 152 Z" onClick={() => handleClick('EUROPE')} />
          <path id="AFRICA" className="land" d="M520 200 C 540 215 560 240 580 270 C 600 300 620 330 640 360 C 660 390 680 420 700 430 L 700 460 L 680 480 L 660 470 C 640 460 620 440 600 420 C 580 400 560 380 540 360 C 520 340 500 320 480 300 C 460 280 450 250 460 230 C 470 220 490 210 510 200 Z" onClick={() => handleClick('AFRICA')} />
          <path id="N_AMERICA" className="land" d="M130 80 C 160 60 200 60 240 80 C 280 100 320 130 360 150 C 400 170 440 190 470 220 L 480 240 L 480 260 L 460 270 L 440 260 C 420 250 400 240 380 230 C 360 220 340 210 320 200 C 300 190 280 180 260 170 C 240 160 200 140 170 120 C 150 105 140 92 130 80 Z" onClick={() => handleClick('N_AMERICA')} />
          <path id="S_AMERICA" className="land" d="M300 300 C 320 320 350 340 380 360 C 410 380 440 400 460 430 C 480 460 500 500 520 530 L 500 540 C 480 525 450 500 430 470 C 410 440 390 410 370 380 C 350 350 330 320 310 300 Z" onClick={() => handleClick('S_AMERICA')} />
          <path id="ASIA" className="land" d="M660 80 C 700 70 740 70 780 90 C 820 110 860 140 900 160 C 940 180 980 200 1000 220 L 1000 260 L 980 270 L 960 260 C 940 250 920 240 900 230 C 880 220 860 210 840 200 C 820 190 800 185 780 184 C 760 183 740 185 720 190 C 700 195 680 200 660 205 Z" onClick={() => handleClick('ASIA')} />
          <path id="AUSTRALIA" className="land" d="M920 380 C 940 370 960 360 980 362 C 1000 364 1020 380 1040 400 C 1060 420 1040 440 1020 450 C 1000 460 980 460 960 452 C 940 444 920 430 900 414 C 920 404 900 390 920 380 Z" onClick={() => handleClick('AUSTRALIA')} />
        </g>
      </svg>
    </div>
  );
}
