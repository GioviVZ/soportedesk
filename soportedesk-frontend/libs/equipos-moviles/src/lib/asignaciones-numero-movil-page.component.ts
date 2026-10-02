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
import { AsignacionNumeroMovilFormComponent } from './asignacion-numero-movil-form.component';
import {
  AsignacionNumeroMovil,
  AsignacionNumeroMovilRequest,
  AsignacionNumeroMovilResumen,
  EstadoAsignacionMovil,
  OperadorMovil,
} from './asignacion-numero-movil.model';
import { AsignacionNumeroMovilService } from './asignacion-numero-movil.service';
import { EquipoMovil } from './equipo-movil.model';
import { EquipoMovilService } from './equipo-movil.service';
import {
  asignacionEstadoTone,
  equipoIdentifier,
  exportDate,
  formatDate,
  formatMobileNumber,
  normalizeText,
  todayIso,
} from './moviles-shared';

interface AsignacionTableRow extends AsignacionNumeroMovil {
  numeroDisplay: string;
  operadorDisplay: string;
  equipoDisplay: string;
  personaDisplay: string;
  vigenciaDisplay: string;
}

const EMPTY_RESUMEN: AsignacionNumeroMovilResumen = { total: 0, activas: 0, finalizadas: 0, operadores: 0 };

