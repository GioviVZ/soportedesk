import { Component, ElementRef, HostListener, inject, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { ThemeService } from '../../core/services/theme.service';
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
  readonly themeService = inject(ThemeService);

  menuOpen = false;
  cambiarPasswordOpen = false;

  get nombre(): string { return this.authService.getNombre() ?? ''; }
  get rol(): string    { return this.authService.getRole()   ?? ''; }

  get primerNombre(): string {
    const [primerNombre = ''] = this.nombre.trim().split(/\s+/);
    if (!primerNombre) return 'usuario';

    return primerNombre.charAt(0).toLocaleUpperCase('es-PE')
      + primerNombre.slice(1).toLocaleLowerCase('es-PE');
  }

  get saludo(): string {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Buenos días';
    if (hora >= 12 && hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get saludoIcon(): string {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'ti-sun-high';
    if (hora >= 12 && hora < 19) return 'ti-sunset-2';
    return 'ti-moon-stars';
  }

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
