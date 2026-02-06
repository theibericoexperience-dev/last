/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    // Legacy recovered static site (not used by the Next app). Keep it out of Tailwind scans.
  ],
  theme: {
    extend: {
      // Project canonical spacing scale (non-breaking: mirrors Tailwind defaults)
      // These tokens are provided for consistency going forward and do NOT
      // change existing utilities like `p-4` / `h-36`. They add optional
      // named tokens (e.g. `p-s-4`) and a documented scale to use in new code.
      spacing: {
        's-0': '0px',
        's-1': '0.25rem', // 4px
        's-2': '0.5rem',  // 8px
        's-3': '0.75rem', // 12px
        's-4': '1rem',    // 16px
        's-5': '1.25rem', // 20px
        's-6': '1.5rem',  // 24px
        's-8': '2rem',    // 32px
        's-10': '2.5rem', // 40px
        's-12': '3rem',   // 48px
        's-16': '4rem',   // 64px
        's-20': '5rem',   // 80px
        's-24': '6rem',   // 96px
        's-32': '8rem',   // 128px
        's-40': '10rem',  // 160px
        's-44': '11rem',  // 176px (to match some existing h-44 usage)
        's-48': '12rem',  // 192px
        's-56': '14rem',  // 224px
        's-64': '16rem',  // 256px
      },
    },
  },
  plugins: [],
};
