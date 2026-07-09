import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ActiveDirectoryService } from './active-directory.service';
import {
  ActiveDirectoryDashboard,
  ActiveDirectoryGroup,
  ActiveDirectoryOu,
  AdUser,
  UpdateUserInfoRequest,
} from './active-directory.model';

type Panel = 'password' | 'groups' | 'ou' | 'info' | null;

@Component({
  selector: 'app-usuarios-red-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './usuarios-red-list.component.html',
  styleUrl: './usuarios-red-list.component.scss',
})
export class UsuariosRedListComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private authService = inject(AuthService);

  dashboard: ActiveDirectoryDashboard | null = null;
  user: AdUser | null = null;
  groups: ActiveDirectoryGroup[] = [];
  groupResults: ActiveDirectoryGroup[] = [];
  ouResults: ActiveDirectoryOu[] = [];

  searchTerm = '';
  groupSearch = '';
  ouSearch = '';
  selectedGroupDn = '';
  selectedOuDn = '';
  newPassword = '';
  forceChange = true;
  activePanel: Panel = null;
  loading = false;
  working = false;
  notice: { tone: 'success' | 'error' | 'info'; text: string } | null = null;

  infoForm: UpdateUserInfoRequest = {};

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.adService.getDashboard().subscribe({
      next: (dashboard) => (this.dashboard = dashboard),
      error: () => (this.dashboard = null),
    });
  }

  searchUser(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.flash('error', 'Ingresa un usuario de red.');
      return;
    }
    this.loading = true;
    this.notice = null;
    this.adService.getUser(term).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.success || !response.data) {
          this.user = null;
          this.groups = [];
          this.flash('error', response.message || 'Usuario no encontrado.');
          return;
        }
        this.user = response.data;
        this.searchTerm = response.data.samAccountName;
        this.syncInfoForm(response.data);
        this.loadGroups();
        this.flash('success', response.message);
      },
      error: () => {
        this.loading = false;
        this.user = null;
        this.flash('error', 'No se pudo consultar Active Directory.');
      },
    });
  }

  openPanel(panel: Panel): void {
    if (!this.canWrite || !this.user) return;
    this.activePanel = panel;
    this.notice = null;
  }

  closePanel(): void {
    this.activePanel = null;
    this.newPassword = '';
    this.selectedGroupDn = '';
    this.selectedOuDn = '';
  }

  unlock(): void {
    if (!this.user || !this.canWrite) return;
    this.runAction(this.adService.unlockUser(this.user.samAccountName));
  }

  toggleEnabled(): void {
    if (!this.user || !this.canWrite) return;
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

  addSelectedGroup(groupDn = this.selectedGroupDn): void {
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

  moveToOu(ouDn = this.selectedOuDn): void {
    if (!this.user || !ouDn) return;
    this.runAction(this.adService.moveUser(this.user.samAccountName, ouDn), true);
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
          } else {
            this.searchUser();
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
