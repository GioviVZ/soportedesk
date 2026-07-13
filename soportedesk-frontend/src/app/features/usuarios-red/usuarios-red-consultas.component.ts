import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdUser } from './active-directory.model';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { UsuarioRedConsultaResultado } from './usuario-red-contrato.model';
import { UsuarioRedContratoService } from './usuario-red-contrato.service';

@Component({
  selector: 'app-usuarios-red-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SectionCardComponent, VencimientoBadgeComponent, AdUserDetailComponent],
  template: `
    <div class="usuarios-red-page consultas-page">
      <section class="consulta-panel">
        <form class="consulta-search" (ngSubmit)="buscar()">
          <div class="consulta-input">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="termino"
              [(ngModel)]="termino"
              placeholder="Nombre, usuario, contrato, oficina o sin nombre"
              autocomplete="off"
              [disabled]="searching"
            />
            <button type="button" class="consulta-clear" *ngIf="termino" (click)="limpiar()" aria-label="Limpiar busqueda">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <button type="submit" class="btn btn-primary consulta-submit" [disabled]="!canSearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
            Buscar
          </button>
        </form>

        <div class="consulta-toolbar" *ngIf="searched || searchError">
          <span *ngIf="searching">Buscando...</span>
          <span *ngIf="!searching && !searchError">{{ resultados.length }} resultado{{ resultados.length === 1 ? '' : 's' }}</span>
          <span class="toolbar-error" *ngIf="searchError">{{ searchError }}</span>
        </div>
      </section>

      <section class="consulta-results" *ngIf="resultados.length">
        <button
          type="button"
          class="consulta-card"
          *ngFor="let item of resultados; trackBy: trackByResultado"
          [class.no-ad]="!tieneFichaAd(item)"
          (click)="abrirResultado(item)"
        >
          <span class="consulta-avatar">{{ initials(item) }}</span>

          <span class="consulta-card-main">
            <span class="consulta-card-head">
              <strong>{{ item.displayName || item.usuario || 'Sin nombre' }}</strong>
              <span class="consulta-badges">
                <span class="mini-badge warning" *ngIf="!item.displayName">Sin nombre</span>
                <span class="mini-badge" [class.success]="item.enabled === true" [class.neutral]="item.enabled === false" *ngIf="item.enabled !== null">
                  {{ item.enabled ? 'Habilitado' : 'Deshabilitado' }}
                </span>
                <span class="mini-badge danger" *ngIf="item.locked">Bloqueado</span>
                <span class="mini-badge" [class.danger]="item.estadoVencimientoUsuarioRed === 'VENCIDO'" [class.warning]="item.estadoVencimientoUsuarioRed === 'POR_VENCER'" [class.success]="item.estadoVencimientoUsuarioRed === 'VIGENTE'" *ngIf="item.vencimientoUsuarioRed">
                  Red vence {{ item.vencimientoUsuarioRed | date:'dd/MM/yyyy' }}
                </span>
                <span class="mini-badge warning" *ngIf="!tieneFichaAd(item)">Sin ficha AD</span>
              </span>
            </span>

            <span class="consulta-meta">
              <span>{{ item.usuario || 'Sin usuario' }}</span>
              <span *ngIf="item.mail">{{ item.mail }}</span>
              <span *ngIf="item.office">{{ item.office }}</span>
              <span *ngIf="item.organizationalUnit">{{ item.organizationalUnit }}</span>
            </span>

            <span class="consulta-contratos" *ngIf="item.contratos.length">
              <span class="contrato-pill" *ngFor="let contrato of item.contratos | slice:0:3">
                <strong>{{ contrato.tipoContratoNombre }}</strong>
                <span *ngIf="contrato.numeroContrato">Nro. {{ contrato.numeroContrato }}</span>
                <span>{{ contrato.fechaInicio | date:'dd/MM/yyyy' }} - {{ contrato.fechaFin ? (contrato.fechaFin | date:'dd/MM/yyyy') : 'Vigente' }}</span>
              </span>
              <span class="more-pill" *ngIf="item.contratos.length > 3">+{{ item.contratos.length - 3 }}</span>
            </span>
          </span>

          <span class="consulta-action">{{ tieneFichaAd(item) ? 'Ver ficha' : 'Ver contrato' }}</span>
        </button>
      </section>

      <div class="empty-state" *ngIf="searched && !searching && !resultados.length && !searchError">
        <strong>Sin resultados</strong>
        <span>{{ terminoBuscado }}</span>
      </div>
    </div>

    <app-modal title="Detalle de usuario" size="wide" [open]="detailOpen" (closed)="closeDetail()">
      <div class="modal-body">
        <div class="notice error" *ngIf="error">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ error }}
        </div>
        <p class="muted" *ngIf="loading">Cargando usuario...</p>
        <app-ad-user-detail
          *ngIf="!loading && selectedUser"
          [user]="selectedUser"
          [showManage]="canWrite"
          [puedeEditarContratos]="false"
          (manage)="goToAdmin($event)"
        />
        <section class="consulta-only-detail" *ngIf="!loading && !selectedUser && selectedConsulta">
          <section class="identity-band">
            <div class="avatar">{{ initials(selectedConsulta) }}</div>
            <div class="identity-main">
              <h3>{{ selectedConsulta.displayName || selectedConsulta.usuario || 'Sin nombre' }}</h3>
              <span>{{ selectedConsulta.usuario || 'Sin usuario de red' }}</span>
              <span>Registro encontrado por contrato, sin ficha AD en la cache local.</span>
            </div>
            <div class="identity-side">
              <span class="mini-badge warning">Sin ficha AD</span>
            </div>
          </section>

          <section class="detail-sections">
            <app-section-card title="Vencimiento de usuario de red">
              <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <div class="detail-grid">
                <div class="detail-field">
                  <span class="detail-label">Fecha limite</span>
                  <span class="detail-value">
                    {{ selectedConsulta.vencimientoUsuarioRed ? (selectedConsulta.vencimientoUsuarioRed | date:'dd/MM/yyyy') : 'Sin fecha fin de contrato' }}
                    <app-vencimiento-badge [fecha]="selectedConsulta.vencimientoUsuarioRed" />
                  </span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Uso operativo</span>
                  <span class="detail-value">Referencia para alerta y desactivacion de la cuenta de red.</span>
                </div>
              </div>
            </app-section-card>

            <app-section-card title="Contratos" class="groups-card">
              <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <div class="assigned-list contrato-list" *ngIf="selectedConsulta.contratos.length; else noContratos">
                <div class="contrato-item" *ngFor="let contrato of selectedConsulta.contratos">
                  <div class="contrato-main">
                    <span class="contrato-tipo">{{ contrato.tipoContratoNombre }}</span>
                    <span class="contrato-fechas">
                      {{ contrato.fechaInicio | date:'dd/MM/yyyy' }} - {{ contrato.fechaFin ? (contrato.fechaFin | date:'dd/MM/yyyy') : 'Actual' }}
                    </span>
                    <span class="contrato-numero" *ngIf="contrato.numeroContrato">Nro. {{ contrato.numeroContrato }}</span>
                    <span class="contrato-personal" *ngIf="contrato.personalNombre || contrato.personalApellidos">
                      Titular: <strong>{{ contrato.personalNombre }} {{ contrato.personalApellidos }}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <ng-template #noContratos><p class="muted">Sin contratos registrados.</p></ng-template>
            </app-section-card>
          </section>
        </section>
      </div>
    </app-modal>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class UsuariosRedConsultasComponent {
  private adService = inject(ActiveDirectoryService);
  private contratoService = inject(UsuarioRedContratoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedUser: AdUser | null = null;
  selectedConsulta: UsuarioRedConsultaResultado | null = null;
  detailOpen = false;
  loading = false;
  error = '';

  termino = '';
  terminoBuscado = '';
  resultados: UsuarioRedConsultaResultado[] = [];
  searching = false;
  searched = false;
  searchError = '';

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  get canSearch(): boolean {
    return this.termino.trim().length >= 2 && !this.searching;
  }

  buscar(): void {
    const term = this.termino.trim();
    if (term.length < 2) {
      this.resultados = [];
      return;
    }

    this.searching = true;
    this.searched = true;
    this.searchError = '';
    this.terminoBuscado = term;

    this.contratoService.buscarConsultas(term)
      .pipe(finalize(() => (this.searching = false)))
      .subscribe({
        next: (resultados) => {
          this.resultados = resultados.map((item) => ({
            ...item,
            contratos: item.contratos ?? [],
            vencimientoUsuarioRed: item.vencimientoUsuarioRed ?? this.vencimientoDesdeContratos(item.contratos ?? []),
            estadoVencimientoUsuarioRed: item.estadoVencimientoUsuarioRed ?? null,
          }));
        },
        error: () => {
          this.resultados = [];
          this.searchError = 'No se pudo realizar la busqueda.';
        },
      });
  }

  limpiar(): void {
    this.termino = '';
    this.terminoBuscado = '';
    this.resultados = [];
    this.searched = false;
    this.searchError = '';
  }

  abrirResultado(item: UsuarioRedConsultaResultado): void {
    this.selectedConsulta = item;
    if (!this.tieneFichaAd(item) || !item.usuario) {
      this.detailOpen = true;
      this.loading = false;
      this.error = '';
      this.selectedUser = null;
      return;
    }
    this.loadUser(item.usuario);
  }

  tieneFichaAd(item: UsuarioRedConsultaResultado): boolean {
    return !!item.usuario && item.enabled !== null && item.enabled !== undefined;
  }

  initials(item: UsuarioRedConsultaResultado): string {
    const value = item.displayName || item.usuario || '?';
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('');
  }

  trackByResultado(index: number, item: UsuarioRedConsultaResultado): string {
    return item.usuario || item.displayName || String(index);
  }

  private vencimientoDesdeContratos(contratos: UsuarioRedConsultaResultado['contratos']): string | null {
    const fechas = contratos
      .map((contrato) => contrato.fechaFin)
      .filter((fecha): fecha is string => !!fecha)
      .sort();
    return fechas.length ? fechas[fechas.length - 1] : null;
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.selectedUser = null;
    this.selectedConsulta = null;
    this.error = '';
  }

  goToAdmin(sam: string): void {
    this.router.navigate(['/usuarios-red/administracion'], { queryParams: { sam } });
  }

  private loadUser(sam: string): void {
    this.detailOpen = true;
    this.loading = true;
    this.error = '';
    this.selectedUser = null;
    this.adService.getUser(sam).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.selectedUser = response.data;
          return;
        }
        this.error = response.message || 'No se pudo cargar el usuario.';
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el usuario.';
      },
    });
  }
}
