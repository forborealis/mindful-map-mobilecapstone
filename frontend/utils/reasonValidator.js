import leoProfanity from 'leo-profanity';

// Load the profanity dictionary
leoProfanity.loadDictionary();

// Add custom words to the profanity filter
const customProfanityWords = [
    'tangina', 'putangina', 'pukingina', 'kingina',
    'gago', 'tarantado', 'putragis',
    'tanga', 'inutil', 'bobo', 'bonak',
    'shet', 'bwisit', 'bwiset', 'niger', 'niga',
    'putakte', 'pakshet', 'leche',
    'kantot', 'bilat', 'puki', 'puke', 'pepe',
];

customProfanityWords.forEach(word => {
  leoProfanity.add(word);
});

/**
 * Normalize text by converting leetspeak and common character substitutions to normal text
 */
const normalizeLeetspeak = (text) => {
  const leetMap = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '9': 'g',
    '@': 'a',
    '$': 's',
    '!': 'i',
    '|': 'l',
    '[': 'l',
    ']': 'l',
    '(': 'c',
    ')': 'c',
  };

  let normalized = text.toLowerCase();
  
  // Replace common leetspeak characters
  for (const [leet, normal] of Object.entries(leetMap)) {
    normalized = normalized.split(leet).join(normal);
  }
  
  return normalized;
};

/**
 * Validates a reason string for:
 * 1. Profanity/inappropriate language (including leetspeak variations)
 * @param {string} reason - The reason text to validate
 * @returns {object} - { isValid: boolean, error: string | null }
 */
export const validateReason = (reason) => {
  if (!reason || !reason.trim()) {
    return { isValid: false, error: 'Reason cannot be empty' };
  }

  const trimmedReason = reason.trim();
  
  // Normalize leetspeak before checking
  const normalizedReason = normalizeLeetspeak(trimmedReason);

  // Check for profanity using leo-profanity
  if (leoProfanity.check(normalizedReason)) {
    return { isValid: false, error: 'Your response contains inappropriate language. Please rephrase.' };
  }

  return { isValid: true, error: null };
};

/**
 * Get all validation errors for a reason (useful for real-time validation feedback)
 * @param {string} reason - The reason text to validate
 * @returns {string[]} - Array of error messages
 */
export const getReasonValidationErrors = (reason) => {
  const errors = [];
  
  if (!reason || !reason.trim()) {
    return errors;
  }

  const validation = validateReason(reason);
  if (!validation.isValid && validation.error) {
    errors.push(validation.error);
  }

  return errors;
};
