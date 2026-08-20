import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EquipoSaludItem } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentModalComponent } from './equipo-enrichment-modal.component';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-equipos-mantenimiento',
    imports: [CommonModule, FormsModule, EquipoEnrichmentModalComponent],
    templateUrl: './equipos-mantenimiento.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './equipos.shared.scss'
})
export class EquiposMantenimientoComponent implements OnInit {
  private service = inject(EquipoService);
  readonly missingFilter = '__missing__';
  items = signal<EquipoSaludItem[]>([]);
  query = signal('');
  onlyRecent = signal(false);
  selectedUbicacion = signal('');
  selectedDireccion = signal('');
  selectedOficina = signal('');
  selectedTipo = signal('');
  sortBy = signal('equipo');
  selected = signal<EquipoSaludItem | null>(null);
  exporting = signal(false);

  recientes = computed(() => this.items().filter((item) => this.isRecent(item)));
  ubicaciones = computed(() => this.unique(this.items().map((item) => item.sedeNombre)));
  direcciones = computed(() => this.unique(
    this.items()
      .filter((item) => this.matchesFilter(item.sedeNombre, this.selectedUbicacion()))
      .map((item) => item.dependenciaNombre)
  ));
  oficinas = computed(() => this.unique(
    this.items()
      .filter((item) => this.matchesFilter(item.sedeNombre, this.selectedUbicacion()))
      .filter((item) => this.matchesFilter(item.dependenciaNombre, this.selectedDireccion()))
      .map((item) => item.subdependenciaNombre)
  ));
  tipos = computed(() => this.unique(this.items().map((item) => item.tipoEquipo)));
  activeFilterCount = computed(() => [
    this.query(),
    this.onlyRecent(),
    this.selectedUbicacion(),
    this.selectedDireccion(),
    this.selectedOficina(),
    this.selectedTipo(),
  ].filter(Boolean).length);
  hasActiveFilters = computed(() => this.activeFilterCount() > 0);
  filtered = computed(() => {
    const term = this.normalize(this.query());
    const items = this.items().filter((item) => {
      if (this.onlyRecent() && !this.isRecent(item)) return false;
      if (!this.matchesFilter(item.sedeNombre, this.selectedUbicacion())) return false;
      if (!this.matchesFilter(item.dependenciaNombre, this.selectedDireccion())) return false;
      if (!this.matchesFilter(item.subdependenciaNombre, this.selectedOficina())) return false;
      if (!this.matchesFilter(item.tipoEquipo, this.selectedTipo())) return false;
      if (!term) return true;
      return this.normalize([
        item.nombreEquipo,
        item.usuarioContacto,
        item.sedeNombre,
        item.dependenciaNombre,
        item.subdependenciaNombre,
        item.tipoEquipo,
        item.fabricanteEquipo,
        item.modeloEquipo,
      ].filter(Boolean).join(' ')).includes(term);
    });

    return items.sort((a, b) => this.compareItems(a, b));
  });

  ngOnInit(): void { this.load(); }
  load(): void { this.service.getSalud().subscribe((data) => this.items.set(data)); }
  edit(item: EquipoSaludItem): void { this.selected.set(item); }
  close(): void { this.selected.set(null); }
  saved(): void { this.close(); this.load(); }

  exportExcel(): void {
    const items = this.filtered();
    if (!items.length || this.exporting()) return;
    this.exporting.set(true);
    const rows = items.map((item) => ({
      Equipo: item.nombreEquipo ?? '',
      'Usuario asignado': item.usuarioContacto ?? '',
      Ubicación: item.sedeNombre ?? '',
      'Dirección / dependencia': item.dependenciaNombre ?? '',
      'Oficina / unidad': item.subdependenciaNombre ?? '',
      Tipo: item.tipoEquipo ?? '',
      Fabricante: item.fabricanteEquipo ?? '',
      Modelo: item.modeloEquipo ?? '',
      'Fecha de alta en GLPI': this.formatExportDate(item.fechaCreacion),
      'Nivel de alerta': item.nivelAlerta,
      'Meses sin encender': item.sinEncendidoMeses,
      'Meses sin actualizar': item.sinActualizacionMeses,
      'Datos pendientes': this.datosPendientes(item),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 32 }, { wch: 32 },
      { wch: 16 }, { wch: 18 }, { wch: 26 }, { wch: 22 }, { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 32 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Administración de inventario');
    XLSX.writeFile(workbook, `administracion-equipos-${this.exportDate()}.xlsx`);
    this.exporting.set(false);
  }

  private datosPendientes(item: EquipoSaludItem): string {
    const pendientes: string[] = [];
    if (item.sinUsuario) pendientes.push('Usuario');
    if (item.sinSede) pendientes.push('Sede');
    if (item.sinDependencia) pendientes.push('Dependencia');
    if (item.sinSubdependencia) pendientes.push('Subdependencia');
    if (item.sinNumeroSerie) pendientes.push('Serie');
    if (item.sinCodigoPatrimonial) pendientes.push('Código');
    return pendientes.join(', ');
  }

  private formatExportDate(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  private exportDate(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onUbicacionChange(value: string): void {
    this.selectedUbicacion.set(value);
    this.selectedDireccion.set('');
    this.selectedOficina.set('');
  }

  onDireccionChange(value: string): void {
    this.selectedDireccion.set(value);
    this.selectedOficina.set('');
  }

  clearFilters(): void {
    this.query.set('');
    this.onlyRecent.set(false);
    this.selectedUbicacion.set('');
    this.selectedDireccion.set('');
    this.selectedOficina.set('');
    this.selectedTipo.set('');
  }

  private isRecent(item: EquipoSaludItem): boolean {
    if (!item.fechaCreacion) return false;
    const age = Date.now() - new Date(item.fechaCreacion).getTime();
    return age >= 0 && age <= 30 * 86400000;
  }
  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private matchesFilter(value: string | null, filter: string): boolean {
    if (!filter) return true;
    if (filter === this.missingFilter) return !value?.trim();
    return value === filter;
  }

  private unique(values: Array<string | null>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))]
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }

  private compareItems(a: EquipoSaludItem, b: EquipoSaludItem): number {
    switch (this.sortBy()) {
      case 'ubicacion':
        return this.compareText(a.sedeNombre, b.sedeNombre) || this.compareText(a.nombreEquipo, b.nombreEquipo);
      case 'direccion':
        return this.compareText(a.dependenciaNombre, b.dependenciaNombre) || this.compareText(a.nombreEquipo, b.nombreEquipo);
      case 'oficina':
        return this.compareText(a.subdependenciaNombre, b.subdependenciaNombre) || this.compareText(a.nombreEquipo, b.nombreEquipo);
      case 'recientes':
        return this.dateValue(b.fechaCreacion) - this.dateValue(a.fechaCreacion) || this.compareText(a.nombreEquipo, b.nombreEquipo);
      default:
        return this.compareText(a.nombreEquipo, b.nombreEquipo);
    }
  }

  private compareText(a: string | null, b: string | null): number {
    if (!a?.trim()) return b?.trim() ? 1 : 0;
    if (!b?.trim()) return -1;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  }

  private dateValue(value: string | null): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
}
