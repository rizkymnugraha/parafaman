import React from 'react';
import { Link } from 'react-router-dom';
import { useAbout } from '@/store';

interface FooterProps {
  showPrivacyLink?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ showPrivacyLink = true, className = '' }) => {
  const { showAbout } = useAbout();

  return (
    <footer
      className={`py-4 px-6 text-center text-xs text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span>© {new Date().getFullYear()} ParafAman</span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <button
          onClick={showAbout}
          className="hover:text-brand-500 cursor-pointer dark:hover:text-brand-200 transition-colors"
        >
          Tentang
        </button>
        {showPrivacyLink && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <Link
              to="/privacy"
              className="hover:text-brand-500 dark:hover:text-brand-200 transition-colors"
            >
              Kebijakan Privasi
            </Link>
          </>
        )}
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-500 dark:hover:text-brand-200 transition-colors"
        >
          GitHub
        </a>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <a
          href="https://saweria.com/rizkymeiputra"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-500 dark:hover:text-brand-200 transition-colors"
        >
          Saweria
        </a>
      </div>
    </footer>
  );
};
