import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActiveDirectoryDashboard } from './active-directory.model';

@Component({
  selector: 'app-ad-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="module-stats" *ngIf="dashboard">
      <div class="stat-pill">
        <strong>{{ dashboard.usuariosHabilitados }}</strong>
        <span>Habilitados</span>
      </div>
      <div class="stat-pill tone-danger">
        <strong>{{ dashboard.usuariosBloqueados }}</strong>
        <span>Bloqueados</span>
      </div>
      <div class="stat-pill">
        <strong>{{ dashboard.usuariosDeshabilitados }}</strong>
        <span>Deshabilitados</span>
      </div>
      <div class="stat-pill">
        <strong>{{ dashboard.controladoresDominio }}</strong>
        <span>Controladores</span>
      </div>
    </section>
  `,
  styles: [`
    .stat-pill.tone-danger strong { color: var(--color-danger); }
  `],
})
export class AdKpisComponent {
  @Input({ required: true }) dashboard: ActiveDirectoryDashboard | null = null;
}
