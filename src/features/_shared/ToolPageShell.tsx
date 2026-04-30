import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface ToolPageShellProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Standard chrome for tool pages: back link, title, description, footer.
 * Use for tools that need a focused single-step UI.
 */
export const ToolPageShell: React.FC<ToolPageShellProps> = ({
  title,
  description,
  icon,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col animate-in fade-in zoom-in-95 duration-500 bg-dotted-grid bg-white dark:bg-zinc-900 transition-all">
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 pt-28 pb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-brand-500 dark:text-zinc-400 dark:hover:text-brand-400 transition-colors w-fit mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke beranda
        </Link>

        <div className="flex flex-col items-center text-center mb-8">
          {icon && (
            <div className="p-3 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-4">
              {icon}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{title}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl">{description}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start">{children}</div>
      </div>

      <Footer />
    </div>
  );
};
