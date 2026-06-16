import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Wifi } from './wifi.model';
import { WifiService } from './wifi.service';

@Component({
  selector: 'app-wifi-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './wifi-form.component.html',
  styleUrl: './wifi-form.component.scss',
})
export class WifiFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(WifiService);

  @Input() wifi: Wifi | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    ssid: ['', Validators.required],
    clave: ['', Validators.required],
    ubicacion: ['', Validators.required],
    tipo: ['', Validators.required],
    estado: ['Activa', Validators.required],
  });

  ngOnChanges(): void {
    if (this.wifi) {
      this.form.patchValue(this.wifi);
    } else {
      this.form.reset({ ssid: '', clave: '', ubicacion: '', tipo: '', estado: 'Activa' });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const request = this.form.getRawValue();
    const obs = this.wifi
      ? this.service.update(this.wifi.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
