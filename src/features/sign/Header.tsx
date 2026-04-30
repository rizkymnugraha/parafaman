import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, HelpCircle, Sun, Moon, Menu } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Theme } from '@/types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onShowInstructions: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onShowInstructions,
  onToggleSidebar,
}) => {
  const location = useLocation();
  const isSignPage = location.pathname === '/sign';

  return (
    <div
      className={`fixed top-6 z-30 transition-all duration-500 ease-in-out left-1/2 -translate-x-1/2 ${
        isSignPage ? 'md:left-4 md:translate-x-0' : ''
      }`}
    >
      <header
        className={`h-12 border shadow-md border-border bg-background flex items-center justify-between px-4 shrink-0 rounded-full transition-all duration-500 ease-in-out w-[min(32rem,calc(100vw-2rem))] ${
          isSignPage ? 'md:w-[min(24rem,calc(100vw-2rem))]' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-500 dark:text-brand-400" />
          <h2 className="font-bold text-lg tracking-tight">
            Paraf
            <span className="text-brand-500 dark:text-brand-400">Aman</span>
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {/* Show Help button only on sign page */}
          {isSignPage && (
            <Button
              variant="ghost"
              className="rounded-full"
              size="icon"
              onClick={onShowInstructions}
              title="Bantuan"
            >
              <HelpCircle className="w-5 h-5 text-zinc-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            className="rounded-full"
            size="icon"
            onClick={onToggleTheme}
            title="Ganti tema"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {/* Mobile menu button - only on sign page */}
          {isSignPage && onToggleSidebar && (
            <Button
              variant="ghost"
              className="rounded-full md:hidden"
              size="icon"
              onClick={onToggleSidebar}
              title="Menu"
            >
              <Menu className="w-5 h-5 text-zinc-500" />
            </Button>
          )}
        </div>
      </header>
    </div>
  );
};
