import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CatalogoService } from '@soportedesk/core';
import { Dependencia, Sede, Subdependencia } from '@soportedesk/core';
import { GenericTableComponent, TableColumn } from '@soportedesk/ui';
import { StatusBadgeComponent } from '@soportedesk/ui';
import { ImpresoraResumenComponent } from './impresora-resumen.component';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import * as XLSX from 'xlsx';

const PENDIENTE = '__PENDIENTE__';

@Component({
    selector: 'app-impresoras-list-view',
    imports: [FormsModule, GenericTableComponent, StatusBadgeComponent, ImpresoraResumenComponent],
    templateUrl: './impresoras-list-view.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './impresoras.shared.scss'
})
export class ImpresorasListViewComponent implements OnInit {
  private catalogoService = inject(CatalogoService);

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
  readonly PENDIENTE = PENDIENTE;

  catalogoSedes: Sede[] = [];
  catalogoDependencias: Dependencia[] = [];
  catalogoSubdependencias: Subdependencia[] = [];

  showConsumibles = false;
  searchTerm = '';
  mobileSearchTerm = '';
  filters = {
    sedeId: '',
    dependenciaId: '',
    subdependenciaId: '',
    ip: '',
    marca: '',
    modelo: '',
  };

  ngOnInit(): void {
    this.catalogoService.getSedes().subscribe((data) => (this.catalogoSedes = data));
    this.catalogoService.getDependencias().subscribe((data) => (this.catalogoDependencias = data));
    this.catalogoService.getSubdependencias().subscribe((data) => (this.catalogoSubdependencias = data));
  }

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
    const sedeId = this.filters.sedeId;
    const dependenciaId = this.filters.dependenciaId;
    const subdependenciaId = this.filters.subdependenciaId;

    return this.items.filter((item) => {
      const sedeOk = !sedeId || (sedeId === PENDIENTE ? !item.sede : String(item.sede?.id ?? '') === sedeId);
      const dependenciaOk = !dependenciaId || (dependenciaId === PENDIENTE
        ? !item.dependencia
        : String(item.dependencia?.id ?? '') === dependenciaId);
      const subdependenciaOk = !subdependenciaId || (subdependenciaId === PENDIENTE
        ? !item.subdependencia
        : String(item.subdependencia?.id ?? '') === subdependenciaId);
      const exactFilters =
        sedeOk &&
        dependenciaOk &&
        subdependenciaOk &&
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
        item.referencia,
        item.ip,
        item.sede?.nombre,
        item.dependencia?.nombre,
        item.subdependencia?.nombre,
        item.estado,
      ].filter(Boolean).join(' ')).includes(search);
    }).sort((a, b) =>
      this.compareConNullsAlFinal(a.sede?.nombre, b.sede?.nombre) ||
      this.compareConNullsAlFinal(a.dependencia?.nombre, b.dependencia?.nombre) ||
      this.compareConNullsAlFinal(a.subdependencia?.nombre, b.subdependencia?.nombre) ||
      this.compareConNullsAlFinal(a.modeloImpresora?.marca?.nombre, b.modeloImpresora?.marca?.nombre) ||
      this.compareConNullsAlFinal(a.modeloImpresora?.nombre, b.modeloImpresora?.nombre)
    );
  }

  get dependenciasDisponibles(): Dependencia[] {
    if (!this.filters.sedeId || this.filters.sedeId === PENDIENTE) {
      return [];
    }
    return this.catalogoDependencias.filter((dependencia) =>
      String(dependencia.sede.id) === this.filters.sedeId
    );
  }

  get subdependenciasDisponibles(): Subdependencia[] {
    if (!this.filters.dependenciaId || this.filters.dependenciaId === PENDIENTE) {
      return [];
    }
    return this.catalogoSubdependencias.filter((subdependencia) =>
      String(subdependencia.dependencia.id) === this.filters.dependenciaId
    );
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
      this.filters.sedeId ||
      this.filters.dependenciaId ||
      this.filters.subdependenciaId ||
      this.filters.ip ||
      this.filters.marca ||
      this.filters.modelo
    );
  }

  onSedeFilterChange(): void {
    this.filters.dependenciaId = '';
    this.filters.subdependenciaId = '';
  }

  onDependenciaFilterChange(): void {
    this.filters.subdependenciaId = '';
  }

  onMarcaFilterChange(): void {
    this.filters.modelo = '';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.mobileSearchTerm = '';
    this.filters = {
      sedeId: '',
      dependenciaId: '',
      subdependenciaId: '',
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
      Referencia: item.referencia ?? '',
      Conexion: item.tipoConexion,
      IP: item.ip ?? '',
      Sede: item.sede?.nombre ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Subdependencia: item.subdependencia?.nombre ?? '',
      Estado: item.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 18 }, { wch: 26 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 26 },
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
    ].filter(Boolean).join(' / ') || item.sede?.nombre || 'Pendiente de clasificar';
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

  private compareConNullsAlFinal(a: string | null | undefined, b: string | null | undefined): number {
    const aVacio = !a;
    const bVacio = !b;
    if (aVacio && bVacio) return 0;
    if (aVacio) return 1;
    if (bVacio) return -1;
    return a!.localeCompare(b!, 'es', { sensitivity: 'base' });
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
