import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryGroup, AdUser } from './active-directory.model';
import { UsuarioRedContratosPanelComponent } from './usuario-red-contratos-panel.component';

@Component({
  selector: 'app-ad-user-detail',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, SectionCardComponent, UsuarioRedContratosPanelComponent],
  template: `
    <ng-container *ngIf="user">
      <section class="identity-band">
        <div class="avatar">{{ initials }}</div>
        <div class="identity-main">
          <h3>{{ user.displayName || user.samAccountName }}</h3>
          <span>{{ user.userPrincipalName || user.samAccountName }}</span>
          <span *ngIf="user.organizationalUnit">{{ user.organizationalUnit }}</span>
        </div>
        <div class="identity-side">
          <div class="state-chips">
            <app-status-badge [label]="user.enabled ? 'Habilitado' : 'Deshabilitado'" [tone]="user.enabled ? 'success' : 'neutral'" />
            <app-status-badge [label]="user.locked ? 'Bloqueado' : 'Sin bloqueo'" [tone]="user.locked ? 'danger' : 'success'" />
          </div>
          <button type="button" class="btn btn-primary" *ngIf="showManage" (click)="manage.emit(user.samAccountName)">
            Editar usuario
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      <section class="detail-sections">
        <app-section-card title="Perfil">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <div class="detail-grid">
            <div class="detail-field"><span class="detail-label">Correo</span><span class="detail-value">{{ user.mail || 'No registrado' }}</span></div>
            <div class="detail-field"><span class="detail-label">Area</span><span class="detail-value">{{ user.department || 'No registrada' }}</span></div>
            <div class="detail-field"><span class="detail-label">Cargo</span><span class="detail-value">{{ user.title || 'No registrado' }}</span></div>
            <div class="detail-field"><span class="detail-label">Oficina</span><span class="detail-value">{{ user.office || 'No registrada' }}</span></div>
            <div class="detail-field"><span class="detail-label">Telefono</span><span class="detail-value">{{ user.telephoneNumber || 'No registrado' }}</span></div>
            <div class="detail-field"><span class="detail-label">Celular</span><span class="detail-value">{{ user.mobile || 'No registrado' }}</span></div>
          </div>
        </app-section-card>

        <app-section-card title="Actividad de la cuenta">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <div class="detail-grid">
            <div class="detail-field"><span class="detail-label">Ultimo inicio</span><span class="detail-value">{{ user.lastLogonTimestamp || 'Sin registro' }}</span></div>
            <div class="detail-field"><span class="detail-label">Clave cambiada</span><span class="detail-value">{{ user.pwdLastSet || 'Sin registro' }}</span></div>
            <div class="detail-field"><span class="detail-label">Vence cuenta</span><span class="detail-value">{{ user.accountExpires || 'Sin registro' }}</span></div>
            <div class="detail-field"><span class="detail-label">Intentos fallidos</span><span class="detail-value">{{ user.badPwdCount || '0' }}</span></div>
            <div class="detail-field"><span class="detail-label">Creado</span><span class="detail-value">{{ user.whenCreated || 'Sin registro' }}</span></div>
            <div class="detail-field"><span class="detail-label">Actualizado</span><span class="detail-value">{{ user.whenChanged || 'Sin registro' }}</span></div>
          </div>
        </app-section-card>

        <app-section-card title="Grupos" class="groups-card">
          <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div class="group-chips" *ngIf="groups.length; else noGroups">
            <span class="group-chip" *ngFor="let group of groups">{{ group.cn }}</span>
          </div>
          <ng-template #noGroups><p class="muted">Sin grupos cargados.</p></ng-template>
        </app-section-card>

        <app-usuario-red-contratos-panel [usuario]="user.samAccountName" [editable]="puedeEditarContratos" />
      </section>
    </ng-container>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdUserDetailComponent implements OnChanges {
  private adService = inject(ActiveDirectoryService);

  @Input({ required: true }) user: AdUser | null = null;
  @Input() showManage = false;
  @Input() puedeEditarContratos = false;
  @Output() manage = new EventEmitter<string>();

  groups: ActiveDirectoryGroup[] = [];

  get initials(): string {
    if (!this.user) return '';
    const name = this.user.displayName?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return this.user.samAccountName.slice(0, 2).toUpperCase();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.adService.getUserGroups(this.user.samAccountName).subscribe({
        next: (groups) => (this.groups = groups),
        error: () => (this.groups = []),
      });
    }
  }
}
