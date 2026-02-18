"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { TransitionLink } from './GlobalLoaderProvider';
import UserMenu from './UserMenu';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import '../styles/header.css'; // Import the new CSS file

export default function Header({ transparent, onOpenRegisterAction }: { transparent?: boolean; onOpenRegisterAction?: () => void } = {}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [isMobileMenuOpen]);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out h-14 ${transparent ? 'bg-transparent' : 'bg-black/20 backdrop-blur-sm'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
        <div className="h-full flex items-center justify-between">
          {/* Mobile Menu Button & Desktop Nav Links */}
          <div className="flex items-center">
            {/* Mobile menu button */}
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
            {/* Desktop navigation */}
            <nav className="hidden lg:flex lg:gap-x-8">
              <TransitionLink href="/destinations" className="text-white font-extrabold no-underline uppercase tracking-wider">
                OPEN TOURS
              </TransitionLink>
              <TransitionLink href="/behind" className="text-white font-extrabold no-underline uppercase tracking-wider">
                BEHIND
              </TransitionLink>
            </nav>
          </div>

          {/* Logo */}
          <div className="flex justify-center">
            <TransitionLink
              href="/"
              className="text-white font-normal no-underline uppercase text-3xl lg:text-4xl tracking-tighter leading-none"
            >
              IBERO
            </TransitionLink>
          </div>

          {/* User Menu */}
          <div className="flex items-center justify-end">
            <UserMenu onOpenRegisterAction={onOpenRegisterAction} />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg lg:hidden" onClick={closeAllMenus}>
          <div className="flex flex-col h-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
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

            <div className="flex flex-col gap-y-6 text-xl">
              <TransitionLink
                href="/destinations"
                className="text-white font-extrabold uppercase tracking-wider"
                onClick={closeAllMenus}
              >
                OPEN TOURS
              </TransitionLink>
              <TransitionLink
                href="/behind"
                className="text-white font-extrabold uppercase tracking-wider"
                onClick={closeAllMenus}
              >
                BEHIND
              </TransitionLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
