import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Impresora, ImpresoraRequest } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';

@Component({
  selector: 'app-impresora-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbicacionSelectComponent],
  templateUrl: './impresora-form.component.html',
  styleUrl: './impresora-form.component.scss',
})
export class ImpresoraFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(ImpresoraService);

  @Input() impresora: Impresora | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;

  form = this.fb.nonNullable.group({
    nombre:           ['', Validators.required],
    marca:            ['', Validators.required],
    modelo:           ['', Validators.required],
    ip:               [''],
    estado:           ['Activa', Validators.required],
    modeloTonerNegro: [''],
    modeloTonerC:     [''],
    modeloTonerM:     [''],
    modeloTonerY:     [''],
    modeloCartucho:   [''],
    modeloDrum:       [''],
    modeloFusor:      [''],
  });

  ngOnChanges(): void {
    if (this.impresora) {
      this.sedeId          = this.impresora.sede?.id ?? null;
      this.dependenciaId   = this.impresora.dependencia?.id ?? null;
      this.subdependenciaId = this.impresora.subdependencia?.id ?? null;
      this.form.patchValue({
        nombre:           this.impresora.nombre,
        marca:            this.impresora.marca,
        modelo:           this.impresora.modelo,
        ip:               this.impresora.ip,
        estado:           this.impresora.estado,
        modeloTonerNegro: this.impresora.modeloTonerNegro ?? '',
        modeloTonerC:     this.impresora.modeloTonerC     ?? '',
        modeloTonerM:     this.impresora.modeloTonerM     ?? '',
        modeloTonerY:     this.impresora.modeloTonerY     ?? '',
        modeloCartucho:   this.impresora.modeloCartucho   ?? '',
        modeloDrum:       this.impresora.modeloDrum       ?? '',
        modeloFusor:      this.impresora.modeloFusor      ?? '',
      });
    } else {
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.form.reset({
        nombre: '', marca: '', modelo: '', ip: '',
        estado: 'Activa',
        modeloTonerNegro: '', modeloTonerC: '', modeloTonerM: '', modeloTonerY: '',
        modeloCartucho: '', modeloDrum: '', modeloFusor: '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const request: ImpresoraRequest = {
      ...this.form.getRawValue(),
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
    };
    const obs = this.impresora
      ? this.service.update(this.impresora.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
