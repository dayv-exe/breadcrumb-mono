import { useCallback } from "react";

export function useDateConverter() {

  // converts date from yyyy/mm/dd to js format, the backend expects to get dates in yyyy/mm/dd and sends date back in the same format
  const convertToDate = useCallback((dateStr: string): Date | null => {
    if (!dateStr) {
      return null
    }
    // validate and split the input
    const delimiter = dateStr.includes("-") ? "-" : "/"
    const parts = dateStr.split(delimiter);
    if (parts.length !== 3) return null;

    const [yearStr, monthStr, dayStr] = parts;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const year = parseInt(yearStr, 10);

    if (
      isNaN(day) ||
      isNaN(month) ||
      isNaN(year) ||
      day < 1 ||
      day > 31 ||
      month < 0 ||
      month > 11
    ) {
      return null;
    }

    const date = new Date(year, month, day);

    // Check if the constructed date is valid
    if (isNaN(date.getTime())) return null;

    return date;
  }, []);

  // returns days between given date and today, expects date in yyyy/mm/dd
  const daysFromToday = useCallback((dateStr: string): number | null => {
    if (!dateStr) return null
    const date = convertToDate(dateStr);
    if (!date) return null;

    const today = new Date();
    // Normalize both dates to midnight to avoid partial-day issues
    const utc1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const utc2 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

    const diffInMs = utc1 - utc2;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    return diffInDays;
  }, [convertToDate]);

  const nameChangeTooSoon = useCallback((lastNameChange: string, changeDelayInDays: number) => {
    return (daysFromToday(lastNameChange) ?? Number.MAX_SAFE_INTEGER) < changeDelayInDays
  }, [daysFromToday])

  return { convertToDate, daysFromToday, nameChangeTooSoon };
}
