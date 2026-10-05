import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@soportedesk/core';
import {
  GenericTableComponent,
  ModalComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  TableColumn,
} from '@soportedesk/ui';
import { MapPreviewComponent } from '@soportedesk/ui/map';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { AsignacionAnexo } from './asignacion-anexo.model';
import { AsignacionAnexoService } from './asignacion-anexo.service';
import { TelefonoFijoFormComponent } from './telefono-fijo-form.component';
import {
  EstadoTelefonoFijo,
  TelefonoFijo,
  TelefonoFijoResumen,
  TipoTelefonoFijo,
} from './telefono-fijo.model';
import { TelefonoFijoService } from './telefono-fijo.service';
import {
  TELEFONO_FIJO_ESTADOS,
  TIPO_TELEFONO_FIJO_LABEL,
  exportDate,
  normalizeText,
  telefonoFijoEstadoTone,
  telefonoIdentifier,
} from './telefonia-fija-shared';

interface TelefonoFijoTableRow extends TelefonoFijo {
  codigoDisplay: string;
  equipoDisplay: string;
  tipoDisplay: string;
  redDisplay: string;
  asignacionDisplay: string;
}

const EMPTY_RESUMEN: TelefonoFijoResumen = { total: 0, operativos: 0, enRevision: 0, sinAsignar: 0 };

