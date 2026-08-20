import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { EquipoKpis, EquipoResumen, EquipoSoftwareExport } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoDetailComponent } from './equipo-detail.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import * as XLSX from 'xlsx';

interface EquipoTableRow extends EquipoResumen {
  usuarioLimpio: string;
  fabricanteModelo: string;
  cpuCorto: string;
  ramLabel: string;
  diskLabel: string;
}

@Component({
    selector: 'app-equipos-inventario',
    imports: [FormsModule, GenericTableComponent, ModalComponent, EquipoDetailComponent],
    templateUrl: './equipos-inventario.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './equipos.shared.scss'
})
export class EquiposInventarioComponent implements OnInit {
  private service = inject(EquipoService);

  items = signal<EquipoTableRow[]>([]);
  kpis = signal<EquipoKpis | null>(null);
  sedes = signal<string[]>([]);
  tipos = signal<string[]>([]);
  dependencias = signal<string[]>([]);
  subdependencias = signal<string[]>([]);
  fabricantes = signal<string[]>([]);
  selectedSede = signal('');
  selectedTipo = signal('');
  selectedDependencia = signal('');
  selectedSubdependencia = signal('');
  selectedFabricante = signal('');
  selectedModelo = signal('');
  ipFilter = signal('');
  searchTerm = signal('');
  viewingId = signal<number | null>(null);
  viewingName = signal('');
  exporting = signal(false);

  kpiCards = computed(() => {
    const k = this.kpis();
    return [
      { label: 'Total Activos', value: k?.totalActivos ?? 0, tone: 'blue' },
      { label: 'Desktop', value: k?.desktopCount ?? 0, tone: 'indigo' },
      { label: 'Laptop', value: k?.laptopCount ?? 0, tone: 'violet' },
      { label: 'All in One', value: k?.allInOneCount ?? 0, tone: 'gray' },
      { label: 'Sede Central', value: k?.sedeCentralCount ?? 0, tone: 'green' },
      { label: 'EEAs', value: k?.eeasCount ?? 0, tone: 'orange' },
    ];
  });

  columns: TableColumn[] = [
    { key: 'nombreEquipo', label: 'Equipo' },
    { key: 'usuarioLimpio', label: 'Usuario' },
    { key: 'sedeNombre', label: 'Sede' },
    { key: 'tipoEquipo', label: 'Tipo' },
    { key: 'fabricanteModelo', label: 'Fabricante / Modelo' },
    { key: 'numeroserie', label: 'Serie' },
    { key: 'ipEquipo', label: 'IP' },
    { key: 'anydeskId', label: 'AnyDesk ID' },
    { key: 'rustdeskId', label: 'RustDesk ID' },
  ];

  filteredItems = computed(() => {
    const search = this.normalize(this.searchTerm());
    const ip = this.normalize(this.ipFilter());
    const sede = this.selectedSede();
    const tipo = this.selectedTipo();
    const dependencia = this.selectedDependencia();
    const subdependencia = this.selectedSubdependencia();
    const fabricante = this.selectedFabricante();
    const modelo = this.selectedModelo();

    return this.items().filter((item) => {
      if (sede && item.sedeNombre !== sede) return false;
      if (tipo && item.tipoEquipo !== tipo) return false;
      if (dependencia && item.oficinaId !== dependencia) return false;
      if (subdependencia && item.unidadId !== subdependencia) return false;
      if (fabricante && item.fabricanteEquipo !== fabricante) return false;
      if (modelo && item.modeloEquipo !== modelo) return false;
      if (ip && !this.normalize(item.ipEquipo).includes(ip)) return false;
      if (!search) return true;

      return this.normalize([
        item.nombreEquipo,
        item.usuarioLimpio,
        item.usuarioContacto,
        item.sedeNombre,
        item.oficinaId,
        item.unidadId,
        item.tipoEquipo,
        item.fabricanteEquipo,
        item.modeloEquipo,
        item.fabricanteModelo,
        item.cpuModelos,
        item.ramLabel,
        item.diskLabel,
        item.ipEquipo,
        item.numeroserie,
        item.codigoInterno,
      ].filter(Boolean).join(' ')).includes(search);
    });
  });

  modelos = computed(() => this.unique(
    this.items()
      .filter((item) => !this.selectedFabricante() || item.fabricanteEquipo === this.selectedFabricante())
      .map((item) => item.modeloEquipo)
  ));

