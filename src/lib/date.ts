// Utility to format dates in a single, standard way across the app
// Format: DD-MMM-YYYY (e.g. 04-Dec-2025)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '-';

  const date = typeof input === 'string' ? new Date(input) : input;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = MONTHS[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}-${month}-${year}`;
}


