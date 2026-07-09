import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ActiveDirectoryService } from './active-directory.service';
import {
  ActiveDirectoryDashboard,
  ActiveDirectoryGroup,
  ActiveDirectoryOu,
  AdUser,
  AdUserSummary,
  UpdateUserInfoRequest,
} from './active-directory.model';
import { AdKpisComponent } from './ad-kpis.component';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { AdUserSearchComponent } from './ad-user-search.component';

type Panel = 'password' | 'groups' | 'ou' | 'info' | null;

@Component({
  selector: 'app-usuarios-red-administracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AdKpisComponent, AdUserSearchComponent, AdUserDetailComponent],
  template: `
    <div class="usuarios-red-page">
      <app-ad-kpis [dashboard]="dashboard" />
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
export class UsuariosRedAdministracionComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private route = inject(ActivatedRoute);

  dashboard: ActiveDirectoryDashboard | null = null;
  user: AdUser | null = null;
  groups: ActiveDirectoryGroup[] = [];
  groupResults: ActiveDirectoryGroup[] = [];
  ouResults: ActiveDirectoryOu[] = [];
  groupSearch = '';
  ouSearch = '';
  newPassword = '';
  forceChange = true;
  activePanel: Panel = null;
  working = false;
  notice: { tone: 'success' | 'error' | 'info'; text: string } | null = null;
  infoForm: UpdateUserInfoRequest = {};

  ngOnInit(): void {
    this.loadDashboard();
    this.route.queryParamMap.subscribe((params) => {
      const sam = params.get('sam');
      if (sam) this.loadUser(sam);
    });
  }

  loadDashboard(): void {
    this.adService.getDashboard().subscribe({
      next: (dashboard) => (this.dashboard = dashboard),
      error: () => (this.dashboard = null),
    });
  }

  selectUser(summary: AdUserSummary): void {
    this.loadUser(summary.samAccountName);
  }

  openPanel(panel: Panel): void {
    if (!this.user) return;
    this.activePanel = panel;
    this.notice = null;
  }

  closePanel(): void {
    this.activePanel = null;
    this.newPassword = '';
    this.groupSearch = '';
    this.ouSearch = '';
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
    request: ReturnType<ActiveDirectoryService['unlockUser']>,
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

  private flash(tone: 'success' | 'error' | 'info', text: string): void {
    this.notice = { tone, text };
  }
}
