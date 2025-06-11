import { Variant, Size } from '@/types/button';
import { cn } from '@/lib/utils';

export const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded transition-all focus:outline-none focus-visible:ring-2 cursor-pointer focus-visible:ring-black disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles: Record<Variant, string> = {
  default:
    'bg-gray-100 text-black dark:bg-neutral-800 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-700',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-800 text-black dark:text-white',
  outline:
    'border border-gray-300 dark:border-neutral-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800',
  reverseColor:
    'bg-black text-white dark:bg-gray-100 dark:text-black hover:bg-neutral-700 dark:hover:bg-gray-200',
};

const variantStylesActive: Record<Variant, string> = {
  default: 'bg-gray-100 text-black dark:bg-neutral-800 dark:text-white',
  ghost: 'bg-transparent text-black dark:text-white',
  outline: 'border border-gray-300 dark:border-neutral-700 text-black dark:text-white',
  reverseColor: 'bg-black text-white dark:bg-gray-100 dark:text-black',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-3 text-lg',
};

export function getButtonClasses({
  variant = 'default',
  size = 'md',
  active = false,
  className = '',
}: {
  variant?: Variant;
  size?: Size;
  active?: boolean;
  className?: string;
}) {
  return cn(
    baseStyles,
    active ? variantStylesActive[variant] : variantStyles[variant],
    sizeStyles[size],
    className,
  );
}
