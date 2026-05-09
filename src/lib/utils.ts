import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 *
 * This utility function merges multiple class names together:
 * 1. Uses clsx to combine conditional classes
 * 2. Uses tailwind-merge to resolve Tailwind CSS conflicts
 *
 * @param inputs - Class names to combine (strings, objects, arrays)
 * @returns Merged class name string with conflicts resolved
 *
 * @example
 * ```tsx
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6') // 'py-2 bg-blue-500 px-6'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
