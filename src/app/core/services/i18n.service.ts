import { Injectable, computed, signal } from '@angular/core';
import { UI_DICTIONARY, type I18nKey } from '../i18n/ui-dictionary';
import { pickLang } from '../i18n/localized';
import type { Lang, LocalizedString } from '../../domain/models';
import { readStorage, writeStorage } from '../utils/storage';

const LANG_KEY = 'muestra_lang';

function readLang(): Lang {
  return readStorage(LANG_KEY) === 'en' ? 'en' : 'es';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(readLang());
  readonly dict = computed(() => UI_DICTIONARY[this.lang()]);
  readonly locale = computed(() => (this.lang() === 'en' ? 'en-US' : 'es-MX'));

  t(key: I18nKey): string {
    return this.dict()[key];
  }

  tx(value: LocalizedString | string): string {
    this.lang();
    return typeof value === 'string' ? value : pickLang(value, this.lang());
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(this.locale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    writeStorage(LANG_KEY, lang);
    const root = document.documentElement;
    root.lang = lang;
    root.setAttribute('translate', 'no');
    root.classList.add('notranslate');
    document.body?.setAttribute('translate', 'no');
    document.body?.classList.add('notranslate');
    document.title = UI_DICTIONARY[lang].title;
  }
}

export type { I18nKey };
