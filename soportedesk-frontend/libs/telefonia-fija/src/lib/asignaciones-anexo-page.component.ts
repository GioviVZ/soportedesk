import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, CatalogoService, Sede } from '@soportedesk/core';
import {
  GenericTableComponent,
  ModalComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  TableColumn,
} from '@soportedesk/ui';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { AsignacionAnexoFormComponent } from './asignacion-anexo-form.component';
import {
  AsignacionAnexo,
  AsignacionAnexoRequest,
  AsignacionAnexoResumen,
  EstadoAsignacionAnexo,
} from './asignacion-anexo.model';
import { AsignacionAnexoService } from './asignacion-anexo.service';
import { TelefonoFijo } from './telefono-fijo.model';
import { TelefonoFijoService } from './telefono-fijo.service';
import {
  asignacionEstadoTone,
  exportDate,
  formatDate,
  normalizeText,
  telefonoIdentifier,
  todayIso,
} from './telefonia-fija-shared';

interface AsignacionAnexoTableRow extends AsignacionAnexo {
  anexoDisplay: string;
  telefonoDisplay: string;
  personaDisplay: string;
  dependenciaDisplay: string;
  vigenciaDisplay: string;
}

const EMPTY_RESUMEN: AsignacionAnexoResumen = { total: 0, activas: 0, finalizadas: 0, sedes: 0 };

