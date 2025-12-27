export const formatTime = (value: string | number | undefined | null): string => {
    if (!value) return '';

    // Convert to string and remove non-digits
    const cleanValue = String(value).replace(/\D/g, '');

    // Pad to at least 4 chars (e.g. 700 -> 0700)
    const padded = cleanValue.padStart(4, '0');

    // Take first 4 digits
    const v = padded.slice(0, 4);

    const hh = v.slice(0, 2);
    const mm = v.slice(2, 4);

    // Optional: basic validation
    const hours = parseInt(hh, 10);
    const minutes = parseInt(mm, 10);

    // If invalid (e.g. 25:00), just return formatted string or handle error?
    // For now, let's just return formatted. The database might reject invalid times, 
    // or we could cap them. Let's just format.

    return `${hh}:${mm}`;
};

export const isValidTime = (time: string): boolean => {
    if (!time) return false;
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
};
