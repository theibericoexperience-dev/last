"use client";

import React, { createContext, useContext, useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import TravelLoader from "@/components/TravelLoader";

interface LoaderContextType {
  loading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoaderContext = createContext<LoaderContextType>({
  loading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export const useLoader = () => useContext(LoaderContext);

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  // To avoid Next.js 13+ build errors with useSearchParams on static pages (like 404),
  // we must wrap the component usage in Suspense or handle fallback.
  // However, this is a Provider wrapping children. 
  // We should split the logic that uses hooks into a client component wrapper.
  
  return (
      <React.Suspense fallback={<>{children}</>}>
          <GlobalLoaderInner>{children}</GlobalLoaderInner>
      </React.Suspense>
  );
}

function GlobalLoaderInner({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading whenever the URL changes (navigation complete)
  useEffect(() => {
    // We only turn off loading if the new page doesn't have its own "internal" loader logic.
    // However, for general navigation, this is the safest default.
    // If a specific page (like Panel) needs to KEEP it open, it should probably intercept this?
    // Actually, PanelClient mounts newly. The Global Loader is in RootLayout.
    // PanelClient can immediately set loading(true) again? Or we rely on Panel's own internal loader?
    //
    // The user wants: "until the page has everything".
    // If Panel has its own loader logic (it does, locally with TravelLoader),
    // then we might have a flash of: 
    //   Landing(Loader) -> Navigation Done -> GlobalLoader(OFF) -> Panel(Loader ON)
    // To avoid flicker, we can let the new page turn it off manually? No that's complex.
    //
    // Let's rely on native behavior:
    // GlobalLoader covers the "Fetching Server Component" phase.
    // PanelClient covers the "Video Loading" phase.
    
    setLoading(false);
  }, [pathname, searchParams]);

  return (
    <LoaderContext.Provider value={{ loading, startLoading: () => setLoading(true), stopLoading: () => setLoading(false) }}>
      {children}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
          <TravelLoader />
        </div>
      )}
    </LoaderContext.Provider>
  );
}

// Wrapper for Link that triggers loading
export function TransitionLink({ href, children, className, ...props }: React.ComponentProps<typeof Link>) {
  const router = useRouter();
  const { startLoading } = useLoader();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isPending) return;

    startLoading(); // Show the overlay immediately on current page
    
    startTransition(() => {
        router.push(href.toString());
    });
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={className} 
      {...props}
    >
      {children}
    </Link>
  );
}
