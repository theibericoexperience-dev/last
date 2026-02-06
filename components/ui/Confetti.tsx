"use client";

import React, { useEffect, useRef } from "react";

type ConfettiProps = {
  duration?: number; // ms
};

const COLORS = ["#FF4D4F", "#FFD666", "#73D13D", "#40A9FF", "#9254DE"];

export default function Confetti({ duration = 3000 }: ConfettiProps) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // create canvas attached to body so it's above all stacking contexts
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    // very high z-index so it appears above modals
    canvas.style.zIndex = "2147483647";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      try {
        document.body.removeChild(canvas);
      } catch {}
      return () => {};
    }

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rot: number;
      vr: number;
    };

    const particles: Particle[] = [];
    const count = Math.floor(Math.min(160, (w * 100) / 1000));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * -h * 0.4,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
      });
    }

    const start = performance.now();
    const buffer = 60; // pixels beyond viewport to consider particle gone

    const draw = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.995;
        p.rot += p.vr;

        // draw only if within some extended bounds to avoid drawing far-off particles
        if (p.y > -100 && p.y < h + 200 && p.x > -200 && p.x < w + 200) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      const afterDuration = elapsed >= duration;

      if (afterDuration) {
        const anyAlive = particles.some((p) => p.y < h + buffer && p.x > -buffer && p.x < w + buffer);
        if (anyAlive) {
          rafRef.current = requestAnimationFrame(draw);
          return;
        }

        // all particles are offscreen: clear and stop
        ctx.clearRect(0, 0, w, h);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", resize);
        try {
          document.body.removeChild(canvas);
        } catch {}
        return;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const cleanup = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      try {
        document.body.removeChild(canvas);
      } catch {}
    };

    // safety: ensure cleanup after a max timeout in case something goes wrong
    const safety = setTimeout(() => {
      try {
        ctx.clearRect(0, 0, w, h);
      } catch {}
      cleanup();
    }, duration + 8000);

    return () => {
      clearTimeout(safety);
      cleanup();
    };
  }, [duration]);

  return null;
}
