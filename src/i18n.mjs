import strings from './strings.json' with {type: 'json'};

export const LOCALIZATION_FILE = 'zotero-veil.ftl';

/** Private Fluent context; never attaches resources to a shared document. */
export async function loadTranslator(Localization, appLocale = 'en-US') {
  const keys = Object.keys(strings);
  const localization = new Localization([LOCALIZATION_FILE]);
  const values = await localization.formatValues(keys);
  const messages = new Map(keys.map((key, i) => [key, values[i] || strings[key]['en-US']]));
  const t = key => messages.get(key) || strings[key]?.['en-US'] || strings['zotero-veil-save-error']['en-US'];
  t.language = /^zh(?:-|$)/i.test(appLocale) ? 'zh-CN' : 'en-US';
  return t;
}

export function englishFallback(key) {
  return strings[key]?.['en-US'] || strings['zotero-veil-save-error']['en-US'];
}

/** Apply only explicitly marked nodes under this plugin's own settings root. */
export function localizeSettings(root, t) {
  if (root.id !== 'zmt-settings') throw new Error('Veil settings root required');
  root.setAttribute('lang', t.language || 'en-US');
  for (const node of root.querySelectorAll('[data-veil-text]')) {
    node.textContent = t(node.getAttribute('data-veil-text'));
  }
  for (const node of root.querySelectorAll('[data-veil-label]')) {
    node.setAttribute('aria-label', t(node.getAttribute('data-veil-label')));
  }
}
