import { Component, EventEmitter, Input, OnChanges, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

@Component({
    selector: 'app-vpn-antivirus-form',
    imports: [ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './vpn-antivirus-form.component.html'
})
export class VpnAntivirusFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    tieneAntivirus: [null as boolean | null],
    vencimientoAntivirus: [''],
  });

  ngOnChanges(): void {
    if (this.vpn) {
      this.form.patchValue({
        tieneAntivirus: this.vpn.tieneAntivirus,
        vencimientoAntivirus: this.vpn.vencimientoAntivirus ?? '',
      });
    } else {
      this.form.reset();
    }
  }

  submit(): void {
    if (!this.vpn) return;
    const raw = this.form.getRawValue();
    this.service.patchAntivirus(this.vpn.id, {
      tieneAntivirus: raw.tieneAntivirus,
      vencimientoAntivirus: raw.vencimientoAntivirus || null,
    }).subscribe(() => this.saved.emit());
  }
}