@Component({
  selector: 'app-asignaciones-anexo-page',
  imports: [
    FormsModule,
    GenericTableComponent,
    ModalComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    AsignacionAnexoFormComponent,
  ],
  templateUrl: './asignaciones-anexo-page.component.html',
  styleUrl: './asignaciones-anexo-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AsignacionesAnexoPageComponent implements OnInit {
  private readonly service = inject(AsignacionAnexoService);
  private readonly telefonoService = inject(TelefonoFijoService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly authService = inject(AuthService);

  readonly estados: EstadoAsignacionAnexo[] = ['Activa', 'Finalizada'];
  readonly asignacionEstadoTone = asignacionEstadoTone;
  readonly formatDate = formatDate;
  readonly columns: TableColumn[] = [
    { key: 'anexoDisplay', label: 'Anexo' },
    { key: 'telefonoDisplay', label: 'Teléfono' },
    { key: 'personaDisplay', label: 'Persona' },
    { key: 'dependenciaDisplay', label: 'Dependencia' },
    { key: 'vigenciaDisplay', label: 'Vigencia' },
  ];

  items: AsignacionAnexo[] = [];
  telefonos: TelefonoFijo[] = [];
  sedes: Sede[] = [];
  resumen: AsignacionAnexoResumen = { ...EMPTY_RESUMEN };
  searchTerm = '';
  sedeFilter = '';
  estadoFilter = '';
  loading = false;
  loadError = '';
  actionError = '';
  deletingNow = false;
  finishingNow = false;
  fechaFin = todayIso();
  viewing: AsignacionAnexo | null = null;
  editing: AsignacionAnexo | null = null;
  deleting: AsignacionAnexo | null = null;
  finishing: AsignacionAnexo | null = null;
  formOpen = false;

  private rowsCache: {
    items: AsignacionAnexo[];
    search: string;
    sede: string;
    estado: string;
    rows: AsignacionAnexoTableRow[];
  } | null = null;

  get canWrite(): boolean { return this.authService.canWrite('telefonia-fija'); }

  get filteredItems(): AsignacionAnexo[] {
    const search = normalizeText(this.searchTerm);
    return this.items.filter((item) => {
      if (this.sedeFilter && String(item.telefonoFijo.sede?.id ?? '') !== this.sedeFilter) return false;
      if (this.estadoFilter && item.estado !== this.estadoFilter) return false;
      if (!search) return true;
      return normalizeText([
        item.anexo,
        item.numeroDirecto,
        item.personaNombre,
        item.personaDni,
        item.dependencia?.nombre,
        telefonoIdentifier(item.telefonoFijo),
        item.telefonoFijo.marca,
        item.telefonoFijo.modelo,
        item.telefonoFijo.serie,
        item.telefonoFijo.ip,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get tableRows(): AsignacionAnexoTableRow[] {
    const cache = this.rowsCache;
    if (
      cache
      && cache.items === this.items
      && cache.search === this.searchTerm
      && cache.sede === this.sedeFilter
      && cache.estado === this.estadoFilter
    ) return cache.rows;
    const rows = this.filteredItems.map((item) => ({
      ...item,
      anexoDisplay: item.numeroDirecto ? `${item.anexo} · ${item.numeroDirecto}` : item.anexo,
      telefonoDisplay: `${item.telefonoFijo.marca} ${item.telefonoFijo.modelo} · ${item.telefonoFijo.ip || 'Sin IP'}`,
      personaDisplay: item.personaDni
        ? `${item.personaNombre} · DNI ${item.personaDni}`
        : item.personaNombre,
      dependenciaDisplay: item.dependencia?.nombre ?? '—',
      vigenciaDisplay: item.fechaFin
        ? `${formatDate(item.fechaInicio)} – ${formatDate(item.fechaFin)}`
        : `Desde ${formatDate(item.fechaInicio)}`,
    }));
    this.rowsCache = {
      items: this.items,
      search: this.searchTerm,
      sede: this.sedeFilter,
      estado: this.estadoFilter,
      rows,
    };
    return rows;
  }

  get hasActiveFilters(): boolean { return Boolean(this.searchTerm || this.sedeFilter || this.estadoFilter); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      items: this.service.getAll(),
      resumen: this.service.getResumen(),
      telefonos: this.telefonoService.getAll(),
      sedes: this.catalogoService.getSedes(),
    }).subscribe({
      next: ({ items, resumen, telefonos, sedes }) => {
        this.items = items;
        this.resumen = resumen;
        this.telefonos = telefonos;
        this.sedes = sedes;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.telefonos = [];
        this.sedes = [];
        this.resumen = { ...EMPTY_RESUMEN };
        this.loading = false;
        this.loadError = 'No se pudieron cargar las asignaciones de anexos.';
      },
    });
  }

  onSedeFilterChange(value: string): void {
    this.sedeFilter = value;
    this.loadAssignments(value ? Number(value) : undefined);
  }

  clearFilters(): void {
    const reloadAssignments = Boolean(this.sedeFilter);
    this.searchTerm = '';
    this.sedeFilter = '';
    this.estadoFilter = '';
    if (reloadAssignments) this.loadAssignments();
  }

  onView(item: AsignacionAnexo): void { this.viewing = item; }
  closeView(): void { this.viewing = null; }
  onAdd(): void {
    if (!this.canWrite) return;
    this.editing = null;
    this.formOpen = true;
  }
  onEdit(item: AsignacionAnexo): void {
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
  onDelete(item: AsignacionAnexo): void {
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
        this.actionError = error?.error?.message || 'No se pudo eliminar la asignación de anexo.';
      },
    });
  }

  openFinish(item: AsignacionAnexo): void {
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
    const request: AsignacionAnexoRequest = {
      telefonoFijoId: this.finishing.telefonoFijo.id,
      anexo: this.finishing.anexo,
      numeroDirecto: this.finishing.numeroDirecto ?? '',
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

  telefonoCodigo(item: AsignacionAnexo): string { return telefonoIdentifier(item.telefonoFijo); }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      Anexo: item.anexo,
      'Número directo': item.numeroDirecto ?? '',
      Teléfono: `${item.telefonoFijo.marca} ${item.telefonoFijo.modelo}`,
      Código: telefonoIdentifier(item.telefonoFijo),
      IP: item.telefonoFijo.ip ?? '',
      Sede: item.telefonoFijo.sede?.nombre ?? '',
      Persona: item.personaNombre,
      DNI: item.personaDni ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Inicio: formatDate(item.fechaInicio),
      Fin: item.fechaFin ? formatDate(item.fechaFin) : '',
      Estado: item.estado,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 22 },
      { wch: 28 }, { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');
    XLSX.writeFile(workbook, `telefonia-fija-asignaciones-${exportDate()}.xlsx`);
  }

  private loadAssignments(sedeId?: number): void {
    this.loading = true;
    this.loadError = '';
    const request = sedeId ? this.service.getAll({ sedeId }) : this.service.getAll();
    request.subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.loading = false;
        this.loadError = 'No se pudieron cargar las asignaciones de anexos.';
      },
    });
  }
}
