import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly layout = inject(LayoutService);

  get nombre(): string { return this.authService.getNombre() ?? ''; }
  get rol(): string    { return this.authService.getRole()   ?? ''; }

  get initials(): string {
    return this.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
