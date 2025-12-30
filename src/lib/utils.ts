import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function getDaysInMonth(month: number, year: number) {
	const lastDay = new Date(year, month, 0).getDate();

	return Array.from({ length: lastDay }, (_, i) => i + 1);
}

export function getAllColorPalette() {
	return [
		'#F0FFFF',
		'#E0FFFF',
		'#F1DDCF',
		'#FFF0F5',
		'#FFDAE9',
		'#FFE4E1',
		'#F0FFF0',
		'#F0F8FF',
		'#E6E6FA',
		'#FAE6FA',
		'#E5E4E2',
		'#F2F3F4',
		'#FAEBD7',
		'#F0FFFF',
		'#F8F4FF',
		'#F5FFFA',
		'#FFF5EE',
	]
}