import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  async toEnglish(text: string): Promise<string> {
    const source = text.trim();
    if (!source) return source;
    try {
      const chunks = this.split(source, 450);
      const translated = await Promise.all(chunks.map((chunk) => this.translateChunk(chunk)));
      return translated.join(' ').replace(/\s+/g, ' ').trim() || source;
    } catch {
      return source;
    }
  }

  private split(text: string, max: number): string[] {
    if (text.length <= max) return [text];
    const parts: string[] = [];
    let rest = text;
    while (rest.length > max) {
      const slice = rest.slice(0, max);
      const breakAt = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
      const cut = breakAt > 40 ? breakAt + 1 : max;
      parts.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) parts.push(rest);
    return parts;
  }

  private async translateChunk(text: string): Promise<string> {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|en`;
      const res = await fetch(url);
      const data = (await res.json()) as { responseData?: { translatedText?: unknown } };
      const raw = data.responseData?.translatedText;
      if (typeof raw !== 'string' || /MYMEMORY WARNING/i.test(raw)) return text;
      return raw.trim() || text;
    } catch {
      return text;
    }
  }
}
