import { Component, EventEmitter, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('passwordNueva')?.value;
  const confirmar = group.get('confirmarPassword')?.value;
  return nueva === confirmar ? null : { passwordsMismatch: true };
}

@Component({
    selector: 'app-cambiar-password-modal',
    imports: [ReactiveFormsModule],
    templateUrl: './cambiar-password-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './cambiar-password-modal.component.scss'
})
export class CambiarPasswordModalComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  errorMessage = '';
  loading = false;

  form = this.fb.nonNullable.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  submit(): void {
    if (this.form.invalid) return;
    this.errorMessage = '';
    this.loading = true;
    const { passwordActual, passwordNueva } = this.form.getRawValue();
    this.authService.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.loading = false;
        this.form.reset();
        this.saved.emit();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'No se pudo cambiar la contraseña';
      },
    });
  }

  cancel(): void {
    this.form.reset();
    this.errorMessage = '';
    this.cancelled.emit();
  }
}
