import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@soportedesk/core';
import { GenericTableComponent, ModalComponent, SectionCardComponent, TableColumn } from '@soportedesk/ui';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { ActaMovilFormComponent } from './acta-movil-form.component';
import { ActaMovil, ActaMovilResumen, TipoActaMovil } from './acta-movil.model';
import { ActaMovilService } from './acta-movil.service';
import { EquipoMovil } from './equipo-movil.model';
import { EquipoMovilService } from './equipo-movil.service';
import { equipoIdentifier, exportDate, formatDate, normalizeText } from './moviles-shared';

interface ActaTableRow extends ActaMovil {
  fechaDisplay: string;
  responsableDisplay: string;
  equiposDisplay: string;
}

const EMPTY_RESUMEN: ActaMovilResumen = { total: 0, entregas: 0, devoluciones: 0, transferencias: 0 };

@Component({
  selector: 'app-actas-moviles-page',
  imports: [FormsModule, GenericTableComponent, ModalComponent, SectionCardComponent, ActaMovilFormComponent],
  templateUrl: './actas-moviles-page.component.html',
  styleUrl: './actas-moviles-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ActasMovilesPageComponent implements OnInit {
  private readonly service = inject(ActaMovilService);
  private readonly equipoService = inject(EquipoMovilService);
  private readonly authService = inject(AuthService);

  readonly tipos: TipoActaMovil[] = ['Entrega', 'Devolución', 'Transferencia'];
  readonly formatDate = formatDate;
  readonly equipoIdentifier = equipoIdentifier;
  readonly columns: TableColumn[] = [
    { key: 'numeroActa', label: 'N.º de acta' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'fechaDisplay', label: 'Fecha' },
    { key: 'responsableDisplay', label: 'Responsable' },
    { key: 'equiposDisplay', label: 'Equipos' },
  ];

  items: ActaMovil[] = [];
  equipos: EquipoMovil[] = [];
  resumen: ActaMovilResumen = { ...EMPTY_RESUMEN };
  searchTerm = '';
  tipoFilter = '';
  desdeFilter = '';
  hastaFilter = '';
  loading = false;
  loadError = '';
  actionError = '';
  deletingNow = false;
  viewing: ActaMovil | null = null;
  editing: ActaMovil | null = null;
  deleting: ActaMovil | null = null;
  formOpen = false;

  private rowsCache: {
    items: ActaMovil[];
    search: string;
    tipo: string;
    desde: string;
    hasta: string;
    rows: ActaTableRow[];
  } | null = null;

  get canWrite(): boolean { return this.authService.canWrite('equipos-moviles'); }

  get filteredItems(): ActaMovil[] {
    const search = normalizeText(this.searchTerm);
    return this.items.filter((item) => {
      if (this.tipoFilter && item.tipo !== this.tipoFilter) return false;
      if (this.desdeFilter && item.fecha < this.desdeFilter) return false;
      if (this.hastaFilter && item.fecha > this.hastaFilter) return false;
      if (!search) return true;
      return normalizeText([
        item.numeroActa,
        item.personaNombre,
        item.personaDni,
        item.dependencia?.nombre,
        ...item.equipos.flatMap((equipo) => [
          equipoIdentifier(equipo),
          equipo.marca,
          equipo.modelo,
          equipo.imei1,
        ]),
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get tableRows(): ActaTableRow[] {
    const cache = this.rowsCache;
    if (
      cache
      && cache.items === this.items
      && cache.search === this.searchTerm
      && cache.tipo === this.tipoFilter
      && cache.desde === this.desdeFilter
      && cache.hasta === this.hastaFilter
    ) return cache.rows;
    const rows = this.filteredItems.map((item) => ({
      ...item,
      fechaDisplay: formatDate(item.fecha),
      responsableDisplay: [item.personaNombre, item.personaDni ? `DNI ${item.personaDni}` : null].filter(Boolean).join(' · '),
      equiposDisplay: `${item.equipos.length} equipo${item.equipos.length === 1 ? '' : 's'}${item.equipos[0] ? ` · ${item.equipos[0].marca} ${item.equipos[0].modelo}` : ''}`,
    }));
    this.rowsCache = {
      items: this.items,
      search: this.searchTerm,
      tipo: this.tipoFilter,
      desde: this.desdeFilter,
      hasta: this.hastaFilter,
      rows,
    };
    return rows;
  }

  get hasActiveFilters(): boolean { return Boolean(this.searchTerm || this.tipoFilter || this.desdeFilter || this.hastaFilter); }

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
        this.loadError = 'No se pudieron cargar las actas de equipos móviles.';
      },
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.tipoFilter = '';
    this.desdeFilter = '';
    this.hastaFilter = '';
  }
  onView(item: ActaMovil): void { this.viewing = item; }
  closeView(): void { this.viewing = null; }
  onAdd(): void {
    if (!this.canWrite) return;
    this.editing = null;
    this.formOpen = true;
  }
  onEdit(item: ActaMovil): void {
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
  onDelete(item: ActaMovil): void {
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
        this.actionError = error?.error?.message || 'No se pudo eliminar el acta.';
      },
    });
  }

  download(item: ActaMovil): void {
    this.actionError = '';
    this.service.downloadArchivo(item.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = item.archivoNombre || `acta-${item.numeroActa}`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.actionError = error?.error?.message || 'No se pudo descargar el archivo del acta.';
      },
    });
  }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      'N.º de acta': item.numeroActa,
      Tipo: item.tipo,
      Fecha: formatDate(item.fecha),
      Responsable: item.personaNombre,
      DNI: item.personaDni ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Equipos: item.equipos.map((equipo) => `${equipoIdentifier(equipo)} · ${equipo.marca} ${equipo.modelo}`).join('; '),
      Archivo: item.archivoNombre ?? '',
      Observaciones: item.observaciones ?? '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 12 },
      { wch: 28 }, { wch: 52 }, { wch: 28 }, { wch: 42 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Actas');
    XLSX.writeFile(workbook, `equipos-moviles-actas-${exportDate()}.xlsx`);
  }
}
