import { Component, ElementRef, HostListener, inject, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { CambiarPasswordModalComponent } from './cambiar-password-modal.component';

@Component({
    selector: 'app-header',
    imports: [ModalComponent, CambiarPasswordModalComponent],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  readonly layout = inject(LayoutService);

  menuOpen = false;
  cambiarPasswordOpen = false;

  get nombre(): string { return this.authService.getNombre() ?? ''; }
  get rol(): string    { return this.authService.getRole()   ?? ''; }

  get initials(): string {
    return this.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  openCambiarPassword(): void {
    this.menuOpen = false;
    this.cambiarPasswordOpen = true;
  }

  closeCambiarPassword(): void {
    this.cambiarPasswordOpen = false;
  }

  onPasswordChanged(): void {
    this.cambiarPasswordOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
