// Constants for PDF Editor Application

export const DEFAULT_SIGNATURE_WIDTH = 200;
export const DEFAULT_STAMP_WIDTH = 160;
export const MIN_ITEM_WIDTH = 50;

export const CANVAS_WIDTH = 460;
export const CANVAS_HEIGHT = 220;

export const BUTTON_VARIANTS = {
  default:
    'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-md dark:bg-brand-400 dark:hover:bg-brand-500',
  destructive:
    'bg-red-500 text-white hover:bg-red-600 hover:shadow-md dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800',
  secondary:
    'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
  ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-zinc-800 dark:text-zinc-300',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

export const BUTTON_SIZES = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9',
} as const;

export const BUTTON_BASE_STYLES =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95';