@Component({
  selector: 'app-telefonia-fija-inventario-page',
  imports: [
    FormsModule,
    GenericTableComponent,
    ModalComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    MapPreviewComponent,
    TelefonoFijoFormComponent,
  ],
  templateUrl: './telefonia-fija-inventario-page.component.html',
  styleUrl: './telefonia-fija-inventario-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TelefoniaFijaInventarioPageComponent implements OnInit {
  private readonly telefonoService = inject(TelefonoFijoService);
  private readonly asignacionService = inject(AsignacionAnexoService);
  private readonly authService = inject(AuthService);

  readonly estados = TELEFONO_FIJO_ESTADOS;
  readonly tipos: { value: TipoTelefonoFijo; label: string }[] = [
    { value: 'IP', label: 'Teléfono IP' },
    { value: 'ANALOGICO', label: 'Analógico' },
    { value: 'INALAMBRICO', label: 'Inalámbrico' },
  ];
  readonly telefonoFijoEstadoTone = telefonoFijoEstadoTone;
  readonly tipoLabel = TIPO_TELEFONO_FIJO_LABEL;
  readonly columns: TableColumn[] = [
    { key: 'codigoDisplay', label: 'Código' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'equipoDisplay', label: 'Equipo' },
    { key: 'tipoDisplay', label: 'Tipo' },
    { key: 'redDisplay', label: 'Red' },
    { key: 'asignacionDisplay', label: 'Anexo asignado' },
  ];

  items: TelefonoFijo[] = [];
  activeAssignments: AsignacionAnexo[] = [];
  resumen: TelefonoFijoResumen = { ...EMPTY_RESUMEN };
  searchTerm = '';
  sedeFilter = '';
  tipoFilter = '';
  estadoFilter = '';
  loading = false;
  loadError = '';
  actionError = '';
  deletingNow = false;
  viewing: TelefonoFijo | null = null;
  mapItem: TelefonoFijo | null = null;
  editing: TelefonoFijo | null = null;
  deleting: TelefonoFijo | null = null;
  formOpen = false;

  private rowsCache: {
    items: TelefonoFijo[];
    assignments: AsignacionAnexo[];
    search: string;
    sede: string;
    tipo: string;
    estado: string;
    rows: TelefonoFijoTableRow[];
  } | null = null;

  get canWrite(): boolean {
    return this.authService.canWrite('telefonia-fija');
  }

  get sedesDisponibles(): { id: number; nombre: string }[] {
    const sedes = new Map<number, string>();
    for (const item of this.items) if (item.sede) sedes.set(item.sede.id, item.sede.nombre);
    return Array.from(sedes, ([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }

  get filteredItems(): TelefonoFijo[] {
    const search = normalizeText(this.searchTerm);
    return this.items.filter((item) => {
      if (this.sedeFilter && String(item.sede?.id ?? '') !== this.sedeFilter) return false;
      if (this.tipoFilter && item.tipo !== this.tipoFilter) return false;
      if (this.estadoFilter && item.estado !== this.estadoFilter) return false;
      if (!search) return true;
      const assignment = this.assignmentFor(item);
      return normalizeText([
        item.codigoInventario,
        item.codigoPatrimonial,
        item.serie,
        item.mac,
        item.ip,
        item.host,
        item.marca,
        item.modelo,
        item.sede?.nombre,
        item.dependencia?.nombre,
        item.referencia,
        assignment?.anexo,
        assignment?.numeroDirecto,
        assignment?.personaNombre,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get tableRows(): TelefonoFijoTableRow[] {
    const cache = this.rowsCache;
    if (
      cache
      && cache.items === this.items
      && cache.assignments === this.activeAssignments
      && cache.search === this.searchTerm
      && cache.sede === this.sedeFilter
      && cache.tipo === this.tipoFilter
      && cache.estado === this.estadoFilter
    ) return cache.rows;
    const rows = this.filteredItems.map((item) => ({
      ...item,
      codigoDisplay: telefonoIdentifier(item),
      equipoDisplay: `${item.marca} ${item.modelo}`.trim(),
      tipoDisplay: TIPO_TELEFONO_FIJO_LABEL[item.tipo],
      redDisplay: [item.ip, item.mac].filter(Boolean).join(' · ') || '—',
      asignacionDisplay: this.assignmentDisplay(item),
    }));
    this.rowsCache = {
      items: this.items,
      assignments: this.activeAssignments,
      search: this.searchTerm,
      sede: this.sedeFilter,
      tipo: this.tipoFilter,
      estado: this.estadoFilter,
      rows,
    };
    return rows;
  }

  get hasActiveFilters(): boolean {
    return Boolean(this.searchTerm || this.sedeFilter || this.tipoFilter || this.estadoFilter);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      items: this.telefonoService.getAll(),
      resumen: this.telefonoService.getResumen(),
      assignments: this.asignacionService.getAll({ estado: 'Activa' }),
    }).subscribe({
      next: ({ items, resumen, assignments }) => {
        this.items = items;
        this.resumen = resumen;
        this.activeAssignments = assignments;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.activeAssignments = [];
        this.resumen = { ...EMPTY_RESUMEN };
        this.loading = false;
        this.loadError = 'No se pudo cargar el inventario de telefonía fija.';
      },
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.sedeFilter = '';
    this.tipoFilter = '';
    this.estadoFilter = '';
  }

  onView(item: TelefonoFijo): void { this.viewing = item; }
  closeView(): void { this.viewing = null; }
  openMap(item: TelefonoFijo): void {
    if (item.latitud === null || item.longitud === null) return;
    this.mapItem = item;
  }
  closeMap(): void { this.mapItem = null; }
  onAdd(): void {
    if (!this.canWrite) return;
    this.editing = null;
    this.formOpen = true;
  }
  onEdit(item: TelefonoFijo): void {
    if (!this.canWrite) return;
    this.viewing = null;
    this.editing = item;
    this.formOpen = true;
  }
  closeForm(): void {
    this.formOpen = false;
    this.editing = null;
  }
  onSaved(): void {
    this.closeForm();
    this.load();
  }
  onDelete(item: TelefonoFijo): void {
    if (!this.canWrite) return;
    this.actionError = '';
    this.deleting = item;
  }
  closeDelete(): void {
    if (this.deletingNow) return;
    this.deleting = null;
    this.actionError = '';
  }
  confirmDelete(): void {
    if (!this.deleting || this.deletingNow) return;
    this.deletingNow = true;
    this.actionError = '';
    this.telefonoService.delete(this.deleting.id).subscribe({
      next: () => {
        this.deletingNow = false;
        this.deleting = null;
        this.load();
      },
      error: (error) => {
        this.deletingNow = false;
        this.actionError = error?.error?.message || 'No se pudo eliminar el teléfono fijo.';
      },
    });
  }

  identifier(item: TelefonoFijo): string { return telefonoIdentifier(item); }
  assignmentFor(item: TelefonoFijo): AsignacionAnexo | null {
    return this.activeAssignments.find((assignment) => assignment.telefonoFijo.id === item.id) ?? null;
  }
  assignmentDisplay(item: TelefonoFijo): string {
    const assignment = this.assignmentFor(item);
    if (!assignment) return 'Sin asignar';
    const numero = [assignment.anexo, assignment.numeroDirecto].filter(Boolean).join(' · ');
    return `${numero} · ${assignment.personaNombre}`;
  }
  mapUrl(item: TelefonoFijo): string { return `https://www.google.com/maps?q=${item.latitud},${item.longitud}`; }
  locationSummary(item: TelefonoFijo): string {
    return [
      item.sede?.nombre,
      item.dependencia?.nombre,
      item.referencia,
      item.edificio ? `Edificio ${item.edificio}` : null,
      item.piso ? `Piso ${item.piso}` : null,
    ].filter(Boolean).join(' · ') || 'Sin detalles adicionales de ubicación';
  }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      Código: this.identifier(item),
      Sede: item.sede?.nombre ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Equipo: `${item.marca} ${item.modelo}`,
      Tipo: TIPO_TELEFONO_FIJO_LABEL[item.tipo],
      Serie: item.serie ?? '',
      IP: item.ip ?? '',
      MAC: item.mac ?? '',
      Host: item.host ?? '',
      'Anexo asignado': this.assignmentDisplay(item),
      Estado: item.estado,
      Mapa: item.latitud !== null && item.longitud !== null ? this.mapUrl(item) : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 20 },
      { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 34 }, { wch: 16 }, { wch: 48 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    XLSX.writeFile(workbook, `telefonia-fija-inventario-${exportDate()}.xlsx`);
  }
}
