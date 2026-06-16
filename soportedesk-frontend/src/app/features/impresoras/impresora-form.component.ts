import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresora-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './impresora-form.component.html',
  styleUrl: './impresora-form.component.scss',
})
export class ImpresoraFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(ImpresoraService);

  @Input() impresora: Impresora | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    ip: ['', Validators.required],
    piso: ['', Validators.required],
    area: ['', Validators.required],
    estado: ['Activa', Validators.required],
    tonerNegro: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    tonerC: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    tonerM: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    tonerY: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    cartucho: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    drum: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    fusor: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnChanges(): void {
    if (this.impresora) {
      this.form.patchValue({
        nombre: this.impresora.nombre,
        marca: this.impresora.marca,
        modelo: this.impresora.modelo,
        ip: this.impresora.ip,
        piso: this.impresora.piso,
        area: this.impresora.area,
        estado: this.impresora.estado,
        tonerNegro: this.impresora.tonerNegro,
        tonerC: this.impresora.tonerC,
        tonerM: this.impresora.tonerM,
        tonerY: this.impresora.tonerY,
        cartucho: this.impresora.cartucho,
        drum: this.impresora.drum,
        fusor: this.impresora.fusor,
      });
    } else {
      this.form.reset({
        nombre: '',
        marca: '',
        modelo: '',
        ip: '',
        piso: '',
        area: '',
        estado: 'Activa',
        tonerNegro: 100,
        tonerC: 100,
        tonerM: 100,
        tonerY: 100,
        cartucho: 100,
        drum: 100,
        fusor: 100,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const request = this.form.getRawValue();
    const obs = this.impresora
      ? this.service.update(this.impresora.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
