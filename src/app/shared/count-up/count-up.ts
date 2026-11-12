import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';

/** Número que "cuenta" hasta su valor con una animación suave. */
@Component({
  selector: 'app-count-up',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ shown().toLocaleString('es-MX') }}`,
})
export class CountUp {
  readonly value = input.required<number>();
  readonly duration = input(1400);
  readonly shown = signal(0);
  private frame = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
    effect(() => {
      const target = Math.max(0, Math.round(this.value() || 0));
      const from = untracked(this.shown);
      if (typeof requestAnimationFrame === 'undefined' || target === from) {
        this.shown.set(target);
        return;
      }
      cancelAnimationFrame(this.frame);
      const start = performance.now();
      const dur = untracked(this.duration);
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        this.shown.set(Math.round(from + (target - from) * eased));
        if (t < 1) this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    });
  }
}
