import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { FIREBASE_AUTH } from '../../domain/tokens';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  readonly user = signal<User | null>(null);
  readonly isAdmin = signal(false);
  readonly email = signal<string | null>(null);
  readonly busy = signal(false);
  private failedAttempts = 0;
  private lockedUntil = 0;

  constructor() {
    const stop = onAuthStateChanged(this.auth, (user) => {
      this.user.set(user);
      this.isAdmin.set(!!user);
      this.email.set(user?.email ?? null);
    });
    inject(DestroyRef).onDestroy(stop);
  }

  lockedRemainingMs(): number {
    return Math.max(0, this.lockedUntil - Date.now());
  }

  async login(email: string, password: string): Promise<'ok' | 'bad' | 'locked' | 'error'> {
    if (this.lockedRemainingMs() > 0) return 'locked';
    this.busy.set(true);
    try {
      await signInWithEmailAndPassword(this.auth, email.trim(), password);
      this.failedAttempts = 0;
      this.lockedUntil = 0;
      return 'ok';
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      if (code.includes('too-many-requests')) {
        this.lockedUntil = Date.now() + LOCK_MS;
        return 'locked';
      }
      if (
        code.includes('invalid-credential') ||
        code.includes('wrong-password') ||
        code.includes('user-not-found') ||
        code.includes('invalid-email')
      ) {
        this.failedAttempts += 1;
        if (this.failedAttempts >= MAX_ATTEMPTS) {
          this.lockedUntil = Date.now() + LOCK_MS;
          this.failedAttempts = 0;
          return 'locked';
        }
        return 'bad';
      }
      return 'error';
    } finally {
      this.busy.set(false);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
