const normalize = value => value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
const nonblank = value => typeof value === 'string' && value.trim().length > 0;
function objectWithKeys(value, allowed) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => allowed.includes(key));
}
export function validateInput(value) {
  const invalid = message => { throw new TypeError(`ask_user: ${message}`); };
  if (!objectWithKeys(value, ['question', 'reason', 'options', 'recommendation'])) invalid('expected only question, reason, options, and optional recommendation');
  if (!nonblank(value.question) || !nonblank(value.reason)) invalid('question and reason must be nonblank strings');
  if (!Array.isArray(value.options) || value.options.length < 2 || value.options.length > 3) invalid('provide two or three options');
  const ids = new Set(), labels = new Set();
  for (const option of value.options) {
    if (!objectWithKeys(option, ['id', 'label', 'tradeoff']) || !['id', 'label', 'tradeoff'].every(key => nonblank(option[key]))) invalid('each option needs nonblank id, label, and tradeoff');
    if (ids.has(normalize(option.id)) || labels.has(normalize(option.label))) invalid('option IDs and labels must be distinguishable');
    ids.add(normalize(option.id)); labels.add(normalize(option.label));
  }
  if (value.recommendation !== undefined && !value.options.some(option => option.id === value.recommendation)) invalid('recommendation must be an existing option ID');
}

/** One instance per registered extension; lock spans both native dialogs. */
export function createAskUser() {
  let busy = false;
  return async function askUser(params, ctx, signal) {
    validateInput(params);
    if (busy) return { status: 'unavailable', reason: 'busy' };
    if (signal?.aborted) return { status: 'cancelled', reason: 'aborted' };
    if (!ctx.hasUI) return { status: 'unavailable', reason: 'no_ui' };
    const { question, reason, options, recommendation } = structuredClone(params);
    busy = true;
    try {
      const choices = options.map((option, index) => `${index + 1}. ${option.label}${option.id === recommendation ? ' (Recommended)' : ''}`);
      const custom = 'Write a custom answer';
      const context = options.map((option, index) => `${index + 1}. ${option.label}: ${option.tradeoff}${option.id === recommendation ? ' [Recommended]' : ''}`).join('\n');
      const selected = await ctx.ui.select(`${question}\n\nWhy this matters: ${reason}\n\n${context}`, [...choices, custom], { signal });
      if (signal?.aborted) return { status: 'cancelled', reason: 'aborted' };
      if (selected === undefined) return { status: 'cancelled', reason: 'dismissed' };
      if (selected === custom) {
        const answer = await ctx.ui.input(question, 'Write your answer', { signal });
        if (signal?.aborted) return { status: 'cancelled', reason: 'aborted' };
        if (answer === undefined) return { status: 'cancelled', reason: 'dismissed' };
        if (typeof answer !== 'string') return { status: 'unavailable', reason: 'dialog_error' };
        if (!answer.trim()) return { status: 'cancelled', reason: 'empty_answer' };
        return { status: 'answered', source: 'custom', answer };
      }
      const index = choices.indexOf(selected);
      if (index === -1) return { status: 'unavailable', reason: 'dialog_error' };
      return { status: 'answered', source: 'option', optionId: options[index].id, answer: options[index].label };
    } catch {
      return signal?.aborted ? { status: 'cancelled', reason: 'aborted' } : { status: 'unavailable', reason: 'dialog_error' };
    } finally {
      busy = false;
    }
  };
}
