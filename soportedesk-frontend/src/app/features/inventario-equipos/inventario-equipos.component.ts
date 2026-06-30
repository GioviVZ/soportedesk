import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import {
  InventarioDisco,
  InventarioEquipo,
  InventarioMatchManualRequest,
  inventarioMatchLabel,
  inventarioMatchTone,
} from './inventario-equipo.model';
import { InventarioEquipoService } from './inventario-equipo.service';

type InventarioFiltro = 'todos' | 'sinSerial' | 'sinMatch' | 'viejos';
type DetailTab = 'resumen' | 'hardware' | 'red' | 'programas' | 'match';

@Component({
  selector: 'app-inventario-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './inventario-equipos.component.html',
  styleUrl: './inventario-equipos.component.scss',
})
export class InventarioEquiposComponent implements OnInit {
  private readonly service = inject(InventarioEquipoService);
  readonly inventarioMatchLabel = inventarioMatchLabel;
  readonly inventarioMatchTone = inventarioMatchTone;

  items: InventarioEquipo[] = [];
  selected: InventarioEquipo | null = null;
  loading = false;
  matching = false;
  error = '';
  searchTerm = '';
  filtro: InventarioFiltro = 'todos';
  activeTab: DetailTab = 'resumen';
  manualEquipoId: number | null = null;
  manualUsuarioRedId: number | null = null;
  manualVpnId: number | null = null;
  manualNotas = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  get filteredItems(): InventarioEquipo[] {
    return this.items.filter((item) => {
      if (this.filtro === 'sinSerial') {
        return !item.serialEquipo;
      }
      if (this.filtro === 'sinMatch') {
        return item.matchEstado === 'SIN_MATCH';
      }
      if (this.filtro === 'viejos') {
        return this.isOldReport(item);
      }
      return true;
    });
  }

  get totalSinSerial(): number {
    return this.items.filter((item) => !item.serialEquipo).length;
  }

  get totalSinMatch(): number {
    return this.items.filter((item) => item.matchEstado === 'SIN_MATCH').length;
  }

  get totalActualizados(): number {
    return this.items.filter((item) => !this.isOldReport(item)).length;
  }

  load(search = this.searchTerm): void {
    this.loading = true;
    this.error = '';
    this.service.getAll(search).subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el inventario.';
        this.loading = false;
      },
    });
  }

  rematchAll(): void {
    this.matching = true;
    this.error = '';
    this.service.rematchAll(this.searchTerm).subscribe({
      next: (data) => {
        this.items = data;
        this.matching = false;
      },
      error: () => {
        this.error = 'No se pudo recalcular el match.';
        this.matching = false;
      },
    });
  }

  rematchSelected(): void {
    if (!this.selected) return;
    this.matching = true;
    this.service.rematch(this.selected.id).subscribe({
      next: (data) => {
        this.selected = data;
        this.items = this.items.map((item) => (item.id === data.id ? data : item));
        this.matching = false;
      },
      error: () => {
        this.error = 'No se pudo recalcular el match del equipo.';
        this.matching = false;
      },
    });
  }

  saveManualMatch(confirmar = false, ignorar = false): void {
    if (!this.selected) return;
    this.matching = true;
    this.error = '';
    const request: InventarioMatchManualRequest = {
      equipoId: ignorar ? null : this.manualEquipoId,
      usuarioRedId: ignorar ? null : this.manualUsuarioRedId,
      vpnId: ignorar ? null : this.manualVpnId,
      confirmar,
      ignorar,
      notas: this.manualNotas || null,
    };
    this.service.manualMatch(this.selected.id, request).subscribe({
      next: (data) => {
        this.selected = data;
        this.items = this.items.map((item) => (item.id === data.id ? data : item));
        this.syncManualForm(data);
        this.matching = false;
      },
      error: () => {
        this.error = 'No se pudo guardar el ajuste manual.';
        this.matching = false;
      },
    });
  }

  queueSearch(term: string): void {
    this.searchTerm = term;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(term), 300);
  }

  setFiltro(filtro: InventarioFiltro): void {
    this.filtro = filtro;
  }

  openDetail(item: InventarioEquipo): void {
    this.selected = item;
    this.activeTab = 'resumen';
    this.syncManualForm(item);
    this.service.getById(item.id).subscribe({
      next: (data) => {
        this.selected = data;
        this.syncManualForm(data);
      },
      error: () => (this.selected = item),
    });
  }

  closeDetail(): void {
    this.selected = null;
  }

  setTab(tab: DetailTab): void {
    this.activeTab = tab;
  }

  formatDate(value?: string | null): string {
    if (!value) return 'Sin registro';
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  formatBytes(value?: number | null): string {
    if (!value || value <= 0) return 'No registrado';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }
    return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  }

  diskUsage(disco: InventarioDisco): number {
    if (!disco.totalBytes || !disco.libreBytes || disco.totalBytes <= 0) return 0;
    return Math.min(100, Math.max(0, ((disco.totalBytes - disco.libreBytes) / disco.totalBytes) * 100));
  }

  isOldReport(item: InventarioEquipo): boolean {
    if (!item.ultimoReporte) return true;
    const reported = new Date(item.ultimoReporte).getTime();
    const hours = (Date.now() - reported) / 3600000;
    return hours > 24;
  }

  primaryIdentity(item: InventarioEquipo): string {
    return item.hostname || item.serialEquipo || item.agentId || `Inventario #${item.id}`;
  }

  hasMatches(item: InventarioEquipo): boolean {
    return !!(item.equipoRelacionadoId || item.usuarioRedRelacionadoId || item.vpnRelacionadoId);
  }

  private syncManualForm(item: InventarioEquipo): void {
    this.manualEquipoId = item.equipoRelacionadoId ?? null;
    this.manualUsuarioRedId = item.usuarioRedRelacionadoId ?? null;
    this.manualVpnId = item.vpnRelacionadoId ?? null;
    this.manualNotas = item.matchNotas ?? '';
  }
}
