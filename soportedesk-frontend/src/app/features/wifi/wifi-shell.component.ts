import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-wifi-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-page wifi-page">
      <div class="module-header"><div><span class="module-eyebrow">Conectividad</span><h2>WiFi</h2><p>Consulta, administración y panorama de las redes inalámbricas institucionales.</p></div></div>
      <nav class="ad-tabs" aria-label="WiFi">
        <a routerLink="consultas" routerLinkActive="active">Consultas</a>
        <a *ngIf="canWrite" routerLink="administracion" routerLinkActive="active">Administración</a>
        <a *ngIf="canWrite" routerLink="dashboard" routerLinkActive="active">Dashboard</a>
      </nav>
      <router-outlet />
    </div>`,
  styleUrl: './wifi-list.component.scss',
})
export class WifiShellComponent {
  private auth = inject(AuthService);
  get canWrite(): boolean { return this.auth.canWrite('wifi'); }
}
