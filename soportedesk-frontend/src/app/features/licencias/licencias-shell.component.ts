import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-licencias-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-page licencias-page">
      <div class="module-header"><div><span class="module-eyebrow">Activos de software</span><h2>Licencias</h2><p>Consulta, administración y métricas de compras, activaciones y unidades.</p></div></div>
      <nav class="ad-tabs" aria-label="Licencias">
        <a routerLink="consultas" routerLinkActive="active">Consultas</a>
        <a *ngIf="canWrite" routerLink="administracion" routerLinkActive="active">Administración</a>
        <a *ngIf="canWrite" routerLink="dashboard" routerLinkActive="active">Dashboard</a>
      </nav>
      <router-outlet />
    </div>`,
  styleUrl: './licencias-list.component.scss',
})
export class LicenciasShellComponent {
  private auth = inject(AuthService);
  get canWrite(): boolean { return this.auth.canWrite('licencias'); }
}
