"use client";
import Link from 'next/link';
import { TransitionLink, useLoader } from './GlobalLoaderProvider';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import UserMenu from './UserMenu';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Header({ transparent, onOpenRegisterAction }: { transparent?: boolean; onOpenRegisterAction?: () => void } = {}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { startLoading } = useLoader();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const topClass = transparent ? 'top-8' : 'top-4';

  return (
    <header className={`fixed ${topClass} left-0 right-0 z-50 transition-all duration-500 ease-in-out h-14 ${transparent ? 'bg-transparent backdrop-blur-none border-0' : 'bg-transparent backdrop-blur-sm'}`}>
      <div className="w-full px-6 lg:px-8 h-full relative">
        <div className="h-full flex items-center justify-between lg:justify-center">
          
          {/* Mobile Menu Button - Visible on mobile, hidden on lg */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Mobile Logo - Visible on mobile, centered absolutely */}
          <div className="lg:hidden absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
             <TransitionLink 
               href="/" 
               className="text-white font-normal no-underline uppercase text-3xl tracking-tighter leading-none"
             >
                 IBERO
             </TransitionLink>
          </div>

          {/* Desktop Nav: three equal columns that span the full width */}
          <nav className="hidden lg:block w-full">
            <div className="grid grid-cols-3 items-center w-full">
              <div className="flex justify-center">
                {pathname === '/' ? (
                  <a
                    href="#tour-2026"
                    className="text-white font-extrabold no-underline uppercase tracking-wider cursor-pointer"
                    onClick={e => {
                      e.preventDefault();
                      // Landing contract: OPEN TOURS always snaps to 2026.
                      const el = document.getElementById('tour-2026');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    OPEN TOURS
                  </a>
                ) : (
                  <TransitionLink href="/destinations" className="text-white font-extrabold no-underline uppercase tracking-wider">
                    OPEN TOURS
                  </TransitionLink>
                )}
              </div>

              <div className="text-center">
                { /* When header is transparent (landing) we want IBERO at 50px exactly */ }
                <TransitionLink
                  href="/"
                  className={`text-white font-normal no-underline uppercase text-4xl md:text-5xl tracking-tighter leading-none ${transparent ? 'desktop-ibero-large' : ''}`}
                >
                  IBERO
                </TransitionLink>
              </div>

              <div className="flex justify-center">
                {/* Point to Next /behind route */}
                <TransitionLink href="/behind" className="text-white font-extrabold no-underline uppercase tracking-wider">
                  BEHIND
                </TransitionLink>
              </div>
            </div>
          </nav>

          {/* User panel pinned to the far right edge of the header */}
          <div className="absolute right-6 flex items-center space-x-3">
            <UserMenu onOpenRegisterAction={onOpenRegisterAction} />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-90 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <TransitionLink
                href="/"
                className="text-white font-normal no-underline uppercase text-3xl tracking-tighter leading-none"
                onClick={closeAllMenus}
              >
                IBERO
              </TransitionLink>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 text-center">
              <TransitionLink 
                href="/destinations" 
                className="text-white text-xl font-extrabold uppercase tracking-wider py-2"
                onClick={closeAllMenus}
              >
                OPEN TOURS
              </TransitionLink>
              
              <TransitionLink 
                href="/behind" 
                className="text-white text-xl font-extrabold uppercase tracking-wider py-2"
                onClick={closeAllMenus}
              >
                BEHIND
              </TransitionLink>
            </div>
          </div>
        </div>
      )}

      {/* Mini user icon for tour-visible state */}
      <div className="mini-user-icon" id="mini-user" style={{ display: 'none' }}>
        <button
          onClick={() => {
            startLoading();
            startTransition(() => {
              router.push('/panel');
            });
          }}
          className="w-full h-full flex items-center justify-center group"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.95)' }}>
            <span className="absolute block h-[2px] w-5 -translate-y-1 rounded-full bg-white transition-transform duration-300 group-hover:translate-x-1" />
            <span className="absolute block h-[2px] w-5 translate-y-1 rounded-full bg-white transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    </header>
  );
}
