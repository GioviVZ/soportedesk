import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { EquipoRedFormComponent } from './equipo-red-form.component';
import {
  EQUIPO_RED_ESTADOS,
  EquipoRed,
  EquipoRedResumen,
  EstadoEquipoRed,
  TIPO_EQUIPO_RED_META,
  TipoEquipoRed,
  equipoRedEstadoTone,
} from './equipo-red.model';
import { EquipoRedService } from './equipo-red.service';

interface EquipoRedTableRow extends EquipoRed {
  codigoDisplay: string;
  enlaceDisplay: string;
}

const EMPTY_RESUMEN: EquipoRedResumen = {
  total: 0,
  operativos: 0,
  enRevision: 0,
  inactivos: 0,
  deBaja: 0,
  sedes: 0,
};

const DESCRIPCIONES: Record<TipoEquipoRed, string> = {
  SWITCH: 'Inventario de switches por sede, con IP, MAC y ubicación del gabinete.',
  ROUTER: 'Inventario de routers y enlaces de salida por sede.',
  ACCESS_POINT: 'Puntos de acceso inalámbrico, su ubicación y configuración de red.',
  RADIOENLACE: 'Enlaces punto a punto entre sedes y sus equipos asociados.',
};

@Component({
  selector: 'app-equipos-red-page',
  imports: [
    FormsModule,
    GenericTableComponent,
    ModalComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    MapPreviewComponent,
    EquipoRedFormComponent,
  ],
  templateUrl: './equipos-red-page.component.html',
  styleUrl: './equipos-red-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EquiposRedPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EquipoRedService);
  private readonly authService = inject(AuthService);

  readonly tipo = this.route.snapshot.data['tipo'] as TipoEquipoRed;
  readonly meta = TIPO_EQUIPO_RED_META[this.tipo];
  readonly descripcion = DESCRIPCIONES[this.tipo];
  readonly estados = EQUIPO_RED_ESTADOS;
  readonly equipoRedEstadoTone = equipoRedEstadoTone;

  items: EquipoRed[] = [];
  resumen: EquipoRedResumen = { ...EMPTY_RESUMEN };
  searchTerm = '';
  sedeFilter = '';
  estadoFilter = '';
  loading = false;
  loadError = '';
  actionError = '';
  deletingNow = false;

  viewing: EquipoRed | null = null;
  mapItem: EquipoRed | null = null;
  editing: EquipoRed | null = null;
  deleting: EquipoRed | null = null;
  formOpen = false;

  get canWrite(): boolean {
    return this.authService.canWrite('equipos-red');
  }

  // Campos (no getters): GenericTable rastrea filas y columnas por identidad,
  // así que deben mantener la misma referencia entre ciclos de detección.
  readonly columns: TableColumn[] = [
    { key: 'codigoDisplay', label: 'Código' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'ip', label: 'IP' },
    this.tipo === 'RADIOENLACE'
      ? { key: 'enlaceDisplay', label: 'Enlace' }
      : { key: 'mac', label: 'MAC' },
  ];

  private rowsCache: {
    items: EquipoRed[];
    search: string;
    sede: string;
    estado: string;
    rows: EquipoRedTableRow[];
  } | null = null;

  get sedesDisponibles(): { id: number; nombre: string }[] {
    const sedes = new Map<number, string>();
    for (const item of this.items) {
      if (item.sede) sedes.set(item.sede.id, item.sede.nombre);
    }
    return Array.from(sedes, ([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }

  get filteredItems(): EquipoRed[] {
    const search = this.normalize(this.searchTerm);
    return this.items.filter((item) => {
      if (this.sedeFilter && String(item.sede?.id ?? '') !== this.sedeFilter) return false;
      if (this.estadoFilter && item.estado !== this.estadoFilter) return false;
      if (!search) return true;

      return this.normalize([
        item.etiqueta,
        item.codigoInventario,
        item.codigoPatrimonial,
        item.serie,
        item.marca,
        item.modelo,
        item.ip,
        item.mac,
        item.host,
        item.sede?.nombre,
        item.dependencia?.nombre,
        item.referencia,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get tableRows(): EquipoRedTableRow[] {
    const cache = this.rowsCache;
    if (
      cache
      && cache.items === this.items
      && cache.search === this.searchTerm
      && cache.sede === this.sedeFilter
      && cache.estado === this.estadoFilter
    ) {
      return cache.rows;
    }
    const rows = this.filteredItems.map((item) => ({
      ...item,
      codigoDisplay: this.identifier(item),
      enlaceDisplay: this.enlace(item),
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

  get hasActiveFilters(): boolean {
    return Boolean(this.searchTerm || this.sedeFilter || this.estadoFilter);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      items: this.service.getAll(this.tipo),
      resumen: this.service.getResumen(this.tipo),
    }).subscribe({
      next: ({ items, resumen }) => {
        this.items = items;
        this.resumen = resumen;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.resumen = { ...EMPTY_RESUMEN };
        this.loading = false;
        this.loadError = `No se pudieron cargar los ${this.meta.plural.toLowerCase()}.`;
      },
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.sedeFilter = '';
    this.estadoFilter = '';
  }

  onView(item: EquipoRed): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  openMap(item: EquipoRed): void {
    if (item.latitud === null || item.longitud === null) return;
    this.mapItem = item;
  }

  closeMap(): void {
    this.mapItem = null;
  }

  onAdd(): void {
    if (!this.canWrite) return;
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: EquipoRed): void {
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

  onDelete(item: EquipoRed): void {
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
        this.actionError = error?.error?.message || 'No se pudo eliminar el equipo.';
      },
    });
  }

  identifier(item: EquipoRed): string {
    return item.etiqueta || item.codigoInventario || item.codigoPatrimonial || 'Sin código';
  }

  enlace(item: EquipoRed): string {
    return [
      item.remotoSede?.nombre,
      item.frecuenciaGhz !== null ? `${item.frecuenciaGhz} GHz` : null,
    ].filter(Boolean).join(' · ') || '—';
  }

  mapUrl(item: EquipoRed): string {
    return `https://www.google.com/maps?q=${item.latitud},${item.longitud}`;
  }

  mapAriaLabel(item: EquipoRed): string {
    return `Ver ${item.etiqueta || this.identifier(item)} en el mapa`;
  }

  locationSummary(item: EquipoRed): string {
    return [
      item.sede?.nombre,
      item.dependencia?.nombre,
      item.referencia,
      item.edificio ? `Edificio ${item.edificio}` : null,
      item.piso ? `Piso ${item.piso}` : null,
      item.gabinete ? `Gabinete ${item.gabinete}` : null,
    ].filter(Boolean).join(' · ') || 'Sin detalles adicionales de ubicación';
  }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      Código: this.identifier(item),
      Sede: item.sede?.nombre ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Marca: item.marca,
      Modelo: item.modelo,
      IP: item.ip ?? '',
      ...(this.tipo === 'RADIOENLACE'
        ? { Enlace: this.enlace(item) }
        : { MAC: item.mac ?? '' }),
      Estado: item.estado,
      Mapa: item.latitud !== null && item.longitud !== null ? this.mapUrl(item) : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 24 }, { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 22 },
      { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 48 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, this.meta.plural.slice(0, 31));
    XLSX.writeFile(workbook, `equipos-red-${this.tipo.toLowerCase()}-${this.exportDate()}.xlsx`);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private exportDate(): string {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
