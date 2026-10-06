import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Phones and tablets can't show a PDF inside a page properly (Android shows an "Open" button,
// iOS shows a preview that won't scroll), so they open documents in their own full viewer.
export function opensPdfExternally() {
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true
}
