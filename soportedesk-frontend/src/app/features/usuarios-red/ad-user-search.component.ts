
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, interval, takeUntil } from 'rxjs';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Dependencia, Sede, Subdependencia } from '../../core/models/catalogo.model';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdUserSummary } from './active-directory.model';

type EstadoFiltro = 'all' | 'enabled' | 'locked' | 'disabled';
const PENDIENTE_SEDE = -1;

@Component({
    selector: 'app-ad-user-search',
    imports: [FormsModule, StatusBadgeComponent],
    template: `
    <section class="ad-query-shell">
      <form class="ad-query-bar" (ngSubmit)="search()">
        <label class="ad-query-input">
          <span>Consulta de directorio</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            name="q"
            [(ngModel)]="q"
            (ngModelChange)="queueSearch()"
            placeholder="Usuario, nombre en AD o contrato, oficina u OU"
            autocomplete="off"
            autofocus
            />
            @if (hasAnyFilter) {
              <button type="button" class="icon-button clear-query" (click)="clearFilters()" aria-label="Limpiar busqueda">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            }
          </label>
    
        </form>
    
        <div class="query-tools">
          <div class="segmented-control" role="group" aria-label="Filtro de estado">
            <button type="button" [class.active]="estado === 'all'" (click)="setEstado('all')">Todos</button>
            <button type="button" [class.active]="estado === 'enabled'" (click)="setEstado('enabled')">Habilitados</button>
            <button type="button" [class.active]="estado === 'locked'" (click)="setEstado('locked')">Bloqueados</button>
            <button type="button" [class.active]="estado === 'disabled'" (click)="setEstado('disabled')">Deshabilitados</button>
          </div>
    
          <button type="button" class="link-button" (click)="showAdvanced = !showAdvanced">
            {{ showAdvanced ? 'Ocultar filtros' : 'Filtros avanzados' }}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [class.rotate]="showAdvanced">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
    
        <div class="catalog-filters">
          <label class="field catalog-field">
            <span>Sede</span>
            <select name="sedeSelect" [ngModel]="sedeId" (change)="onSedeFilterChange($any($event.target).value)">
              <option value="">Todas las sedes</option>
              <option [value]="PENDIENTE_SEDE">⚠ Pendiente de clasificar</option>
              @for (sede of sedes; track sede.id) {
                <option [value]="sede.id">{{ sede.nombre }}</option>
              }
            </select>
          </label>

          <label class="field catalog-field">
            <span>Dependencia</span>
            <select name="dependenciaSelect" [ngModel]="dependenciaId" (change)="onDependenciaFilterChange($any($event.target).value)" [disabled]="!sedeId || sedeId === PENDIENTE_SEDE">
              <option value="">Todas las dependencias</option>
              @for (dependencia of dependenciasDisponibles; track dependencia.id) {
                <option [value]="dependencia.id">{{ dependencia.nombre }}</option>
              }
            </select>
          </label>

          <label class="field catalog-field">
            <span>Subdependencia</span>
            <select name="subdependenciaSelect" [ngModel]="subdependenciaId" (change)="onSubdependenciaFilterChange($any($event.target).value)" [disabled]="!dependenciaId">
              <option value="">Todas las subdependencias</option>
              @for (subdependencia of subdependencias; track subdependencia) {
                <option [value]="subdependencia.id">{{ subdependencia.nombre }}</option>
              }
            </select>
          </label>
        </div>
    
        @if (showAdvanced) {
          <div class="advanced-search">
            <div class="field">
              <label>Usuario de red</label>
              <input name="usuario" [(ngModel)]="usuario" (ngModelChange)="queueSearch()" placeholder="usuario o usuario@inia.local" autocomplete="off" />
            </div>
            <div class="field">
              <label>Nombre o correo</label>
              <input name="nombre" [(ngModel)]="nombre" (ngModelChange)="queueSearch()" placeholder="Nombre completo o correo" autocomplete="off" />
            </div>
          </div>
        }
    
        <div class="query-summary">
          @if (!searched && !loading) {
            <span>Escribe 2 caracteres para buscar en Active Directory y en los contratos asociados.</span>
          }
          @if (loading) {
            <span>Consultando usuarios...</span>
          }
          @if (searched && !loading) {
            <strong>{{ results.length }} {{ results.length === 1 ? 'resultado' : 'resultados' }}</strong>
          }
          @if (searched && !loading && activeDescription) {
            <span>{{ activeDescription }}</span>
          }
        </div>
      </section>
    
      @if (message) {
        <div class="notice" [class.error]="messageTone === 'error'">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ message }}
        </div>
      }
    
      @if (searched && results.length) {
        <section class="ad-result-list">
          @for (user of results; track trackBySam($index, user)) {
            <article
              class="ad-result-card"
              [class.selected]="isSelected(user)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'Ver detalle de ' + (user.displayName || user.samAccountName)"
              (click)="selected.emit(user)"
              (keydown.enter)="selected.emit(user)"
              (keydown.space)="$event.preventDefault(); selected.emit(user)"
              >
              <div class="result-avatar" aria-hidden="true">{{ initials(user) }}</div>
              <div class="result-identity">
                <strong>{{ user.displayName || 'Sin nombre registrado' }}</strong>
                <span>{{ user.samAccountName }}</span>
                @if (user.mail) {
                  <a [href]="'mailto:' + user.mail" (click)="$event.stopPropagation()">{{ user.mail }}</a>
                }
              </div>
              <div class="result-location">
                <span>{{ user.office || 'Oficina no registrada' }}</span>
                <small>{{ user.organizationalUnit || 'Sin OU registrada' }}</small>
              </div>
              <div class="result-state">
                <app-status-badge [label]="user.enabled ? 'Habilitado' : 'Deshabilitado'" [tone]="user.enabled ? 'success' : 'neutral'" />
                @if (user.locked) {
                  <app-status-badge label="Bloqueado" tone="danger" />
                }
              </div>
              <button type="button" class="icon-button result-open" (click)="$event.stopPropagation(); selected.emit(user)" aria-label="Ver detalle">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </article>
          }
        </section>
      }
    
      @if (searched && !results.length && !loading) {
        <section class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <strong>Sin resultados</strong>
          <span>Ajusta el nombre o los filtros para consultar Active Directory y Contratos.</span>
        </section>
      }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./usuarios-red.shared.scss', './ad-user-search.component.scss']
})
export class AdUserSearchComponent implements OnInit, OnDestroy {
  private adService = inject(ActiveDirectoryService);
  private catalogoService = inject(CatalogoService);
  private searchQueue = new Subject<string>();
  private destroy$ = new Subject<void>();

  @Input() selectedSam: string | null = null;
  @Output() selected = new EventEmitter<AdUserSummary>();

  q = '';
  usuario = '';
  nombre = '';
  readonly PENDIENTE_SEDE = PENDIENTE_SEDE;
  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  estado: EstadoFiltro = 'all';
  showAdvanced = false;
  results: AdUserSummary[] = [];
  searched = false;
  loading = false;
  message = '';
  messageTone: 'info' | 'error' = 'info';
  private searchToken = 0;

  constructor() {
    this.searchQueue.pipe(debounceTime(450), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      if (this.canSearch) {
        this.search();
      } else if (!this.hasAnyFilter) {
        this.resetSearchState();
      }
    });
  }

  ngOnInit(): void {
    forkJoin({
      sedes: this.catalogoService.getSedes(),
      dependencias: this.catalogoService.getDependencias(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ sedes, dependencias }) => {
        this.sedes = sedes;
        this.dependencias = dependencias;
      },
      error: () => {
        this.sedes = [];
        this.dependencias = [];
      },
    });

    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.silentRefresh());
  }

  get dependenciasDisponibles(): Dependencia[] {
    if (!this.sedeId || this.sedeId === PENDIENTE_SEDE) return [];
    return this.dependencias.filter((d) => d.sede.id === this.sedeId);
  }

  get canSearch(): boolean {
    return [this.q, this.usuario, this.nombre].some((value) => value.trim().length >= 2)
      || this.estado !== 'all'
      || this.sedeId != null
      || this.dependenciaId != null
      || this.subdependenciaId != null;
  }

  get hasAnyFilter(): boolean {
    return [this.q, this.usuario, this.nombre].some((value) => value.trim().length > 0)
      || this.estado !== 'all'
      || this.sedeId != null
      || this.dependenciaId != null
      || this.subdependenciaId != null;
  }

  get activeDescription(): string {
    const filters = [];
    if (this.q.trim()) filters.push(`"${this.q.trim()}"`);
    if (this.usuario.trim()) filters.push(`usuario: ${this.usuario.trim()}`);
    if (this.nombre.trim()) filters.push(`nombre/correo: ${this.nombre.trim()}`);
    if (this.estado !== 'all') filters.push(this.estadoLabel(this.estado).toLowerCase());
    if (this.sedeId === PENDIENTE_SEDE) filters.push('pendiente de clasificar');
    else if (this.sedeId != null) {
      const nombre = this.sedes.find((s) => s.id === this.sedeId)?.nombre;
      if (nombre) filters.push(`sede: ${nombre}`);
    }
    if (this.dependenciaId != null) {
      const nombre = this.dependencias.find((d) => d.id === this.dependenciaId)?.nombre;
      if (nombre) filters.push(`dependencia: ${nombre}`);
    }
    if (this.subdependenciaId != null) {
      const nombre = this.subdependencias.find((s) => s.id === this.subdependenciaId)?.nombre;
      if (nombre) filters.push(`subdependencia: ${nombre}`);
    }
    return filters.length ? `para ${filters.join(', ')}` : '';
  }

  queueSearch(): void {
    this.searchQueue.next(this.searchSignature());
  }

  setEstado(estado: EstadoFiltro): void {
    this.estado = estado;
    this.queueSearch();
  }

  onSedeFilterChange(value: string): void {
    this.sedeId = value ? Number(value) : null;
    this.dependenciaId = null;
    this.subdependenciaId = null;
    this.subdependencias = [];
    this.queueSearch();
  }

  onDependenciaFilterChange(value: string): void {
    const dependenciaId = value ? Number(value) : null;
    this.dependenciaId = dependenciaId;
    this.subdependenciaId = null;
    this.subdependencias = [];
    if (dependenciaId) {
      this.catalogoService.getSubdependencias(dependenciaId).subscribe({
        next: (subdependencias) => (this.subdependencias = subdependencias),
        error: () => (this.subdependencias = []),
      });
    }
    this.queueSearch();
  }

  onSubdependenciaFilterChange(value: string): void {
    this.subdependenciaId = value ? Number(value) : null;
    this.queueSearch();
  }

  clearFilters(): void {
    this.searchToken++;
    this.q = '';
    this.usuario = '';
    this.nombre = '';
    this.sedeId = null;
    this.dependenciaId = null;
    this.subdependenciaId = null;
    this.subdependencias = [];
    this.estado = 'all';
    this.resetSearchState();
  }

  search(): void {
    if (!this.canSearch) {
      this.results = [];
      this.searched = true;
      this.message = 'Ingresa al menos 2 caracteres o selecciona un estado.';
      this.messageTone = 'error';
      return;
    }
    this.loading = true;
    this.message = '';
    const token = ++this.searchToken;
    this.adService.searchUsers({ q: this.q, usuario: this.usuario, nombre: this.nombre, estado: this.estado, sedeId: this.sedeId, dependenciaId: this.dependenciaId, subdependenciaId: this.subdependenciaId }).subscribe({
      next: (result) => {
        if (token !== this.searchToken) return;
        this.loading = false;
        this.searched = true;
        this.results = result.items;
        this.message = result.truncated ? 'Mostrando los primeros resultados. Afina la consulta para ubicar la cuenta exacta.' : '';
        this.messageTone = 'info';
      },
      error: () => {
        if (token !== this.searchToken) return;
        this.loading = false;
        this.searched = true;
        this.results = [];
        this.message = 'No se pudo cargar. Intenta nuevamente.';
        this.messageTone = 'error';
      },
    });
  }

  initials(user: AdUserSummary): string {
    const name = user.displayName?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return user.samAccountName.slice(0, 2).toUpperCase();
  }

  trackBySam(_index: number, user: AdUserSummary): string {
    return user.samAccountName;
  }

  isSelected(user: AdUserSummary): boolean {
    return !!this.selectedSam && user.samAccountName.toLowerCase() === this.selectedSam.toLowerCase();
  }

  removeResult(samAccountName: string): void {
    this.results = this.results.filter((user) => user.samAccountName.toLowerCase() !== samAccountName.toLowerCase());
  }

  updateResult(user: AdUserSummary): void {
    const idx = this.results.findIndex(
      (r) => r.samAccountName.toLowerCase() === user.samAccountName.toLowerCase(),
    );
    if (idx === -1) return;
    this.results = [...this.results.slice(0, idx), user, ...this.results.slice(idx + 1)];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchQueue.complete();
  }

  private resetSearchState(): void {
    this.results = [];
    this.searched = false;
    this.loading = false;
    this.message = '';
  }

  private silentRefresh(): void {
    if (!this.searched || !this.canSearch || this.loading) return;
    const token = ++this.searchToken;
    this.adService
      .searchUsers({ q: this.q, usuario: this.usuario, nombre: this.nombre, estado: this.estado, sedeId: this.sedeId, dependenciaId: this.dependenciaId, subdependenciaId: this.subdependenciaId })
      .subscribe({
        next: (result) => {
          if (token !== this.searchToken) return;
          this.results = result.items;
          this.message = result.truncated ? 'Mostrando los primeros resultados. Afina la consulta para ubicar la cuenta exacta.' : '';
          this.messageTone = 'info';
        },
        error: () => {},
      });
  }

  private searchSignature(): string {
    const textPart = [this.q, this.usuario, this.nombre, this.estado]
      .map((value) => value.trim())
      .join('|');
    return `${textPart}|${this.sedeId ?? ''}|${this.dependenciaId ?? ''}|${this.subdependenciaId ?? ''}`;
  }

  private estadoLabel(estado: EstadoFiltro): string {
    const labels: Record<EstadoFiltro, string> = {
      all: 'Todos',
      enabled: 'Habilitados',
      locked: 'Bloqueados',
      disabled: 'Deshabilitados',
    };
    return labels[estado];
  }
}
