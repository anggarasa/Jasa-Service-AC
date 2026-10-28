/**
 * Indonesian Phone Number Normalization & Formatting Utility
 */

export interface NormalizedPhoneResult {
  isValid: boolean;
  normalized: string; // E.164 format: +6281234567890
  display: string;    // Local display format: 0812-3456-7890
  digitsOnly: string; // 6281234567890
  error?: string;
}

export function normalizeIndonesianPhone(input: string): NormalizedPhoneResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalized: '',
      display: '',
      digitsOnly: '',
      error: 'Nomor telepon tidak boleh kosong',
    };
  }

  // Remove whitespace, dashes, dots, parentheses
  let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');

  // Handle leading '+'
  let hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  // Check if non-digits remain
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      display: '',
      digitsOnly: '',
      error: 'Nomor telepon hanya boleh berisi angka',
    };
  }

  // Normalize prefix to 628...
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  } else if (cleaned.startsWith('628')) {
    // Already 628...
  } else {
    return {
      isValid: false,
      normalized: '',
      display: '',
      digitsOnly: '',
      error: 'Nomor telepon harus diawali dengan 08, 628, atau +628',
    };
  }

  // Indonesian mobile numbers are typically 10 to 13 digits (excluding +)
  // i.e., 62 + 8... (total 10 to 14 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      isValid: false,
      normalized: '',
      display: '',
      digitsOnly: '',
      error: 'Panjang nomor telepon Indonesia tidak valid (antara 10-14 digit)',
    };
  }

  const normalized = `+${cleaned}`;
  const digitsOnly = cleaned;

  // Format display as local: 08xx-xxxx-xxxx
  const localDigits = '0' + cleaned.substring(2);
  let display = localDigits;
  if (localDigits.length === 10) {
    display = `${localDigits.slice(0, 4)}-${localDigits.slice(4, 7)}-${localDigits.slice(7)}`;
  } else if (localDigits.length === 11) {
    display = `${localDigits.slice(0, 4)}-${localDigits.slice(4, 7)}-${localDigits.slice(7)}`;
  } else if (localDigits.length >= 12) {
    display = `${localDigits.slice(0, 4)}-${localDigits.slice(4, 8)}-${localDigits.slice(8)}`;
  }

  return {
    isValid: true,
    normalized,
    display,
    digitsOnly,
  };
}
