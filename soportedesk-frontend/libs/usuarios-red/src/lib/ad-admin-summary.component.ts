
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ActiveDirectoryDashboard } from './active-directory.model';

@Component({
    selector: 'app-ad-admin-summary',
    imports: [],
    template: `
    @if (dashboard) {
      <section class="summary-grid" aria-label="Resumen de cuentas de red">
        <article class="summary-card">
          <span>Total</span>
          <strong>{{ total() }}</strong>
          <small>cuentas en Active Directory</small>
        </article>
        <article class="summary-card success">
          <span>Habilitados</span>
          <strong>{{ dashboard.usuariosHabilitados }}</strong>
          <small>con acceso activo</small>
        </article>
        <article class="summary-card danger">
          <span>Bloqueados</span>
          <strong>{{ dashboard.usuariosBloqueados }}</strong>
          <small>por intentos fallidos</small>
        </article>
        <article class="summary-card warning">
          <span>Deshabilitados</span>
          <strong>{{ dashboard.usuariosDeshabilitados }}</strong>
          <small>cuentas sin acceso</small>
        </article>
      </section>
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './ad-admin-summary.component.scss'
})
export class AdAdminSummaryComponent {
  @Input({ required: true }) dashboard: ActiveDirectoryDashboard | null = null;

  total(): number {
    if (!this.dashboard) return 0;
    return this.dashboard.usuariosHabilitados + this.dashboard.usuariosDeshabilitados;
  }
}
