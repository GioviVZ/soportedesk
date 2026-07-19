import { Component, EventEmitter, Input, OnChanges, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { VpnPasswordGeneratorComponent } from './vpn-password-generator.component';

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

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  saving = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    usuarioVpn: ['', Validators.required],
    credencialVpn: ['', [Validators.required, Validators.minLength(17)]],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    this.errorMessage = '';
    this.saving = false;
    this.form.reset({
      usuarioVpn: this.vpn?.usuarioVpn || this.vpn?.adSamAccountName || '',
      credencialVpn: '',
      estado: 'Activo',
    });
  }

  useGeneratedPassword(password: string): void {
    this.form.patchValue({ credencialVpn: password });
  }

  submit(): void {
    if (!this.vpn || this.form.invalid || this.saving) return;
    this.errorMessage = '';
    this.saving = true;
    const raw = this.form.getRawValue();
    this.service.aprobar(this.vpn.id, {
      usuarioVpn: raw.usuarioVpn,
      credencialVpn: raw.credencialVpn,
      estado: raw.estado,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'No se pudo aprobar la solicitud VPN.';
      },
    });
  }
}
