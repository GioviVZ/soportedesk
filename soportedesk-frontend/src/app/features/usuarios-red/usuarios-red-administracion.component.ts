import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ActiveDirectoryService } from './active-directory.service';
import {
  ActiveDirectoryDashboard,
  ActiveDirectoryGroup,
  ActiveDirectoryOu,
  ActiveDirectoryResponse,
  AdSyncStatus,
  AdUser,
  AdUserSummary,
  CreateAdUserRequest,
  UpdateUserInfoRequest,
} from './active-directory.model';
import { AdKpisComponent } from './ad-kpis.component';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { AdUserSearchComponent } from './ad-user-search.component';

type Panel = 'create' | 'password' | 'groups' | 'ou' | 'info' | null;

@Component({
  selector: 'app-usuarios-red-administracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AdKpisComponent, AdUserSearchComponent, AdUserDetailComponent],
  template: `
    <div class="usuarios-red-page">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Sincronizacion con Active Directory</strong>
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

      <app-ad-kpis [dashboard]="dashboard" />

      <section class="actions-grid admin-primary-actions">
        <button type="button" class="action-card create" (click)="openCreatePanel()">
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
        <span>Tambien puedes llegar aqui desde Consultas o Dashboard con un usuario precargado.</span>
      </section>

      <ng-container *ngIf="user">
        <app-ad-user-detail [user]="user" />

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
            <small>Agregar o quitar membresias</small>
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
      <form class="modal-form form-grid" (ngSubmit)="createUser()">
        <div class="notice full" [class.error]="notice.tone === 'error'" [class.success]="notice.tone === 'success'" *ngIf="notice && activePanel === 'create'">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ notice.text }}
        </div>
        <div class="field">
          <label>Usuario</label>
          <input name="createSam" [(ngModel)]="createForm.samAccountName" (ngModelChange)="onCreateSamChanged($event)" required minlength="2" pattern="[A-Za-z0-9._-]+" />
        </div>
        <div class="field">
          <label>Contrasena temporal</label>
          <input type="password" name="createPassword" [(ngModel)]="createForm.temporaryPassword" minlength="8" required />
        </div>
        <div class="field">
          <label>Nombres</label>
          <input name="createGivenName" [(ngModel)]="createForm.givenName" required />
        </div>
        <div class="field">
          <label>Apellidos</label>
          <input name="createSurname" [(ngModel)]="createForm.surname" required />
        </div>
        <div class="field">
          <label>Nombre mostrado</label>
          <input name="createDisplayName" [(ngModel)]="createForm.displayName" />
        </div>
        <div class="field">
          <label>Correo</label>
          <input type="email" name="createMail" [(ngModel)]="createForm.mail" />
        </div>
        <div class="field">
          <label>UPN</label>
          <input name="createUpn" [(ngModel)]="createForm.userPrincipalName" (ngModelChange)="onCreateUpnChanged($event)" placeholder="usuario@inia.local" />
        </div>
        <div class="field">
          <label>Cargo</label>
          <input name="createTitle" [(ngModel)]="createForm.title" />
        </div>
        <div class="field">
          <label>Area</label>
          <input name="createDepartment" [(ngModel)]="createForm.department" />
        </div>
        <div class="field">
          <label>Oficina</label>
          <input name="createOffice" [(ngModel)]="createForm.office" />
        </div>
        <div class="field">
          <label>Telefono</label>
          <input name="createPhone" [(ngModel)]="createForm.telephoneNumber" />
        </div>
        <div class="field">
          <label>Celular</label>
          <input name="createMobile" [(ngModel)]="createForm.mobile" />
        </div>

        <div class="field full">
          <label>Unidad organizativa destino</label>
          <div class="inline-search">
            <input name="createOuSearch" [(ngModel)]="createOuSearch" placeholder="Buscar OU" (keyup.enter)="searchCreateOus()" />
            <button type="button" class="btn btn-ghost" (click)="searchCreateOus()">Buscar</button>
          </div>
          <div class="selected-dn" *ngIf="createForm.ouDestinoDn">{{ createForm.ouDestinoDn }}</div>
          <div class="pick-list" *ngIf="createOuResults.length">
            <button type="button" *ngFor="let ou of createOuResults" (click)="selectCreateOu(ou)">
              <strong>{{ ou.name }}</strong>
              <span>{{ ou.dn }}</span>
            </button>
          </div>
        </div>

        <div class="field full">
          <label>Descripcion</label>
          <textarea name="createDescription" rows="2" [(ngModel)]="createForm.description"></textarea>
        </div>

        <label class="checkbox-field">
          <input type="checkbox" name="createEnabled" [(ngModel)]="createForm.enabled" />
          Habilitar cuenta al crearla
        </label>
        <label class="checkbox-field">
          <input type="checkbox" name="createForceChange" [(ngModel)]="createForm.forceChange" />
          Exigir cambio al iniciar sesion
        </label>

        <footer class="modal-actions full">
          <button type="button" class="btn btn-ghost" (click)="closePanel()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="working">Crear en AD</button>
        </footer>
      </form>
    </app-modal>

    <app-modal title="Restablecer contrasena" [open]="activePanel === 'password'" (closed)="closePanel()">
      <form class="modal-form" (ngSubmit)="resetPassword()">
        <div class="field">
          <label>Contrasena temporal</label>
          <input type="password" name="newPassword" [(ngModel)]="newPassword" minlength="8" required />
        </div>
        <label class="checkbox-field">
          <input type="checkbox" name="forceChange" [(ngModel)]="forceChange" />
          Exigir cambio al iniciar sesion
        </label>
        <footer class="modal-actions">
          <button type="button" class="btn btn-ghost" (click)="closePanel()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="working">Guardar</button>
        </footer>
      </form>
    </app-modal>

    <app-modal title="Membresias de grupos" [open]="activePanel === 'groups'" (closed)="closePanel()">
      <div class="modal-form">
        <div class="inline-search">
          <input name="groupSearch" [(ngModel)]="groupSearch" placeholder="Buscar grupo" (keyup.enter)="searchGroups()" />
          <button type="button" class="btn btn-ghost" (click)="searchGroups()">Buscar</button>
        </div>
        <div class="pick-list" *ngIf="groupResults.length">
          <button type="button" *ngFor="let group of groupResults" (click)="addSelectedGroup(group.dn)">
            <strong>{{ group.cn }}</strong>
            <span>{{ group.description || group.dn }}</span>
          </button>
        </div>
        <div class="assigned-list" *ngIf="groups.length">
          <div *ngFor="let group of groups">
            <span>{{ group.cn }}</span>
            <button type="button" class="link-danger" (click)="removeGroup(group.dn)">Quitar</button>
          </div>
        </div>
      </div>
    </app-modal>

    <app-modal title="Mover a unidad organizativa" [open]="activePanel === 'ou'" (closed)="closePanel()">
      <div class="modal-form">
        <div class="inline-search">
          <input name="ouSearch" [(ngModel)]="ouSearch" placeholder="Buscar OU" (keyup.enter)="searchOus()" />
          <button type="button" class="btn btn-ghost" (click)="searchOus()">Buscar</button>
        </div>
        <div class="pick-list" *ngIf="ouResults.length">
          <button type="button" *ngFor="let ou of ouResults" (click)="moveToOu(ou.dn)">
            <strong>{{ ou.name }}</strong>
            <span>{{ ou.dn }}</span>
          </button>
        </div>
      </div>
    </app-modal>

    <app-modal title="Editar informacion AD" size="wide" [open]="activePanel === 'info'" (closed)="closePanel()">
      <form class="modal-form form-grid" (ngSubmit)="saveInfo()">
        <div class="field"><label>Nombre mostrado</label><input name="displayName" [(ngModel)]="infoForm.displayName" /></div>
        <div class="field"><label>Cargo</label><input name="title" [(ngModel)]="infoForm.title" /></div>
        <div class="field"><label>Area</label><input name="department" [(ngModel)]="infoForm.department" /></div>
        <div class="field"><label>Oficina</label><input name="office" [(ngModel)]="infoForm.office" /></div>
        <div class="field"><label>Telefono</label><input name="telephoneNumber" [(ngModel)]="infoForm.telephoneNumber" /></div>
        <div class="field"><label>Celular</label><input name="mobile" [(ngModel)]="infoForm.mobile" /></div>
        <div class="field"><label>Correo</label><input name="mail" [(ngModel)]="infoForm.mail" /></div>
        <div class="field full"><label>Descripcion</label><textarea name="description" rows="3" [(ngModel)]="infoForm.description"></textarea></div>
        <footer class="modal-actions full">
          <button type="button" class="btn btn-ghost" (click)="closePanel()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="working">Guardar</button>
        </footer>
      </form>
    </app-modal>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class UsuariosRedAdministracionComponent implements OnInit, OnDestroy {
  private adService = inject(ActiveDirectoryService);
  private route = inject(ActivatedRoute);
  private readonly adDomain = 'inia.local';

  dashboard: ActiveDirectoryDashboard | null = null;
  syncStatus: AdSyncStatus | null = null;
  user: AdUser | null = null;
  groups: ActiveDirectoryGroup[] = [];
  groupResults: ActiveDirectoryGroup[] = [];
  ouResults: ActiveDirectoryOu[] = [];
  groupSearch = '';
  ouSearch = '';
  createOuSearch = '';
  newPassword = '';
  forceChange = true;
  activePanel: Panel = null;
  working = false;
  notice: { tone: 'success' | 'error' | 'info'; text: string } | null = null;
  infoForm: UpdateUserInfoRequest = {};
  createForm: CreateAdUserRequest = this.emptyCreateForm();
  createOuResults: ActiveDirectoryOu[] = [];
  private createUpnEdited = false;
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
    return fecha ? `Ultima sincronizacion: ${new Date(fecha).toLocaleString('es-PE')}` : 'Nunca sincronizado en esta sesion.';
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

  openCreatePanel(): void {
    this.resetCreateForm();
    this.openPanel('create');
  }

  closePanel(): void {
    const panel = this.activePanel;
    this.activePanel = null;
    this.newPassword = '';
    this.groupSearch = '';
    this.ouSearch = '';
    if (panel === 'create') {
      this.resetCreateForm();
    }
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

  resetPassword(): void {
    if (!this.user || !this.newPassword.trim()) {
      this.flash('error', 'Ingresa una contrasena temporal.');
      return;
    }
    this.runAction(this.adService.resetPassword(this.user.samAccountName, this.newPassword.trim(), this.forceChange), true);
  }

  createUser(): void {
    this.ensureCreateUpn();
    const request = this.normalizedCreateRequest();
    if (!request.samAccountName || !request.givenName || !request.surname || !request.temporaryPassword || !request.ouDestinoDn) {
      this.flash('error', 'Completa usuario, nombres, apellidos, contrasena temporal y OU destino.');
      return;
    }
    if (request.temporaryPassword.length < 8) {
      this.flash('error', 'La contrasena temporal debe tener al menos 8 caracteres.');
      return;
    }
    this.runAction(this.adService.createUser(request), true);
  }

  saveInfo(): void {
    if (!this.user) return;
    this.runAction(this.adService.updateInfo(this.user.samAccountName, this.infoForm), true);
  }

  searchGroups(): void {
    const term = this.groupSearch.trim();
    if (term.length < 2) return;
    this.adService.searchGroups(term).subscribe((groups) => (this.groupResults = groups));
  }

  addSelectedGroup(groupDn: string): void {
    if (!this.user || !groupDn) return;
    this.runAction(this.adService.addGroup(this.user.samAccountName, groupDn), true, () => this.loadGroups());
  }

  removeGroup(groupDn: string): void {
    if (!this.user || !groupDn) return;
    this.runAction(this.adService.removeGroup(this.user.samAccountName, groupDn), false, () => this.loadGroups());
  }

  searchOus(): void {
    const term = this.ouSearch.trim();
    if (term.length < 2) return;
    this.adService.searchOus(term).subscribe((ous) => (this.ouResults = ous));
  }

  searchCreateOus(): void {
    const term = this.createOuSearch.trim();
    if (term.length < 2) return;
    this.adService.searchOus(term).subscribe((ous) => (this.createOuResults = ous));
  }

  selectCreateOu(ou: ActiveDirectoryOu): void {
    this.createForm.ouDestinoDn = ou.dn;
    this.createOuSearch = ou.name;
    this.createOuResults = [];
  }

  onCreateSamChanged(value: string): void {
    this.createForm.samAccountName = value;
    if (!this.createUpnEdited) {
      this.createForm.userPrincipalName = this.generatedUpn(value);
    }
  }

  onCreateUpnChanged(value: string): void {
    this.createForm.userPrincipalName = value;
    this.createUpnEdited = !!value?.trim() && value.trim() !== this.generatedUpn(this.createForm.samAccountName);
  }

  moveToOu(ouDn: string): void {
    if (!this.user || !ouDn) return;
    this.runAction(this.adService.moveUser(this.user.samAccountName, ouDn), true);
  }

  private loadUser(sam: string): void {
    this.notice = null;
    this.adService.getUser(sam).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.user = null;
          this.groups = [];
          this.flash('error', response.message || 'Usuario no encontrado.');
          return;
        }
        this.user = response.data;
        this.syncInfoForm(response.data);
        this.loadGroups();
        this.flash('success', response.message);
      },
      error: () => {
        this.user = null;
        this.groups = [];
        this.flash('error', 'No se pudo consultar Active Directory.');
      },
    });
  }

  private loadGroups(): void {
    if (!this.user) return;
    this.adService.getUserGroups(this.user.samAccountName).subscribe((groups) => (this.groups = groups));
  }

  private runAction(
    request: Observable<ActiveDirectoryResponse<AdUser>>,
    close = false,
    after?: () => void,
  ): void {
    this.working = true;
    request.subscribe({
      next: (response) => {
        this.working = false;
        if (response.success) {
          if (response.data) {
            this.user = response.data;
            this.syncInfoForm(response.data);
            this.loadGroups();
          } else if (this.user) {
            this.loadUser(this.user.samAccountName);
          }
          after?.();
          this.loadDashboard();
          if (close) this.closePanel();
          this.flash('success', response.message);
        } else {
          this.flash('error', response.message);
        }
      },
      error: () => {
        this.working = false;
        this.flash('error', 'No se pudo completar la accion.');
      },
    });
  }

  private syncInfoForm(user: AdUser): void {
    this.infoForm = {
      displayName: user.displayName,
      title: user.title,
      department: user.department,
      office: user.office,
      telephoneNumber: user.telephoneNumber,
      mobile: user.mobile,
      mail: user.mail,
      description: user.description,
    };
  }

  private emptyCreateForm(): CreateAdUserRequest {
    return {
      samAccountName: '',
      givenName: '',
      surname: '',
      displayName: '',
      mail: '',
      userPrincipalName: '',
      temporaryPassword: '',
      ouDestinoDn: '',
      title: '',
      department: '',
      office: '',
      telephoneNumber: '',
      mobile: '',
      description: '',
      enabled: true,
      forceChange: true,
    };
  }

  private resetCreateForm(): void {
    this.createForm = this.emptyCreateForm();
    this.createOuSearch = '';
    this.createOuResults = [];
    this.createUpnEdited = false;
  }

  private normalizedCreateRequest(): CreateAdUserRequest {
    return {
      samAccountName: this.createForm.samAccountName.trim(),
      givenName: this.createForm.givenName.trim(),
      surname: this.createForm.surname.trim(),
      displayName: this.blankToNull(this.createForm.displayName),
      mail: this.blankToNull(this.createForm.mail),
      userPrincipalName: this.blankToNull(this.createForm.userPrincipalName),
      temporaryPassword: this.createForm.temporaryPassword,
      ouDestinoDn: this.createForm.ouDestinoDn.trim(),
      title: this.blankToNull(this.createForm.title),
      department: this.blankToNull(this.createForm.department),
      office: this.blankToNull(this.createForm.office),
      telephoneNumber: this.blankToNull(this.createForm.telephoneNumber),
      mobile: this.blankToNull(this.createForm.mobile),
      description: this.blankToNull(this.createForm.description),
      enabled: this.createForm.enabled,
      forceChange: this.createForm.forceChange,
    };
  }

  private blankToNull(value: string | null | undefined): string | null {
    return value?.trim() ? value.trim() : null;
  }

  private ensureCreateUpn(): void {
    if (!this.createForm.userPrincipalName?.trim()) {
      this.createForm.userPrincipalName = this.generatedUpn(this.createForm.samAccountName);
    }
  }

  private generatedUpn(value: string | null | undefined): string {
    const sam = value?.trim();
    return sam ? `${sam}@${this.adDomain}` : '';
  }

  private flash(tone: 'success' | 'error' | 'info', text: string): void {
    this.notice = { tone, text };
  }
}
