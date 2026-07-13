import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdPanelResult } from './active-directory.model';

@Component({
  selector: 'app-ad-reset-password-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent],
  template: `
    <form class="modal-form" (ngSubmit)="submit()">
      <app-section-card title="Nueva contraseña">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>

        <div class="notice error" *ngIf="error">{{ error }}</div>

        <div class="field">
          <label>Contraseña temporal</label>
          <input type="password" name="newPassword" [(ngModel)]="newPassword" minlength="8" required />
        </div>
        <label class="checkbox-field">
          <input type="checkbox" name="forceChange" [(ngModel)]="forceChange" />
          Exigir cambio al iniciar sesión
        </label>
      </app-section-card>

      <footer class="modal-actions">
        <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="working">Guardar</button>
      </footer>
    </form>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdResetPasswordPanelComponent {
  private adService = inject(ActiveDirectoryService);

  @Input({ required: true }) samAccountName!: string;
  @Output() saved = new EventEmitter<AdPanelResult>();
  @Output() cancelled = new EventEmitter<void>();

  newPassword = '';
  forceChange = true;
  working = false;
  error = '';

  submit(): void {
    const password = this.newPassword.trim();
    if (!password) {
      this.error = 'Ingresa una contraseña temporal.';
      return;
    }
    this.error = '';
    this.working = true;
    this.adService.resetPassword(this.samAccountName, password, this.forceChange).subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.saved.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo completar la acción.';
      },
    });
  }
}
