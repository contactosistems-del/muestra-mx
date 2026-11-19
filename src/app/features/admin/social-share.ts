import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { NewsService } from '../../core/services/news.service';
import { photoCredit, renderSocialCards, type SocialCards } from '../../core/utils/social-card';
import { FIREBASE_AUTH, FIRESTORE } from '../../domain/tokens';

type Status = { ok: boolean; text: string };

/**
 * Ventana "Publicar en redes": arma las imágenes con la marca de muestra.mx,
 * las deja listas para la miniatura del enlace, y publica en Facebook e Instagram
 * (API de Meta, gratis). Para X abre la ventana de publicar con el texto y el link.
 */
@Component({
  selector: 'app-social-share',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  host: { class: 'notranslate', translate: 'no' },
  template: `
    <div class="modal-overlay active" (click)="close()">
      <div class="modal-box social-box" (click)="$event.stopPropagation()">
        <button class="btn-close" type="button" (click)="close()">&times;</button>
        <h3><i class="fa-solid fa-bullhorn"></i> Publicar en redes</h3>
        @if (item(); as n) {
          <p class="lead">{{ n.title.es }}</p>
          @if (cards(); as c) {
            <div class="previews">
              <figure>
                <img [src]="c.wide" alt="Imagen para Facebook y X" />
                <figcaption>Facebook · X · WhatsApp <a [href]="c.wide" download="muestra-{{ n.id }}.jpg">Descargar</a></figcaption>
              </figure>
              <figure class="ig">
                <img [src]="c.ig" alt="Imagen para Instagram" />
                <figcaption>Instagram <a [href]="c.ig" download="muestra-{{ n.id }}-instagram.jpg">Descargar</a></figcaption>
              </figure>
            </div>
          } @else {
            <p class="empty">{{ preparing() ? 'Armando las imágenes con el logo…' : 'No se pudieron armar las imágenes.' }}</p>
          }

          <label class="cap">Texto de la publicación</label>
          <textarea rows="6" [(ngModel)]="caption" name="caption"></textarea>

          <div class="actions">
            <button type="button" class="btn-fb" [disabled]="!ready() || busy()" (click)="publish(['facebook'])">
              <i class="fa-brands fa-facebook"></i> Facebook
            </button>
            <button type="button" class="btn-ig" [disabled]="!ready() || busy()" (click)="publish(['instagram'])">
              <i class="fa-brands fa-instagram"></i> Instagram
            </button>
            <button type="button" class="btn-x" [disabled]="!ready()" (click)="openX()">
              <i class="fa-brands fa-x-twitter"></i> X
            </button>
            <button type="button" class="btn-all" [disabled]="!ready() || busy()" (click)="publishAll()">
              <i class="fa-solid fa-paper-plane"></i> Publicar en las 3
            </button>
          </div>
          <button type="button" class="btn-copy" (click)="copy()">{{ copied() ? '¡Texto copiado!' : 'Copiar texto' }}</button>

          @for (s of statuses(); track s.text) {
            <p class="status" [class.bad]="!s.ok">{{ s.text }}</p>
          }
          @if (metaReady() === false) {
            <p class="hint">
              Facebook e Instagram todavía no están conectados al sitio. Mientras, descarga las imágenes y súbelas a mano;
              el link de la nota ya sale con su miniatura y logo.
            </p>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .social-box { max-width: 760px; width: 94vw; max-height: 92vh; overflow: auto; }
    h3 { display: flex; gap: .5rem; align-items: center; }
    .lead { font-weight: 700; margin: .25rem 0 1rem; }
    .previews { display: grid; grid-template-columns: 2fr 1fr; gap: .8rem; align-items: start; }
    figure { margin: 0; }
    figure img { width: 100%; border-radius: 12px; display: block; box-shadow: 0 10px 24px -14px rgba(0,0,0,.6); }
    figcaption { font-size: .8rem; color: #64748b; margin-top: .35rem; display: flex; justify-content: space-between; gap: .5rem; }
    figcaption a { color: #BE3455; font-weight: 700; }
    .cap { display: block; font-weight: 700; margin: 1rem 0 .35rem; }
    textarea { width: 100%; border-radius: 10px; border: 1px solid #cbd5e1; padding: .7rem; font: inherit; resize: vertical; }
    .actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-top: .9rem; }
    .actions button, .btn-copy { border: 0; border-radius: 999px; padding: .7rem .6rem; font-weight: 800; color: #fff; cursor: pointer; display: flex; gap: .4rem; align-items: center; justify-content: center; }
    .actions button:disabled { opacity: .5; cursor: default; }
    .btn-fb { background: #1877f2; }
    .btn-ig { background: linear-gradient(45deg, #f58529, #dd2a7b, #8134af); }
    .btn-x { background: #000; }
    .btn-all { background: #BE3455; }
    .btn-copy { background: #e2e8f0; color: #0f172a; margin-top: .5rem; width: 100%; }
    .status { margin: .5rem 0 0; color: #15803d; font-weight: 700; }
    .status.bad { color: #b91c1c; }
    .hint { margin-top: .8rem; font-size: .85rem; color: #64748b; }
    .empty { padding: 2rem; text-align: center; color: #64748b; }
    @media (max-width: 640px) {
      .previews { grid-template-columns: 1fr; }
      .actions { grid-template-columns: 1fr 1fr; }
    }
  `,
})
export class SocialShare {
  readonly news = inject(NewsService);
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(FIREBASE_AUTH);

