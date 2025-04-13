import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string, useful for conditionally applying classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 