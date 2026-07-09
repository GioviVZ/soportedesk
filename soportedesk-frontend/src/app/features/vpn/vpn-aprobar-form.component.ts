import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { VpnPasswordGeneratorComponent } from './vpn-password-generator.component';

@Component({
  selector: 'app-vpn-aprobar-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VpnPasswordGeneratorComponent],
  templateUrl: './vpn-aprobar-form.component.html',
  styleUrl: './vpn-aprobar-form.component.scss',
})
export class VpnAprobarFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    usuarioVpn: ['', Validators.required],
    credencialVpn: ['', Validators.required],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    this.form.reset({ estado: 'Activo' });
  }

  useGeneratedPassword(password: string): void {
    this.form.patchValue({ credencialVpn: password });
  }

  submit(): void {
    if (!this.vpn || this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.service.aprobar(this.vpn.id, {
      usuarioVpn: raw.usuarioVpn,
      credencialVpn: raw.credencialVpn,
      estado: raw.estado,
    }).subscribe(() => this.saved.emit());
  }
}
