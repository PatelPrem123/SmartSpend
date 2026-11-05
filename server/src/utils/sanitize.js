/**
 * Sanitizes user-provided string input to prevent Stored XSS and command injections (DEC-009)
 * Removes HTML tags, scripts, null bytes, and dangerous URI schemes.
 * @param {string} input
 * @returns {string} Sanitized string
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Remove javascript: and data: pseudo-protocols
    .replace(/(?:javascript|data|vbscript):/gi, '')
    // Normalize consecutive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Escapes characters for HTML output
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
