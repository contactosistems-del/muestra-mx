import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-chatbot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <button class="chatbot-float-trigger" type="button" (click)="open.set(!open())" [title]="i18n.t('chatToggle')">
      <i class="fa-solid fa-comments"></i>
    </button>
    @if (open()) {
      <div class="chatbot-window active">
        <div class="chatbot-header">
          <span><i class="fa-solid fa-robot"></i> {{ i18n.t('chatTitle') }}</span>
          <button type="button" (click)="open.set(false)">&times;</button>
        </div>
        <div class="chatbot-body">
          @for (msg of messages(); track $index) {
            <div class="chat-msg" [class.bot]="msg.role === 'bot'" [class.user]="msg.role === 'user'">{{ msg.text }}</div>
          }
        </div>
        <div class="chatbot-footer">
          <input [(ngModel)]="draft" name="chat" [placeholder]="i18n.t('chatPlaceholder')" (keyup.enter)="send()" />
          <button type="button" (click)="send()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    }
  `,
})
export class Chatbot {
  readonly i18n = inject(I18nService);
  readonly open = signal(false);
  readonly messages = signal<{ role: 'bot' | 'user'; text: string }[]>([]);
  draft = '';

  constructor() {
    effect(() => {
      const hello = this.i18n.t('chatHello');
      untracked(() => {
        this.messages.update((list) => (list.length <= 1 ? [{ role: 'bot', text: hello }] : list));
      });
    });
  }

  send(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.draft = '';
    const lower = text.toLowerCase();
    let reply = this.i18n.t('chatThanks');
    if (lower.includes('encuesta') || lower.includes('survey') || lower.includes('voto') || lower.includes('vote')) {
      reply = this.i18n.t('chatSurvey');
    }
    if (lower.includes('contacto') || lower.includes('oficina') || lower.includes('contact') || lower.includes('office')) {
      reply = this.i18n.t('chatContact');
    }
    this.messages.update((list) => [...list, { role: 'user', text }, { role: 'bot', text: reply }]);
  }
}
