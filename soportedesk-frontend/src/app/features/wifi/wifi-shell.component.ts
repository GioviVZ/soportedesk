
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-wifi-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="module-page wifi-page">
      <div class="module-header"><div><span class="module-eyebrow">Conectividad</span><h2>WiFi</h2><p>Consulta, administración y panorama de las redes inalámbricas institucionales.</p></div></div>
      <nav class="ad-tabs" aria-label="WiFi">
        <a routerLink="consultas" routerLinkActive="active">Consultas</a>
        @if (canWrite) {
          <a routerLink="administracion" routerLinkActive="active">Administración</a>
        }
        @if (canWrite) {
          <a routerLink="dashboard" routerLinkActive="active">Dashboard</a>
        }
      </nav>
      <router-outlet />
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './wifi-list.component.scss'
})
export class WifiShellComponent {
  private auth = inject(AuthService);
  get canWrite(): boolean { return this.auth.canWrite('wifi'); }
}
