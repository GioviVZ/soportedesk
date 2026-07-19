import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Correo, CorreoFiltros } from './correo.model';
import { CorreoService } from './correo.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-correos-consultas',
    imports: [CommonModule, FormsModule, ModalComponent],
    templateUrl: './correos-consultas.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./correos.shared.scss', './correos-consultas-empty.scss']
})
export class CorreosConsultasComponent implements OnInit {
  private service = inject(CorreoService);

  items: Correo[] = [];
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

  exportExcel(): void {
    const rows = this.items.map((item) => ({
      Correo: item.email ?? '',
      'Nombre Completo': item.nombreCompleto ?? item.employeeId ?? '',
      Sede: item.sede ?? '',
      Dependencia: item.oficinaPadre ?? '',
      Subdependencia: item.oficina ?? '',
      Modalidad: item.modalidad ?? '',
      Estado: item.estado ?? '',
      'Doble Autenticación': item.verificacion2Pasos ?? '',
      'Ultimo acceso': item.ultimoInicioSesion ?? '',
      'Uso Email (MB)': this.roundMb(item.emailUsageMB),
      'Uso Drive (MB)': this.roundMb(item.driveUsageMB),
      'Almacenamiento (MB)': this.roundMb(item.storageUsedMB),
      'Uso Total (MB)': this.roundMb(item.totalUsoMB),
      'Uso Total': this.formatStorage(item.totalUsoMB),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 34 }, { wch: 38 }, { wch: 20 }, { wch: 42 }, { wch: 42 }, { wch: 16 }, { wch: 14 },
      { wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Correos');
    XLSX.writeFile(workbook, `correos-${this.exportDate()}.xlsx`);
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
      this.searchTerm || this.selectedSede || this.selectedDependencia || this.selectedSubdependencia ||
        this.selectedEstado || this.selectedModalidad || this.sinUso30Dias
    );
  }

  private roundMb(value: number | null): number | '' {
    if (value === null || value === undefined) return '';
    return Math.round(value * 100) / 100;
  }

  private exportDate(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
