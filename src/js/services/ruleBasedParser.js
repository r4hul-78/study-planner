/**
 * Heuristic rule-based syllabus text parser.
 * Provides instant offline parsing of structured outline text, bullet points, and numbered units.
 */
export function parseSyllabusRules(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { units: [] };
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const units = [];
  let currentUnit = null;

  const unitRegex = /^(unit|chapter|module|section|part)\s*(\d+|[ivx]+)?\s*[:\-–.]?\s*(.*)$/i;
  const bulletRegex = /^([•\-*–—]|\d+\.\d+|\d+\))\s*(.*)$/;

  for (const line of lines) {
    // Check if line indicates course or subject header (e.g. "Subject: Physics")
    if (/^subject\s*[:\-]/i.test(line) || /^course\s*[:\-]/i.test(line)) {
      continue;
    }

    // Check for Unit / Chapter header
    const unitMatch = line.match(unitRegex);
    if (unitMatch && (unitMatch[2] || unitMatch[3])) {
      const unitNum = unitMatch[2] ? ` ${unitMatch[2]}` : '';
      const unitTitle = unitMatch[3] ? `: ${unitMatch[3]}` : '';
      currentUnit = {
        title: `${unitMatch[1]}${unitNum}${unitTitle}`.trim(),
        topics: []
      };
      units.push(currentUnit);
      continue;
    }

    // Check for bulleted or numbered topic
    const bulletMatch = line.match(bulletRegex);
    if (bulletMatch) {
      const topicTitle = bulletMatch[2].trim();
      if (topicTitle) {
        if (!currentUnit) {
          currentUnit = { title: 'General Topics', topics: [] };
          units.push(currentUnit);
        }
        currentUnit.topics.push({
          title: topicTitle,
          description: `Core topic: ${topicTitle}`,
          difficulty: inferDifficulty(topicTitle),
          estimatedMinutes: 45
        });
      }
      continue;
    }

    // Plain line - if no bullet, could be a unit if short and capitalized, or a topic
    if (!currentUnit || (line.length < 40 && /^[A-Z0-9\s:_-]+$/.test(line) && !line.includes('.'))) {
      currentUnit = {
        title: line,
        topics: []
      };
      units.push(currentUnit);
    } else {
      currentUnit.topics.push({
        title: line,
        description: `Study of ${line}`,
        difficulty: inferDifficulty(line),
        estimatedMinutes: 45
      });
    }
  }

  // Ensure every unit has at least a fallback topic if empty
  return {
    units: units.filter(u => u.topics.length > 0)
  };
}

function inferDifficulty(title) {
  const lower = title.toLowerCase();
  if (lower.includes('advanced') || lower.includes('quantum') || lower.includes('equation') || lower.includes('differential') || lower.includes('derivation') || lower.includes('tree') || lower.includes('graph') || lower.includes('algorithm')) {
    return 'hard';
  }
  if (lower.includes('intro') || lower.includes('basic') || lower.includes('overview') || lower.includes('law') || lower.includes('polarization')) {
    return 'easy';
  }
  return 'medium';
}
