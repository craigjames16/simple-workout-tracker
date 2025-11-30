'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NavbarContextType {
  showBackButton: boolean;
  setShowBackButton: (show: boolean) => void;
  onBackClick?: () => void;
  setOnBackClick: (callback?: () => void) => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [showBackButton, setShowBackButton] = useState(false);
  const [onBackClick, setOnBackClick] = useState<(() => void) | undefined>(undefined);
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  // Reset navbar state when pathname actually changes
  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      setShowBackButton(false);
      setOnBackClick(undefined);
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  return (
    <NavbarContext.Provider 
      value={{ 
        showBackButton, 
        setShowBackButton, 
        onBackClick,
        setOnBackClick: (callback) => setOnBackClick(() => callback)
      }}
    >
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
}

