import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    tipo: ['', Validators.required],
    ipAsignada: ['', Validators.required],
    vence: [''],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    if (this.vpn) {
      this.form.patchValue({
        usuario: this.vpn.usuario,
        nombre: this.vpn.nombre,
        tipo: this.vpn.tipo,
        ipAsignada: this.vpn.ipAsignada,
        vence: this.vpn.vence ?? '',
        estado: this.vpn.estado,
      });
    } else {
      this.form.reset({
        usuario: '',
        nombre: '',
        tipo: '',
        ipAsignada: '',
        vence: '',
        estado: 'Activo',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const request = { ...raw, vence: raw.vence || null };
    const obs = this.vpn
      ? this.service.update(this.vpn.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
