import { parseISO, isBefore, isValid } from 'date-fns';

/**
 * Checks if a date string is in the format YYYY-MM-DD and is a valid date.
 */
export const isValidISODate = (dateString: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const date = parseISO(dateString);
  return isValid(date);
};

/**
 * Validates if the given expiry date is valid based on the submission deadline.
 * An expiry date must be strictly on or after the submission deadline to be valid.
 * @param expiryDate - YYYY-MM-DD
 * @param submissionDeadline - YYYY-MM-DD
 * @returns boolean
 */
export const isExpiryValid = (expiryDate: string, submissionDeadline: string): boolean => {
  if (!isValidISODate(expiryDate) || !isValidISODate(submissionDeadline)) {
    return false;
  }
  
  // expiryDate < submissionDeadline => expired
  // We use date-fns parseISO to compare the date objects directly.
  const expiry = parseISO(expiryDate);
  const deadline = parseISO(submissionDeadline);
  
  // If expiry is before deadline, it is expired. (Wait, isBefore returns true if expiry < deadline)
  return !isBefore(expiry, deadline);
};
