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
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { AsignacionNumeroMovil } from './asignacion-numero-movil.model';
import { AsignacionNumeroMovilService } from './asignacion-numero-movil.service';
import { EquipoMovilFormComponent } from './equipo-movil-form.component';
import {
  EquipoMovil,
  EquipoMovilResumen,
  EstadoEquipoMovil,
  TipoEquipoMovil,
} from './equipo-movil.model';
import { EquipoMovilService } from './equipo-movil.service';
import {
  EQUIPO_MOVIL_ESTADOS,
  TIPO_EQUIPO_MOVIL_LABEL,
  equipoIdentifier,
  equipoMovilEstadoTone,
  exportDate,
  normalizeText,
} from './moviles-shared';

interface EquipoMovilTableRow extends EquipoMovil {
  codigoDisplay: string;
  equipoDisplay: string;
  tipoDisplay: string;
  asignacionDisplay: string;
}

const EMPTY_RESUMEN: EquipoMovilResumen = { total: 0, operativos: 0, enRevision: 0, sinAsignar: 0 };

@Component({
  selector: 'app-equipos-moviles-inventario-page',
  imports: [
    FormsModule,
    GenericTableComponent,
    ModalComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    EquipoMovilFormComponent,
  ],
  templateUrl: './equipos-moviles-inventario-page.component.html',
  styleUrl: './equipos-moviles-inventario-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EquiposMovilesInventarioPageComponent implements OnInit {
  private readonly equipoService = inject(EquipoMovilService);
  private readonly asignacionService = inject(AsignacionNumeroMovilService);
  private readonly authService = inject(AuthService);

  readonly estados = EQUIPO_MOVIL_ESTADOS;
  readonly tipos: { value: TipoEquipoMovil; label: string }[] = [
    { value: 'SMARTPHONE', label: 'Smartphone' },
    { value: 'TABLET', label: 'Tablet' },
    { value: 'MODEM', label: 'Módem' },
  ];
  readonly equipoMovilEstadoTone = equipoMovilEstadoTone;
  readonly tipoLabel = TIPO_EQUIPO_MOVIL_LABEL;
  readonly columns: TableColumn[] = [
    { key: 'codigoDisplay', label: 'Código' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'equipoDisplay', label: 'Equipo' },
    { key: 'tipoDisplay', label: 'Tipo' },
    { key: 'imei1', label: 'IMEI' },
    { key: 'asignacionDisplay', label: 'Asignación actual' },
  ];

  items: EquipoMovil[] = [];
  activeAssignments: AsignacionNumeroMovil[] = [];
  resumen: EquipoMovilResumen = { ...EMPTY_RESUMEN };
  searchTerm = '';
  sedeFilter = '';
  tipoFilter = '';
  estadoFilter = '';
  loading = false;
  loadError = '';
  actionError = '';
  deletingNow = false;
  viewing: EquipoMovil | null = null;
  editing: EquipoMovil | null = null;
  deleting: EquipoMovil | null = null;
  formOpen = false;

  private rowsCache: {
    items: EquipoMovil[];
    assignments: AsignacionNumeroMovil[];
    search: string;
    sede: string;
    tipo: string;
    estado: string;
    rows: EquipoMovilTableRow[];
  } | null = null;

  get canWrite(): boolean {
    return this.authService.canWrite('equipos-moviles');
  }

  get sedesDisponibles(): { id: number; nombre: string }[] {
    const sedes = new Map<number, string>();
    for (const item of this.items) if (item.sede) sedes.set(item.sede.id, item.sede.nombre);
    return Array.from(sedes, ([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }

  get filteredItems(): EquipoMovil[] {
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
        item.imei1,
        item.imei2,
        item.serie,
        item.marca,
        item.modelo,
        item.mac,
        item.sede?.nombre,
        item.dependencia?.nombre,
        item.referencia,
        assignment?.personaNombre,
        assignment?.numero,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get tableRows(): EquipoMovilTableRow[] {
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
      codigoDisplay: equipoIdentifier(item),
      equipoDisplay: `${item.marca} ${item.modelo}`.trim(),
      tipoDisplay: TIPO_EQUIPO_MOVIL_LABEL[item.tipo],
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
      items: this.equipoService.getAll(),
      resumen: this.equipoService.getResumen(),
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
        this.loadError = 'No se pudo cargar el inventario de equipos móviles.';
      },
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.sedeFilter = '';
    this.tipoFilter = '';
    this.estadoFilter = '';
  }

  onView(item: EquipoMovil): void { this.viewing = item; }
  closeView(): void { this.viewing = null; }
  onAdd(): void {
    if (!this.canWrite) return;
    this.editing = null;
    this.formOpen = true;
  }
  onEdit(item: EquipoMovil): void {
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
  onDelete(item: EquipoMovil): void {
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
    this.equipoService.delete(this.deleting.id).subscribe({
      next: () => {
        this.deletingNow = false;
        this.deleting = null;
        this.load();
      },
      error: (error) => {
        this.deletingNow = false;
        this.actionError = error?.error?.message || 'No se pudo eliminar el equipo móvil.';
      },
    });
  }

  identifier(item: EquipoMovil): string { return equipoIdentifier(item); }
  assignmentFor(item: EquipoMovil): AsignacionNumeroMovil | null {
    return this.activeAssignments.find((assignment) => assignment.equipoMovil.id === item.id) ?? null;
  }
  assignmentDisplay(item: EquipoMovil): string {
    const assignment = this.assignmentFor(item);
    return assignment ? `${assignment.numero} · ${assignment.personaNombre}` : 'Sin asignar';
  }
  mapUrl(item: EquipoMovil): string { return `https://www.google.com/maps?q=${item.latitud},${item.longitud}`; }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      Código: this.identifier(item),
      Sede: item.sede?.nombre ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Equipo: `${item.marca} ${item.modelo}`,
      Tipo: TIPO_EQUIPO_MOVIL_LABEL[item.tipo],
      'IMEI 1': item.imei1 ?? '',
      'IMEI 2': item.imei2 ?? '',
      'Asignación actual': this.assignmentDisplay(item),
      Estado: item.estado,
      Mapa: item.latitud !== null && item.longitud !== null ? this.mapUrl(item) : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 28 }, { wch: 14 },
      { wch: 18 }, { wch: 18 }, { wch: 32 }, { wch: 16 }, { wch: 48 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    XLSX.writeFile(workbook, `equipos-moviles-inventario-${exportDate()}.xlsx`);
  }
}
