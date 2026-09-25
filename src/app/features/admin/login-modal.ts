import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-login-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  host: { class: 'notranslate', translate: 'no' },
  template: `
    <div class="modal-overlay active" (click)="closed.emit()">
      <div class="modal-box login-box" (click)="$event.stopPropagation()">
        <button class="btn-close" type="button" (click)="closed.emit()">&times;</button>
        <h3>{{ i18n.t('admin') }}</h3>
        <p class="login-hint">{{ i18n.t('adminLoginHint') }}</p>
        @if (error()) {
          <div class="login-error">{{ error() }}</div>
        }
        <form (ngSubmit)="submit()">
          <div class="input-group">
            <label>{{ i18n.t('email') }}</label>
            <input type="email" name="email" [(ngModel)]="email" autocomplete="username" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('password') }}</label>
            <input type="password" name="password" [(ngModel)]="password" autocomplete="current-password" required />
          </div>
          <button class="btn-votar-activo" type="submit" [disabled]="auth.busy()">
            {{ auth.busy() ? i18n.t('signingIn') : i18n.t('enter') }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .login-box { max-width: 380px; text-align: center; padding: 2rem; }
    .login-box h3 { font-size: 1.2rem; margin-bottom: .35rem; }
    .login-hint { font-size: .78rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.4; }
    .login-error { background: #FEE2E2; color: #991B1B; padding: .5rem; border-radius: 4px; font-size: .75rem; margin-bottom: .8rem; }
    @media (max-width: 480px) {
      .login-box { padding: 1.25rem; }
    }
  `,
})
export class LoginModal {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly closed = output();
  readonly error = signal('');
  email = '';
  password = '';

  async submit(): Promise<void> {
    this.error.set('');
    const result = await this.auth.login(this.email, this.password);
    if (result === 'ok') {
      this.password = '';
      this.closed.emit();
      return;
    }
    if (result === 'locked') {
      const seconds = Math.ceil(this.auth.lockedRemainingMs() / 1000) || 60;
      this.error.set(this.i18n.t('loginLocked').replace('{seconds}', String(seconds)));
      return;
    }
    this.error.set(this.i18n.t(result === 'bad' ? 'badLogin' : 'loginError'));
  }
}
