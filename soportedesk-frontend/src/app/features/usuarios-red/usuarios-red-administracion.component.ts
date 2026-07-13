import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryDashboard, AdPanelResult, AdSyncStatus, AdUser, AdUserSummary } from './active-directory.model';
import { AdAdminSummaryComponent } from './ad-admin-summary.component';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { AdUserSearchComponent } from './ad-user-search.component';
import { AdCreateUserPanelComponent } from './ad-create-user-panel.component';
import { AdResetPasswordPanelComponent } from './ad-reset-password-panel.component';
import { AdGroupsPanelComponent } from './ad-groups-panel.component';
import { AdMoveOuPanelComponent } from './ad-move-ou-panel.component';
import { AdEditInfoPanelComponent } from './ad-edit-info-panel.component';

type Panel = 'create' | 'password' | 'groups' | 'ou' | 'info' | null;

@Component({
  selector: 'app-usuarios-red-administracion',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    AdAdminSummaryComponent,
    AdUserSearchComponent,
    AdUserDetailComponent,
    AdCreateUserPanelComponent,
    AdResetPasswordPanelComponent,
    AdGroupsPanelComponent,
    AdMoveOuPanelComponent,
    AdEditInfoPanelComponent,
  ],
  template: `
    <div class="usuarios-red-page">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Sincronización con Active Directory</strong>
          <span>{{ lastSyncLabel() }}</span>
        </div>
        <div class="module-dash-actions">
          <button type="button" class="module-dash-refresh" (click)="startSync()" [disabled]="syncStatus?.running">
            <span class="module-dash-refresh-icon" aria-hidden="true"></span>
            {{ syncStatus?.running ? 'Sincronizando' : 'Sincronizar AD' }}
          </button>
        </div>
      </div>

      <div class="module-dash-progress" *ngIf="syncStatus?.running">
        <div class="module-dash-progress-row">
          <span>{{ syncProgressLabel() }}</span>
          <strong>{{ syncPercent() }}%</strong>
          <div class="module-dash-track" [class.indeterminate]="!syncStatus!.total">
            <i [style.width.%]="syncPercent()"></i>
          </div>
        </div>
      </div>

      <app-ad-admin-summary [dashboard]="dashboard" />

      <section class="actions-grid admin-primary-actions">
        <button type="button" class="action-card create" (click)="openPanel('create')">
          <span class="action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6" /><path d="M23 11h-6" />
            </svg>
          </span>
          <strong>Crear usuario de red</strong>
          <small>Alta directa en Active Directory</small>
        </button>
      </section>

      <app-ad-user-search (selected)="selectUser($event)" />

      <div class="notice" [class.error]="notice.tone === 'error'" [class.success]="notice.tone === 'success'" *ngIf="notice">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ notice.text }}
      </div>

      <section class="empty-state" *ngIf="!user">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <strong>Selecciona una cuenta de red</strong>
        <span>También puedes llegar aquí desde Consultas o Dashboard con un usuario precargado.</span>
      </section>

      <ng-container *ngIf="user">
        <app-ad-user-detail [user]="user" [puedeEditarContratos]="true" />

        <section class="actions-grid">
          <button type="button" class="action-card" (click)="openPanel('password')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" />
              </svg>
            </span>
            <strong>Restablecer clave</strong>
            <small>Clave temporal y cambio obligatorio</small>
          </button>
          <button type="button" class="action-card" (click)="unlock()" [disabled]="working || !user.locked">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            </span>
            <strong>Desbloquear</strong>
            <small>Libera bloqueo por intentos fallidos</small>
          </button>
          <button type="button" class="action-card" [class.danger]="user.enabled" (click)="toggleEnabled()" [disabled]="working">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </span>
            <strong>{{ user.enabled ? 'Deshabilitar' : 'Habilitar' }}</strong>
            <small>Control de acceso al dominio</small>
          </button>
          <button type="button" class="action-card" (click)="openPanel('groups')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <strong>Grupos</strong>
            <small>Agregar o quitar membresías</small>
          </button>
          <button type="button" class="action-card" (click)="openPanel('ou')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <strong>Mover OU</strong>
            <small>Reubicar la cuenta en AD</small>
          </button>
          <button type="button" class="action-card" (click)="openPanel('info')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </span>
            <strong>Editar datos</strong>
            <small>Contacto, cargo y descripcion</small>
          </button>
        </section>
      </ng-container>
    </div>

    <app-modal title="Crear usuario de red" size="wide" [open]="activePanel === 'create'" (closed)="closePanel()">
      <app-ad-create-user-panel *ngIf="activePanel === 'create'" (saved)="onPanelSaved($event)" (cancelled)="closePanel()" />
    </app-modal>

    <app-modal title="Restablecer contraseña" [open]="activePanel === 'password'" (closed)="closePanel()">
      <app-ad-reset-password-panel *ngIf="activePanel === 'password' && user" [samAccountName]="user.samAccountName" (saved)="onPanelSaved($event)" (cancelled)="closePanel()" />
    </app-modal>

    <app-modal title="Membresias de grupos" [open]="activePanel === 'groups'" (closed)="closePanel()">
      <app-ad-groups-panel *ngIf="activePanel === 'groups' && user" [samAccountName]="user.samAccountName" (changed)="onPanelChanged($event)" />
    </app-modal>

    <app-modal title="Mover a unidad organizativa" [open]="activePanel === 'ou'" (closed)="closePanel()">
      <app-ad-move-ou-panel *ngIf="activePanel === 'ou' && user" [samAccountName]="user.samAccountName" (saved)="onPanelSaved($event)" />
    </app-modal>

    <app-modal title="Editar informacion AD" size="wide" [open]="activePanel === 'info'" (closed)="closePanel()">
      <app-ad-edit-info-panel *ngIf="activePanel === 'info' && user" [user]="user" (saved)="onPanelSaved($event)" (cancelled)="closePanel()" />
    </app-modal>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class UsuariosRedAdministracionComponent implements OnInit, OnDestroy {
  private adService = inject(ActiveDirectoryService);
  private route = inject(ActivatedRoute);

  dashboard: ActiveDirectoryDashboard | null = null;
  syncStatus: AdSyncStatus | null = null;
  user: AdUser | null = null;
  activePanel: Panel = null;
  working = false;
  notice: { tone: 'success' | 'error' | 'info'; text: string } | null = null;
  private syncPollSub?: Subscription;

  ngOnInit(): void {
    this.loadDashboard();
    this.checkSyncStatus();
    this.route.queryParamMap.subscribe((params) => {
      const sam = params.get('sam');
      if (sam) this.loadUser(sam);
    });
  }

  ngOnDestroy(): void {
    this.syncPollSub?.unsubscribe();
  }

  loadDashboard(): void {
    this.adService.getDashboard().subscribe({
      next: (dashboard) => (this.dashboard = dashboard),
      error: () => (this.dashboard = null),
    });
  }

  startSync(): void {
    this.adService.startSync().subscribe({
      next: (status) => {
        this.syncStatus = status;
        this.pollSyncStatus();
      },
      error: () => this.flash('error', 'No se pudo iniciar la sincronizacion.'),
    });
  }

  syncPercent(): number {
    const total = this.syncStatus?.total ?? 0;
    const procesados = this.syncStatus?.procesados ?? 0;
    return total > 0 ? Math.min(100, Math.round((procesados / total) * 100)) : 0;
  }

  syncProgressLabel(): string {
    const total = this.syncStatus?.total ?? 0;
    const procesados = this.syncStatus?.procesados ?? 0;
    return total > 0 ? `${procesados} de ${total} usuarios` : 'Calculando el total de cuentas...';
  }

  lastSyncLabel(): string {
    const fecha = this.syncStatus?.ultimoResultado?.sincronizadoEn;
    return fecha ? `Última sincronización: ${new Date(fecha).toLocaleString('es-PE')}` : 'Nunca sincronizado en esta sesión.';
  }

  private checkSyncStatus(): void {
    this.adService.getSyncStatus().subscribe({
      next: (status) => {
        this.syncStatus = status;
        if (status.running) {
          this.pollSyncStatus();
        }
      },
      error: () => {},
    });
  }

  private pollSyncStatus(): void {
    this.syncPollSub?.unsubscribe();
    this.syncPollSub = interval(1500)
      .pipe(
        switchMap(() => this.adService.getSyncStatus()),
        takeWhile((status) => status.running, true),
      )
      .subscribe({
        next: (status) => {
          this.syncStatus = status;
          if (!status.running) {
            this.loadDashboard();
            if (status.error) {
              this.flash('error', `Error sincronizando: ${status.error}`);
            } else if (status.ultimoResultado) {
              this.flash('success', `${status.ultimoResultado.usuariosSincronizados} usuarios sincronizados desde AD.`);
            }
          }
        },
        error: () => this.flash('error', 'No se pudo consultar el estado de sincronizacion.'),
      });
  }

  selectUser(summary: AdUserSummary): void {
    this.loadUser(summary.samAccountName);
  }

  openPanel(panel: Panel): void {
    if (panel !== 'create' && !this.user) return;
    this.activePanel = panel;
    this.notice = null;
  }

  closePanel(): void {
    this.activePanel = null;
  }

  onPanelSaved(result: AdPanelResult): void {
    this.user = result.user;
    this.loadDashboard();
    this.closePanel();
    this.flash(result.notice.tone, result.notice.text);
  }

  onPanelChanged(result: AdPanelResult): void {
    this.user = result.user;
    this.loadDashboard();
    this.flash(result.notice.tone, result.notice.text);
  }

  unlock(): void {
    if (!this.user) return;
    this.runAction(this.adService.unlockUser(this.user.samAccountName));
  }

  toggleEnabled(): void {
    if (!this.user) return;
    const request = this.user.enabled
      ? this.adService.disableUser(this.user.samAccountName)
      : this.adService.enableUser(this.user.samAccountName);
    this.runAction(request);
  }

  private loadUser(sam: string): void {
    this.notice = null;
    this.adService.getUser(sam).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.user = null;
          this.flash('error', response.message || 'Usuario no encontrado.');
          return;
        }
        this.user = response.data;
        this.flash('success', response.message);
      },
      error: () => {
        this.user = null;
        this.flash('error', 'No se pudo consultar Active Directory.');
      },
    });
  }

  private runAction(request: ReturnType<ActiveDirectoryService['unlockUser']>): void {
    this.working = true;
    request.subscribe({
      next: (response) => {
        this.working = false;
        if (response.success) {
          if (response.data) {
            this.user = response.data;
          } else if (this.user) {
            this.loadUser(this.user.samAccountName);
          }
          this.loadDashboard();
          this.flash('success', response.message);
        } else {
          this.flash('error', response.message);
        }
      },
      error: () => {
        this.working = false;
        this.flash('error', 'No se pudo completar la acción.');
      },
    });
  }

  private flash(tone: 'success' | 'error' | 'info', text: string): void {
    this.notice = { tone, text };
  }
}
