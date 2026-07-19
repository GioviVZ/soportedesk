import { Component, EventEmitter, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VpnService } from './vpn.service';

@Component({
    selector: 'app-vpn-config-institucional-form',
    imports: [ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './vpn-config-institucional-form.component.html'
})
export class VpnConfigInstitucionalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    vencimientoAntivirus: ['', Validators.required],
  });

  ngOnInit(): void {
    this.service.getConfigInstitucional().subscribe((data) => {
      if (data.vencimientoAntivirus) {
        this.form.patchValue({ vencimientoAntivirus: data.vencimientoAntivirus });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.service
      .actualizarConfigInstitucional({
        vencimientoAntivirus: this.form.getRawValue().vencimientoAntivirus,
      })
      .subscribe(() => this.saved.emit());
  }
}
