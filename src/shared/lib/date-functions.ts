import { format, parseISO } from 'date-fns';

export function isoToReadable(iso: string) {
  return format(parseISO(iso), 'yyyy');
}

export function convertUnixToHumanReadable(unixTimestamp: number) {
  const date = new Date(unixTimestamp * 1000); // Convert to milliseconds
  return format(date, 'MMM dd, yyyy');
};