@Component({
  selector: 'app-asignaciones-numero-movil-page',
  imports: [
    FormsModule,
    GenericTableComponent,
    ModalComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    AsignacionNumeroMovilFormComponent,
  ],
  templateUrl: './asignaciones-numero-movil-page.component.html',
  styleUrl: './asignaciones-numero-movil-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AsignacionesNumeroMovilPageComponent implements OnInit {
  private readonly service = inject(AsignacionNumeroMovilService);
  private readonly equipoService = inject(EquipoMovilService);
  private readonly authService = inject(AuthService);

  readonly operadores: OperadorMovil[] = ['Claro', 'Movistar', 'Entel', 'Bitel', 'Otro'];
  readonly estados: EstadoAsignacionMovil[] = ['Activa', 'Finalizada'];
  readonly asignacionEstadoTone = asignacionEstadoTone;
  readonly formatDate = formatDate;
  readonly formatMobileNumber = formatMobileNumber;
  readonly columns: TableColumn[] = [
    { key: 'numeroDisplay', label: 'Número' },
    { key: 'operadorDisplay', label: 'Operador / plan' },
    { key: 'equipoDisplay', label: 'Equipo' },
    { key: 'personaDisplay', label: 'Persona' },
    { key: 'vigenciaDisplay', label: 'Vigencia' },
  ];

  items: AsignacionNumeroMovil[] = [];
  equipos: EquipoMovil[] = [];
  resumen: AsignacionNumeroMovilResumen = { ...EMPTY_RESUMEN };
  searchTerm = '';
  operadorFilter = '';
  estadoFilter = '';
  loading = false;
  loadError = '';
  actionError = '';
  deletingNow = false;
  finishingNow = false;
  fechaFin = todayIso();
  viewing: AsignacionNumeroMovil | null = null;
  editing: AsignacionNumeroMovil | null = null;
  deleting: AsignacionNumeroMovil | null = null;
  finishing: AsignacionNumeroMovil | null = null;
  formOpen = false;

  private rowsCache: {
    items: AsignacionNumeroMovil[];
    search: string;
    operador: string;
    estado: string;
    rows: AsignacionTableRow[];
  } | null = null;

  get canWrite(): boolean { return this.authService.canWrite('equipos-moviles'); }

  get filteredItems(): AsignacionNumeroMovil[] {
    const search = normalizeText(this.searchTerm);
    return this.items.filter((item) => {
      if (this.operadorFilter && item.operador !== this.operadorFilter) return false;
      if (this.estadoFilter && item.estado !== this.estadoFilter) return false;
      if (!search) return true;
      return normalizeText([
        item.numero,
        item.personaNombre,
        item.personaDni,
        item.dependencia?.nombre,
        item.equipoMovil.marca,
        item.equipoMovil.modelo,
        item.equipoMovil.imei1,
        item.equipoMovil.imei2,
        item.simIccid,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get tableRows(): AsignacionTableRow[] {
    const cache = this.rowsCache;
    if (
      cache
      && cache.items === this.items
      && cache.search === this.searchTerm
      && cache.operador === this.operadorFilter
      && cache.estado === this.estadoFilter
    ) return cache.rows;
    const rows = this.filteredItems.map((item) => ({
      ...item,
      numeroDisplay: formatMobileNumber(item.numero),
      operadorDisplay: [item.operador, item.plan].filter(Boolean).join(' · '),
      equipoDisplay: `${item.equipoMovil.marca} ${item.equipoMovil.modelo} · ${item.equipoMovil.imei1 || 'Sin IMEI'}`,
      personaDisplay: [item.personaNombre, item.personaDni].filter(Boolean).join(' · DNI '),
      vigenciaDisplay: item.fechaFin
        ? `${formatDate(item.fechaInicio)} – ${formatDate(item.fechaFin)}`
        : `Desde ${formatDate(item.fechaInicio)}`,
    }));
    this.rowsCache = {
      items: this.items,
      search: this.searchTerm,
      operador: this.operadorFilter,
      estado: this.estadoFilter,
      rows,
    };
    return rows;
  }

  get hasActiveFilters(): boolean { return Boolean(this.searchTerm || this.operadorFilter || this.estadoFilter); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      items: this.service.getAll(),
      resumen: this.service.getResumen(),
      equipos: this.equipoService.getAll(),
    }).subscribe({
      next: ({ items, resumen, equipos }) => {
        this.items = items;
        this.resumen = resumen;
        this.equipos = equipos;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.equipos = [];
        this.resumen = { ...EMPTY_RESUMEN };
        this.loading = false;
        this.loadError = 'No se pudieron cargar las asignaciones de número.';
      },
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.operadorFilter = '';
    this.estadoFilter = '';
  }
  onView(item: AsignacionNumeroMovil): void { this.viewing = item; }
  closeView(): void { this.viewing = null; }
  onAdd(): void {
    if (!this.canWrite) return;
    this.editing = null;
    this.formOpen = true;
  }
  onEdit(item: AsignacionNumeroMovil): void {
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
  onDelete(item: AsignacionNumeroMovil): void {
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
    this.service.delete(this.deleting.id).subscribe({
      next: () => {
        this.deletingNow = false;
        this.deleting = null;
        this.load();
      },
      error: (error) => {
        this.deletingNow = false;
        this.actionError = error?.error?.message || 'No se pudo eliminar la asignación.';
      },
    });
  }

  openFinish(item: AsignacionNumeroMovil): void {
    if (!this.canWrite || item.estado !== 'Activa') return;
    this.actionError = '';
    this.fechaFin = todayIso();
    this.finishing = item;
  }
  closeFinish(): void {
    if (this.finishingNow) return;
    this.finishing = null;
    this.actionError = '';
  }
  confirmFinish(): void {
    if (!this.finishing || this.finishingNow || !this.fechaFin || this.fechaFin < this.finishing.fechaInicio) return;
    this.finishingNow = true;
    this.actionError = '';
    const request: AsignacionNumeroMovilRequest = {
      equipoMovilId: this.finishing.equipoMovil.id,
      numero: this.finishing.numero,
      operador: this.finishing.operador,
      plan: this.finishing.plan ?? '',
      simIccid: this.finishing.simIccid ?? '',
      personaNombre: this.finishing.personaNombre,
      personaDni: this.finishing.personaDni ?? '',
      dependenciaId: this.finishing.dependencia?.id ?? null,
      fechaInicio: this.finishing.fechaInicio,
      fechaFin: this.fechaFin,
      estado: 'Finalizada',
      observaciones: this.finishing.observaciones ?? '',
    };
    this.service.update(this.finishing.id, request).subscribe({
      next: () => {
        this.finishingNow = false;
        this.finishing = null;
        this.load();
      },
      error: (error) => {
        this.finishingNow = false;
        this.actionError = error?.error?.message || 'No se pudo finalizar la asignación.';
      },
    });
  }

  equipoCodigo(item: AsignacionNumeroMovil): string { return equipoIdentifier(item.equipoMovil); }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      Número: formatMobileNumber(item.numero),
      Operador: item.operador,
      Plan: item.plan ?? '',
      Equipo: `${item.equipoMovil.marca} ${item.equipoMovil.modelo}`,
      IMEI: item.equipoMovil.imei1 ?? '',
      Persona: item.personaNombre,
      DNI: item.personaDni ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Inicio: formatDate(item.fechaInicio),
      Fin: item.fechaFin ? formatDate(item.fechaFin) : '',
      Estado: item.estado,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 28 },
      { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');
    XLSX.writeFile(workbook, `equipos-moviles-asignaciones-${exportDate()}.xlsx`);
  }
}