  hasActiveFilters = computed(() => Boolean(
    this.searchTerm() ||
      this.selectedSede() ||
      this.selectedTipo() ||
      this.selectedDependencia() ||
      this.selectedSubdependencia() ||
      this.selectedFabricante() ||
      this.selectedModelo() ||
      this.ipFilter()
  ));

  ngOnInit(): void {
    this.loadKpis();
    this.loadSedes();
    this.loadTipos();
    this.loadDependencias();
    this.loadFabricantes();
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe((data) => this.items.set(data.map((item) => this.toTableRow(item))));
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onSedeChange(value: string): void {
    this.selectedSede.set(value);
    this.selectedDependencia.set('');
    this.selectedSubdependencia.set('');
    this.subdependencias.set([]);
    this.loadDependencias();
  }

  onTipoChange(value: string): void {
    this.selectedTipo.set(value);
  }

  onDependenciaChange(value: string): void {
    this.selectedDependencia.set(value);
    this.selectedSubdependencia.set('');
    this.loadSubdependencias();
  }

  onSubdependenciaChange(value: string): void {
    this.selectedSubdependencia.set(value);
  }

  onFabricanteChange(value: string): void {
    this.selectedFabricante.set(value);
    this.selectedModelo.set('');
  }

  onModeloChange(value: string): void {
    this.selectedModelo.set(value);
  }

  onIpChange(value: string): void {
    this.ipFilter.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSede.set('');
    this.selectedTipo.set('');
    this.selectedDependencia.set('');
    this.selectedSubdependencia.set('');
    this.selectedFabricante.set('');
    this.selectedModelo.set('');
    this.ipFilter.set('');
    this.loadDependencias();
    this.subdependencias.set([]);
  }

  onView(item: EquipoTableRow): void {
    this.viewingName.set(item.nombreEquipo || 'Equipo');
    this.viewingId.set(item.computerID);
  }

  closeDetail(): void {
    this.viewingId.set(null);
    this.viewingName.set('');
  }

  exportExcel(): void {
    const items = this.filteredItems();
    if (!items.length || this.exporting()) return;
    this.exporting.set(true);
    this.service.getSoftwareForExport(items.map((item) => item.computerID)).subscribe({
      next: (software) => {
        this.writeExcel(items, software);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
      },
    });
  }

  private writeExcel(items: EquipoTableRow[], software: EquipoSoftwareExport[]): void {
    const rows = items.map((item) => ({
      Equipo: item.nombreEquipo ?? '',
      'Usuario asignado': item.usuarioLimpio ?? '',
      'Usuario de red (AD)': item.usuarioContacto ?? '',
      Sede: item.sedeNombre ?? '',
      Dependencia: item.oficinaId ?? '',
      Subdependencia: item.unidadId ?? '',
      Tipo: item.tipoEquipo ?? '',
      Marca: item.fabricanteEquipo ?? '',
      Modelo: item.modeloEquipo ?? '',
      'Número de serie': item.numeroserie ?? '',
      IP: item.ipEquipo ?? '',
      'Código de Inventario': item.codigoInterno ?? '',
      'Código patrimonial': item.codigoPatrimonial ?? '',
      'AnyDesk ID': item.anydeskId ?? '',
      'RustDesk ID': item.rustdeskId ?? '',
      CPU: item.cpuModelos ?? '',
      'RAM GB': item.ramTotalGb ?? '',
      'Disco GB': item.diskTotalGb ?? '',
      'Fecha de alta en GLPI': this.formatExportDate(item.fechaCreacion),
      'Último inventario automático': this.formatExportDate(item.ultimaActualizacion),
      'Meses sin actualizar': this.monthsSince(item.ultimaActualizacion),
      'Estado de actualización': this.isOutdated(item.ultimaActualizacion) ? 'Actualizar registro' : 'Al día',
      'Monitor 1 - Marca': item.monitor1Marca ?? '',
      'Monitor 1 - Modelo': item.monitor1Modelo ?? '',
      'Monitor 1 - Serie': item.monitor1Serie ?? '',
      'Monitor 1 - Código de Inventario': item.monitorCodigoInternoOverride ?? '',
      'Monitor 1 - Código patrimonial': item.monitorCodigoPatrimonial ?? '',
      'Monitor 2 - Marca': item.monitor2Marca ?? '',
      'Monitor 2 - Modelo': item.monitor2Modelo ?? '',
      'Monitor 2 - Serie': item.monitor2Serie ?? '',
      'Monitor 2 - Código de Inventario': item.monitor2CodigoInternoOverride ?? '',
      'Monitor 2 - Código patrimonial': item.monitor2CodigoPatrimonial ?? '',
      'Teclado - Marca': item.tecladoMarca ?? '',
      'Teclado - Modelo': item.tecladoModelo ?? '',
      'Teclado - Serie': item.tecladoNumeroSerie ?? '',
      'Teclado - Código de Inventario': item.tecladoCodigoInventario ?? '',
      'Teclado - Código patrimonial': item.tecladoCodigoPatrimonial ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 24 }, { wch: 24 }, { wch: 18 }, { wch: 32 },
      { wch: 32 }, { wch: 16 }, { wch: 18 }, { wch: 26 }, { wch: 22 },
      { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
      { wch: 38 }, { wch: 10 }, { wch: 10 },
      { wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 24 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipos');

    const equipmentById = new Map(items.map((item) => [item.computerID, item]));
    const softwareRows = software.map((row) => {
      const item = equipmentById.get(row.computerId);
      return {
        Equipo: item?.nombreEquipo ?? '',
        'ID GLPI': row.computerId,
        Usuario: item?.usuarioLimpio ?? '',
        Sede: item?.sedeNombre ?? '',
        Dependencia: item?.oficinaId ?? '',
        Software: row.software ?? '',
        Versión: row.version ?? '',
        'Fecha de instalación': this.formatExportDate(row.fechaInstalacion),
      };
    });
    const softwareWorksheet = XLSX.utils.json_to_sheet(softwareRows, {
      header: ['Equipo', 'ID GLPI', 'Usuario', 'Sede', 'Dependencia', 'Software', 'Versión', 'Fecha de instalación'],
    });
    softwareWorksheet['!cols'] = [
      { wch: 24 }, { wch: 12 }, { wch: 22 }, { wch: 18 },
      { wch: 32 }, { wch: 44 }, { wch: 22 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(workbook, softwareWorksheet, 'Software instalado');
    XLSX.writeFile(workbook, `equipos-${this.exportDate()}.xlsx`);
  }

  private isOutdated(value: string | null): boolean {
    if (!value) return true;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return true;
    const limit = new Date();
    limit.setMonth(limit.getMonth() - 3);
    return date < limit;
  }

  private monthsSince(value: string | null): number | string {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    const now = new Date();
    return Math.max(0, (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()
      - (now.getDate() < date.getDate() ? 1 : 0));
  }

  private formatExportDate(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  private loadKpis(): void {
    this.service.getKpis().subscribe((data) => this.kpis.set(data));
  }

  private loadSedes(): void {
    this.service.getSedes().subscribe((data) => this.sedes.set(data));
  }

  private loadTipos(): void {
    this.service.getTipos().subscribe((data) => this.tipos.set(data));
  }

  private loadDependencias(): void {
    this.service.getDependencias(this.selectedSede() || undefined)
      .subscribe((data) => this.dependencias.set(data));
  }

  private loadSubdependencias(): void {
    this.service.getSubdependencias(
      this.selectedSede() || undefined,
      this.selectedDependencia() || undefined
    ).subscribe((data) => this.subdependencias.set(data));
  }

  private loadFabricantes(): void {
    this.service.getFabricantes().subscribe((data) => this.fabricantes.set(data));
  }

  private toTableRow(item: EquipoResumen): EquipoTableRow {
    return {
      ...item,
      usuarioLimpio: this.stripDomain(item.usuarioContacto),
      fabricanteModelo: [item.fabricanteEquipo, item.modeloEquipo].filter(Boolean).join(' '),
      cpuCorto: this.truncate(item.cpuModelos, 30),
      ramLabel: this.gbLabel(item.ramTotalGb),
      diskLabel: this.gbLabel(item.diskTotalGb),
    };
  }

  private stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  private truncate(value: string | null | undefined, max: number): string {
    const text = value ?? '';
    return text.length > max ? `${text.slice(0, max - 1)}...` : text;
  }

  private gbLabel(value: number | null | undefined): string {
    return value == null ? '' : `${value} GB`;
  }

  private unique(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
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
