import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Correo, CorreoFiltros, CorreoKpis } from './correo.model';
import { CorreoService } from './correo.service';

@Component({
  selector: 'app-correos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './correos-list.component.html',
  styleUrl: './correos-list.component.scss',
})
export class CorreosListComponent implements OnInit {
  private service = inject(CorreoService);

  items: Correo[] = [];
  kpis: CorreoKpis | null = null;
  sedes: string[] = [];
  dependencias: string[] = [];
  subdependencias: string[] = [];

  filtros: CorreoFiltros = {};
  searchTerm = '';
  selectedSede = '';
  selectedDependencia = '';
  selectedSubdependencia = '';
  selectedEstado = '';
  selectedModalidad = '';
  sinUso30Dias = false;
  selectedCorreo: Correo | null = null;

  readonly estadoOpciones = ['Activo', 'Suspendido'];
  readonly modalidadOpciones = ['CAP', 'CAS', 'EXTERNO', 'GENERICO', 'PRACTICANTE'];

  ngOnInit(): void {
    this.service.getKpis().subscribe((kpis) => (this.kpis = kpis));
    this.service.getSedes().subscribe((sedes) => (this.sedes = sedes));
    this.service.getDependencias().subscribe((dependencias) => (this.dependencias = dependencias));
    this.service.getSubdependencias().subscribe((subdependencias) => (this.subdependencias = subdependencias));
    this.load();
  }

  load(): void {
    this.filtros = {
      search: this.searchTerm || undefined,
      sede: this.selectedSede || undefined,
      dependencia: this.selectedDependencia || undefined,
      subdependencia: this.selectedSubdependencia || undefined,
      estado: this.selectedEstado || undefined,
      modalidad: this.selectedModalidad || undefined,
      sinUso30Dias: this.sinUso30Dias || undefined,
    };
    this.service.getAll(this.filtros).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.load();
  }

  onFiltroChange(): void {
    this.load();
  }

  onDependenciaChange(): void {
    this.selectedSubdependencia = '';
    this.service
      .getSubdependencias(this.selectedDependencia || undefined)
      .subscribe((subdependencias) => (this.subdependencias = subdependencias));
    this.load();
  }

  clearFiltros(): void {
    this.selectedSede = '';
    this.selectedDependencia = '';
    this.selectedSubdependencia = '';
    this.selectedEstado = '';
    this.selectedModalidad = '';
    this.sinUso30Dias = false;
    this.searchTerm = '';
    this.service.getSubdependencias().subscribe((subdependencias) => (this.subdependencias = subdependencias));
    this.load();
  }

  openDetail(item: Correo): void {
    this.selectedCorreo = item;
  }

  closeDetail(): void {
    this.selectedCorreo = null;
  }

  formatStorage(value: number | null): string {
    if (value === null || value === undefined) return 'Sin dato';
    if (value >= 1024) return `${(value / 1024).toFixed(2)} GB`;
    return `${value.toFixed(2)} MB`;
  }

  statusClass(value: string | null): string {
    return value === 'Activo' ? 'success' : value === 'Suspendido' ? 'warning' : 'neutral';
  }

  twoFactorClass(value: string | null): string {
    return value === 'Enrolado' ? 'success' : value === 'No Enrolado' ? 'warning' : 'neutral';
  }

  hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm ||
        this.selectedSede ||
        this.selectedDependencia ||
        this.selectedSubdependencia ||
        this.selectedEstado ||
        this.selectedModalidad ||
        this.sinUso30Dias
    );
  }
}
