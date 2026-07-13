import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActiveDirectoryDashboard } from './active-directory.model';

@Component({
  selector: 'app-ad-admin-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="summary-grid" aria-label="Resumen de cuentas de red" *ngIf="dashboard">
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
  `,
  styleUrl: './ad-admin-summary.component.scss',
})
export class AdAdminSummaryComponent {
  @Input({ required: true }) dashboard: ActiveDirectoryDashboard | null = null;

  total(): number {
    if (!this.dashboard) return 0;
    return this.dashboard.usuariosHabilitados + this.dashboard.usuariosDeshabilitados;
  }
}
