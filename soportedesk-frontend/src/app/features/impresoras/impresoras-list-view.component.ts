import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ImpresoraResumenComponent } from './impresora-resumen.component';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-impresoras-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericTableComponent, StatusBadgeComponent, ImpresoraResumenComponent],
  templateUrl: './impresoras-list-view.component.html',
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasListViewComponent {
  @Input({ required: true }) items: Impresora[] = [];
  @Input() canManage = false;

  @Output() view = new EventEmitter<Impresora>();
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Impresora>();
  @Output() delete = new EventEmitter<Impresora>();

  columns: TableColumn[] = [
    { key: 'modeloImpresora.marca.nombre', label: 'Marca' },
    { key: 'modeloImpresora.nombre', label: 'Modelo' },
    { key: 'tipoImpresora.nombre', label: 'Tipo' },
    { key: 'serie', label: 'Serie' },
    { key: 'ip', label: 'IP' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
  ];
  readonly impresoraEstadoTone = impresoraEstadoTone;

  showConsumibles = false;
  searchTerm = '';
  mobileSearchTerm = '';
  filters = {
    sede: '',
    dependencia: '',
    subdependencia: '',
    ip: '',
    marca: '',
    modelo: '',
  };

  onSearch(term: string): void {
    this.searchTerm = term;
    this.mobileSearchTerm = term;
  }

  onMobileSearch(term: string): void {
    this.searchTerm = term;
    this.mobileSearchTerm = term;
  }

  get filteredItems(): Impresora[] {
    const search = this.normalize(this.searchTerm);
    const ip = this.normalize(this.filters.ip);

    return this.items.filter((item) => {
      const exactFilters =
        (!this.filters.sede || item.sede?.nombre === this.filters.sede) &&
        (!this.filters.dependencia || item.dependencia?.nombre === this.filters.dependencia) &&
        (!this.filters.subdependencia || item.subdependencia?.nombre === this.filters.subdependencia) &&
        (!this.filters.marca || item.modeloImpresora.marca.nombre === this.filters.marca) &&
        (!this.filters.modelo || item.modeloImpresora.nombre === this.filters.modelo);

      if (!exactFilters) {
        return false;
      }

      if (ip && !this.normalize(item.ip).includes(ip)) {
        return false;
      }

      if (!search) {
        return true;
      }

      return this.normalize([
        item.modeloImpresora.marca.nombre,
        item.modeloImpresora.nombre,
        item.tipoImpresora?.nombre,
        item.serie,
        item.codigoInventario,
        item.codigoPatrimonial,
        item.ip,
        item.sede?.nombre,
        item.dependencia?.nombre,
        item.subdependencia?.nombre,
        item.estado,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get sedes(): string[] {
    return this.unique(this.items.map((item) => item.sede?.nombre));
  }

  get dependencias(): string[] {
    return this.unique(this.items
      .filter((item) => !this.filters.sede || item.sede?.nombre === this.filters.sede)
      .map((item) => item.dependencia?.nombre));
  }

  get subdependencias(): string[] {
    return this.unique(this.items
      .filter((item) => !this.filters.dependencia || item.dependencia?.nombre === this.filters.dependencia)
      .map((item) => item.subdependencia?.nombre));
  }

  get marcas(): string[] {
    return this.unique(this.items.map((item) => item.modeloImpresora.marca.nombre));
  }

  get modelos(): string[] {
    return this.unique(this.items
      .filter((item) => !this.filters.marca || item.modeloImpresora.marca.nombre === this.filters.marca)
      .map((item) => item.modeloImpresora.nombre));
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm ||
      this.filters.sede ||
      this.filters.dependencia ||
      this.filters.subdependencia ||
      this.filters.ip ||
      this.filters.marca ||
      this.filters.modelo
    );
  }

  onSedeFilterChange(): void {
    this.filters.dependencia = '';
    this.filters.subdependencia = '';
  }

  onDependenciaFilterChange(): void {
    this.filters.subdependencia = '';
  }

  onMarcaFilterChange(): void {
    this.filters.modelo = '';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.mobileSearchTerm = '';
    this.filters = {
      sede: '',
      dependencia: '',
      subdependencia: '',
      ip: '',
      marca: '',
      modelo: '',
    };
  }

  toggleConsumibles(): void {
    this.showConsumibles = !this.showConsumibles;
  }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      Marca: item.modeloImpresora.marca.nombre,
      Modelo: item.modeloImpresora.nombre,
      Tipo: item.tipoImpresora?.nombre ?? '',
      Serie: item.serie ?? '',
      'Codigo de Inventario': item.codigoInventario ?? '',
      'Codigo Patrimonial': item.codigoPatrimonial ?? '',
      Conexion: item.tipoConexion,
      IP: item.ip ?? '',
      Sede: item.sede?.nombre ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Subdependencia: item.subdependencia?.nombre ?? '',
      Estado: item.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 18 }, { wch: 26 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
      { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 34 }, { wch: 34 }, { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Impresoras');
    XLSX.writeFile(workbook, `impresoras-${this.exportDate()}.xlsx`);
  }

  printerLocation(item: Impresora): string {
    return [
      item.dependencia?.nombre,
      item.subdependencia?.nombre,
    ].filter(Boolean).join(' / ') || item.sede?.nombre || 'Sin ubicacion';
  }

  printerIdentifier(item: Impresora): string {
    return item.serie || item.codigoInventario || item.codigoPatrimonial || 'Sin identificador';
  }

  printerConnection(item: Impresora): string {
    return item.tipoConexion === 'IP' && item.ip ? `IP ${item.ip}` : item.tipoConexion;
  }

  private unique(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
      .sort((a, b) => a.localeCompare(b));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  private exportDate(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
