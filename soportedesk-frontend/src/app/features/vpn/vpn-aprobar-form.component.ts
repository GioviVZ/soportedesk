import { Component, EventEmitter, Input, OnChanges, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { VpnPasswordGeneratorComponent } from './vpn-password-generator.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-vpn-aprobar-form',
    imports: [ReactiveFormsModule, VpnPasswordGeneratorComponent],
    templateUrl: './vpn-aprobar-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vpn-aprobar-form.component.scss'
})
export class VpnAprobarFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private authService = inject(AuthService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  saving = false;
  errorMessage = '';
  mostrarCredencial = false;

  form = this.fb.nonNullable.group({
    usuarioVpn: ['', Validators.required],
    credencialVpn: ['', [Validators.required, Validators.minLength(17)]],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    this.errorMessage = '';
    this.saving = false;
    this.mostrarCredencial = false;
    this.form.reset({
      usuarioVpn: this.vpn?.usuarioVpn || this.vpn?.adSamAccountName || '',
      credencialVpn: '',
      estado: 'Activo',
    });
  }

  get canEditCredencialManualmente(): boolean {
    return this.authService.isAdmin();
  }

  get esActualizacionCredenciales(): boolean {
    return this.vpn?.estadoSolicitud === 'APROBADO';
  }

  useGeneratedPassword(password: string): void {
    this.form.patchValue({ credencialVpn: password });
  }

  submit(): void {
    if (!this.vpn || this.form.invalid || this.saving) return;
    this.errorMessage = '';
    this.saving = true;
    const raw = this.form.getRawValue();
    const payload = {
      usuarioVpn: raw.usuarioVpn,
      credencialVpn: raw.credencialVpn,
      estado: raw.estado,
    };
    const request$ = this.esActualizacionCredenciales
      ? this.service.actualizarCredenciales(this.vpn.id, payload)
      : this.service.aprobar(this.vpn.id, payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || (this.esActualizacionCredenciales
          ? 'No se pudieron actualizar las credenciales VPN.'
          : 'No se pudo aprobar la solicitud VPN.');
      },
    });
  }
}
