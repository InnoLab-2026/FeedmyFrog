'use client';

import type { i18n as I18n } from 'i18next';

import { LEGAL_NS, legalResources } from './legalResources';

export { LEGAL_NS, legalResources };

/**
 * Adds the legal wording to an i18next instance, once per instance.
 *
 * It cannot simply be part of the instance's initial `resources`: that would
 * put the full privacy policy and imprint — in five languages — into the
 * bundle every route loads, when only two routes ever render it. So the two
 * legal pages call this at the top of their render, before their first `t()`,
 * and the namespace exists by the time anything reads from it.
 *
 * Registering during render is safe here because it only fills a store that
 * the same render then reads: no React state changes, and re-running it is a
 * no-op. It has to be per instance rather than a module-level side effect
 * because the server builds a fresh instance for every request (see
 * getI18nInstance in ./index).
 */
export function useLegalResources(i18n: I18n): void {
  if (i18n.hasResourceBundle(i18n.language, LEGAL_NS)) return;

  for (const [language, bundle] of Object.entries(legalResources)) {
    i18n.addResourceBundle(language, LEGAL_NS, bundle, true, true);
  }
}
