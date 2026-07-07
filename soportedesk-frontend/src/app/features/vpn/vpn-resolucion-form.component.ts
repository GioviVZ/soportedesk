import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

@Component({
  selector: 'app-vpn-resolucion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vpn-resolucion-form.component.html',
})
export class VpnResolucionFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Input() vpn: Vpn | null = null;
  @Input() modo: 'RECHAZAR' | 'OBSERVAR' = 'RECHAZAR';
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    comentarioResponsable: ['', Validators.required],
  });

  get titulo(): string {
    return this.modo === 'RECHAZAR' ? 'Rechazar solicitud' : 'Observar solicitud';
  }

  ngOnChanges(): void {
    this.form.reset();
  }

  submit(): void {
    if (!this.vpn || this.form.invalid) return;
    const request = { comentarioResponsable: this.form.getRawValue().comentarioResponsable };
    const obs = this.modo === 'RECHAZAR'
      ? this.service.rechazar(this.vpn.id, request)
      : this.service.observar(this.vpn.id, request);
    obs.subscribe(() => this.saved.emit());
  }
}
