import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Dependencia, Sede, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';

@Component({
    selector: 'app-ubicacion-select',
    imports: [FormsModule],
    templateUrl: './ubicacion-select.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './ubicacion-select.component.scss'
})
export class UbicacionSelectComponent implements OnInit, OnChanges {
  private catalogoService = inject(CatalogoService);

  @Input() sedeId: number | null = null;
  @Input() dependenciaId: number | null = null;
  @Input() subdependenciaId: number | null = null;
  @Input() tipoContratoId: number | null = null;
  @Input() showTipoContrato = true;

  @Output() sedeIdChange = new EventEmitter<number | null>();
  @Output() dependenciaIdChange = new EventEmitter<number | null>();
  @Output() subdependenciaIdChange = new EventEmitter<number | null>();
  @Output() tipoContratoIdChange = new EventEmitter<number | null>();

  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  tiposContrato: TipoContrato[] = [];

  ngOnInit(): void {
    this.catalogoService.getSedes().subscribe((sedes) => (this.sedes = sedes));
    this.catalogoService.getTiposContrato().subscribe((tipos) => (this.tiposContrato = tipos));
    if (this.sedeId) {
      this.loadDependencias(this.sedeId);
    }
    if (this.dependenciaId) {
      this.loadSubdependencias(this.dependenciaId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sedeId'] && !changes['sedeId'].firstChange) {
      this.loadDependencias(this.sedeId);
    }
    if (changes['dependenciaId'] && !changes['dependenciaId'].firstChange) {
      this.loadSubdependencias(this.dependenciaId);
    }
  }

  onSedeChange(value: string): void {
    const sedeId = value ? Number(value) : null;
    this.sedeId = sedeId;
    this.dependenciaId = null;
    this.subdependenciaId = null;
    this.dependencias = [];
    this.subdependencias = [];
    this.sedeIdChange.emit(sedeId);
    this.dependenciaIdChange.emit(null);
    this.subdependenciaIdChange.emit(null);
    if (sedeId) {
      this.loadDependencias(sedeId);
    }
  }

  onDependenciaChange(value: string): void {
    const dependenciaId = value ? Number(value) : null;
    this.dependenciaId = dependenciaId;
    this.subdependenciaId = null;
    this.subdependencias = [];
    this.dependenciaIdChange.emit(dependenciaId);
    this.subdependenciaIdChange.emit(null);
    if (dependenciaId) {
      this.loadSubdependencias(dependenciaId);
    }
  }

  onSubdependenciaChange(value: string): void {
    const subdependenciaId = value ? Number(value) : null;
    this.subdependenciaId = subdependenciaId;
    this.subdependenciaIdChange.emit(subdependenciaId);
  }

  onTipoContratoChange(value: string): void {
    const tipoContratoId = value ? Number(value) : null;
    this.tipoContratoId = tipoContratoId;
    this.tipoContratoIdChange.emit(tipoContratoId);
  }

  private loadDependencias(sedeId: number | null): void {
    if (!sedeId) {
      this.dependencias = [];
      return;
    }
    this.catalogoService.getDependencias(sedeId).subscribe((dependencias) => {
      this.dependencias = dependencias;
      if (!this.dependenciaId && dependencias.length === 1) {
        this.dependenciaId = dependencias[0].id;
        this.dependenciaIdChange.emit(this.dependenciaId);
        this.loadSubdependencias(this.dependenciaId);
      }
    });
  }

  private loadSubdependencias(dependenciaId: number | null): void {
    if (!dependenciaId) {
      this.subdependencias = [];
      return;
    }
    this.catalogoService.getSubdependencias(dependenciaId).subscribe((subdependencias) => {
      this.subdependencias = subdependencias;
      if (!this.subdependenciaId && subdependencias.length === 1) {
        this.subdependenciaId = subdependencias[0].id;
        this.subdependenciaIdChange.emit(this.subdependenciaId);
      }
    });
  }
}
