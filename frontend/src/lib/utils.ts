import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Simple unique ID generator for frontend
export function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

// Format date helper
export function formatDate(dateString?: string) {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
}
