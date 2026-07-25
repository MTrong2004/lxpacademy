/**
 * Student Question Library Search & Filter Module
 */

export function filterQuestions(questions, query = '', riskFilter = 'all') {
  if (!Array.isArray(questions)) return [];
  const q = String(query || '').trim().toLowerCase();

  return questions.filter(item => {
    // Risk Filter
    if (riskFilter !== 'all') {
      const risk = String(item.error_risk || 'low').toLowerCase();
      if (risk !== riskFilter) return false;
    }

    // Text Search
    if (!q) return true;

    // Check Question Number (e.g. #50 or 50)
    if (q.startsWith('#')) {
      const numStr = q.slice(1);
      if (String(item.num) === numStr) return true;
    }

    const text = `${item.num || ''} ${item.question || ''} ${item.answer || ''} ${item.answer_text || ''} ${Object.values(item.options || {}).join(' ')}`.toLowerCase();
    return text.includes(q);
  });
}
