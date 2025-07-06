export interface DailyHours {
    day: string;
    isOpen: boolean;
    open: string;
    close: string;
}

export interface SpecialHour {
    id: string;
    date: string;
    isClosed: boolean;
    open?: string;
    close?: string;
    reason: string;
}

// In a real application, this would be a database.
let regularHours: DailyHours[] = [
    { day: "Monday",    isOpen: true,  open: "08:00", close: "18:00" },
    { day: "Tuesday",   isOpen: true,  open: "08:00", close: "18:00" },
    { day: "Wednesday", isOpen: true,  open: "08:00", close: "18:00" },
    { day: "Thursday",  isOpen: true,  open: "08:00", close: "18:00" },
    { day: "Friday",    isOpen: true,  open: "08:00", close: "20:00" },
    { day: "Saturday",  isOpen: true,  open: "09:00", close: "20:00" },
    { day: "Sunday",    isOpen: false, open: "",      close: "" },
];

let specialHours: SpecialHour[] = [
    { id: '1', date: "2024-12-25", isClosed: true, reason: "Christmas Day" },
    { id: '2', date: "2025-01-01", isClosed: true, reason: "New Year's Day" },
    { id: '3', date: "2024-12-31", isClosed: false, open: "09:00", close: "16:00", reason: "New Year's Eve (early close)" },
];

export async function getRegularHours(): Promise<DailyHours[]> {
  return Promise.resolve(regularHours);
}

export async function getSpecialHours(): Promise<SpecialHour[]> {
    return Promise.resolve(specialHours);
}
