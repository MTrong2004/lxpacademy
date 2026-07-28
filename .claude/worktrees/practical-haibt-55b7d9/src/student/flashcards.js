/**
 * Student Flashcards Module
 */

export function shuffleQuestions(array) {
  const list = [...(array || [])];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function formatFlashcardFront(questionItem) {
  if (!questionItem) return '';
  return {
    num: questionItem.num,
    question: questionItem.question || '',
    options: questionItem.options || {},
    hasImages: Array.isArray(questionItem.images) && questionItem.images.length > 0,
  };
}

export function formatFlashcardBack(questionItem) {
  if (!questionItem) return '';
  const answer = String(questionItem.answer || '').trim();
  const options = questionItem.options || {};
  const optionText = options[answer] || '';
  const fullAnswerText = questionItem.answer_text || (optionText ? `${answer}. ${optionText}` : answer);

  return {
    answer,
    fullAnswerText,
  };
}