  readonly item = computed(() => this.news.byId(this.news.shareId() ?? ''));
  readonly cards = signal<SocialCards | null>(null);
  readonly preparing = signal(false);
  readonly ready = signal(false);
  readonly busy = signal(false);
  readonly copied = signal(false);
  readonly statuses = signal<Status[]>([]);
  readonly metaReady = signal<boolean | null>(null);
  caption = '';
  private builtFor = '';

  constructor() {
    effect(() => {
      const n = this.item();
      if (n && n.id !== this.builtFor) {
        this.builtFor = n.id;
        void this.prepare();
      }
    });
  }

  get link(): string {
    return `https://muestra.mx/noticias/${this.item()?.id ?? ''}`;
  }

  close(): void {
    this.news.closeShare();
  }

  private async prepare(): Promise<void> {
    const n = this.item();
    if (!n) return;
    this.cards.set(null);
    this.ready.set(false);
    this.statuses.set([]);
    this.preparing.set(true);
    const body = n.body.es || '';
    const first = body.split(/\n+/).find((p) => p.trim() && !/^Foto:/i.test(p.trim())) ?? '';
    const short = first.length > 220 ? first.slice(0, 220).replace(/\s+\S*$/, '') + '…' : first;
    this.caption = `${n.title.es}\n\n${short}\n\nLee la nota completa 👉 ${this.link}`;
    void this.checkMeta();
    try {
      const cards = await renderSocialCards({
        imageUrl: n.imageUrl,
        title: n.title.es,
        category: n.categoryId,
        credit: photoCredit(body),
      });
      this.cards.set(cards);
      await this.save(n.id, cards);
      this.ready.set(true);
    } catch {
      this.statuses.set([{ ok: false, text: 'No pude guardar las imágenes. Revisa que sigas como administrador.' }]);
    } finally {
      this.preparing.set(false);
    }
  }

  /** Guarda las imágenes en contenido/ y deja la ruta en la noticia (para la miniatura del enlace y para Meta). */
  private async save(id: string, cards: SocialCards): Promise<void> {
    const base = `foto__social_${id}`.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 110);
    const v = Date.now().toString(36);
    await setDoc(doc(this.db, 'contenido', base), { imageUrl: cards.wide, updatedAt: Date.now() });
    await setDoc(doc(this.db, 'contenido', `${base}_ig`), { imageUrl: cards.ig, updatedAt: Date.now() });
    await updateDoc(doc(this.db, 'noticias', id), {
      social: {
        wide: `/api/survey-photo?id=${base}&v=${v}`,
        ig: `/api/survey-photo?id=${base}_ig&v=${v}`,
      },
    });
  }

  private async token(): Promise<string> {
    const user = this.auth.currentUser;
    return user ? user.getIdToken() : '';
  }

  private async checkMeta(): Promise<void> {
    try {
      const res = await fetch('/api/social-publish', { headers: { Authorization: `Bearer ${await this.token()}` } });
      const j = await res.json();
      this.metaReady.set(!!(j.facebook && j.instagram));
    } catch {
      this.metaReady.set(false);
    }
  }

  async publish(targets: ('facebook' | 'instagram')[]): Promise<void> {
    const n = this.item();
    if (!n) return;
    this.busy.set(true);
    try {
      const res = await fetch('/api/social-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await this.token()}` },
        body: JSON.stringify({ id: n.id, caption: this.caption, targets }),
      });
      const j = await res.json();
      const list: Status[] = [];
      if (j.error) list.push({ ok: false, text: j.error });
      if (j.facebook) list.push({ ok: j.facebook.ok, text: j.facebook.ok ? '✅ Publicado en Facebook' : `Facebook: ${j.facebook.error}` });
      if (j.instagram) list.push({ ok: j.instagram.ok, text: j.instagram.ok ? '✅ Publicado en Instagram' : `Instagram: ${j.instagram.error}` });
      this.statuses.update((prev) => [...prev.filter((p) => !list.some((l) => l.text.split(':')[0] === p.text.split(':')[0])), ...list]);
    } catch {
      this.statuses.update((prev) => [...prev, { ok: false, text: 'No se pudo conectar para publicar.' }]);
    } finally {
      this.busy.set(false);
    }
  }

  openX(): void {
    const n = this.item();
    if (!n) return;
    const text = `${n.title.es}`.slice(0, 230);
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.link)}`,
      '_blank',
      'noopener',
    );
  }

  async publishAll(): Promise<void> {
    this.openX();
    await this.publish(['facebook', 'instagram']);
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.caption);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* el navegador no dejó copiar */
    }
  }
}
