import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export interface ModulePlaceholderData {
  eyebrow: string;
  titulo: string;
  descripcion: string;
  icono: string;
  acento: string;
}

@Component({
  selector: 'app-module-placeholder',
  imports: [LowerCasePipe],
  template: `
    <div
      class="module-page"
      [style.--placeholder-accent]="'var(' + data.acento + ')'"
    >
      <div class="module-header">
        <div>
          <span class="module-eyebrow">{{ data.eyebrow }}</span>
          <h2>{{ data.titulo }}</h2>
          <p>{{ data.descripcion }}</p>
        </div>
      </div>
      <section class="proximamente-card" role="status">
        <span class="proximamente-icon">
          <i class="ti {{ data.icono }}" aria-hidden="true"></i>
        </span>
        <h3>Submódulo en preparación</h3>
        <p>
          Este apartado se habilitará en una próxima fase. Aquí podrás registrar,
          consultar y administrar {{ data.titulo | lowercase }}.
        </p>
      </section>
    </div>
  `,
  styles: `
    .proximamente-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 56px 24px;
      border: 1px solid var(--glass-stroke);
      border-radius: 20px;
      background: var(--glass-bg-soft);
      text-align: center;
    }

    .proximamente-icon {
      display: grid;
      place-items: center;
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: color-mix(
        in srgb,
        var(--placeholder-accent, var(--color-primary)) 12%,
        transparent
      );
      color: var(--placeholder-accent, var(--color-primary));
    }

    .proximamente-icon .ti {
      font-size: 30px;
    }

    .proximamente-card h3 {
      margin: 6px 0 0;
      color: var(--color-heading);
      font-size: 16px;
      font-weight: 750;
    }

    .proximamente-card p {
      max-width: 460px;
      margin: 0;
      color: var(--color-text-muted);
      font-size: 13.5px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulePlaceholderComponent {
  readonly data = inject(ActivatedRoute).snapshot.data as ModulePlaceholderData;
}
