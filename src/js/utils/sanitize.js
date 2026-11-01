/**
 * HTML sanitization and safe rendering utilities to prevent XSS attacks.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Basic markdown parser for assistant and notes text.
 * Escapes raw HTML before converting bold, lists, and code blocks.
 */
export function renderMarkdown(markdownText) {
  if (!markdownText) return '';
  const escaped = escapeHtml(markdownText);

  return escaped
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}
