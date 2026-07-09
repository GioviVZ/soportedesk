import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdUser, AdUserSummary } from './active-directory.model';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { AdUserSearchComponent } from './ad-user-search.component';

@Component({
  selector: 'app-usuarios-red-consultas',
  standalone: true,
  imports: [CommonModule, ModalComponent, AdUserSearchComponent, AdUserDetailComponent],
  template: `
    <div class="usuarios-red-page">
      <app-ad-user-search (selected)="openUser($event)" />
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
          *ngIf="!loading"
          [user]="selectedUser"
          [showManage]="canWrite"
          (manage)="goToAdmin($event)"
        />
      </div>
    </app-modal>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class UsuariosRedConsultasComponent {
  private adService = inject(ActiveDirectoryService);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedUser: AdUser | null = null;
  detailOpen = false;
  loading = false;
  error = '';

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  openUser(summary: AdUserSummary): void {
    this.detailOpen = true;
    this.loading = true;
    this.error = '';
    this.selectedUser = null;
    this.adService.getUser(summary.samAccountName).subscribe({
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

  closeDetail(): void {
    this.detailOpen = false;
    this.selectedUser = null;
    this.error = '';
  }

  goToAdmin(sam: string): void {
    this.router.navigate(['/usuarios-red/administracion'], { queryParams: { sam } });
  }
}
