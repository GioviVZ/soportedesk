import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';
  showPassword = false;
  loading = false;

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.errorMessage = '';
    this.loading = true;
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMessage = 'Usuario o contraseña incorrectos';
        this.loading = false;
      },
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
}
