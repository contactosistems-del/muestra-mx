import { Injectable, signal } from '@angular/core';
import type { Theme } from '../../domain/models';
import { readStorage, writeStorage } from '../utils/storage';

const THEME_KEY = 'muestra_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(readStorage(THEME_KEY) === 'dark' ? 'dark' : 'light');

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    writeStorage(THEME_KEY, next);
  }

  apply(): void {
    document.documentElement.setAttribute('data-theme', this.theme());
  }
}
