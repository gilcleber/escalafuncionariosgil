export const formatTime = (value: string | number | undefined | null): string => {
    if (!value && value !== 0) return '';

    // Remove non-digits
    const cleanValue = String(value).replace(/\D/g, '');

    // Pad start to ensure we have at least 3-4 digits (e.g. "700" -> "0700", "1300" -> "1300")
    const padded = cleanValue.padStart(4, '0');

    // Slice properly for HH and MM
    const hh = padded.slice(0, 2);
    const mm = padded.slice(2, 4);

    return `${hh}:${mm}`;
};

export const isValidTime = (time: string): boolean => {
    if (!time) return false;
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
};
