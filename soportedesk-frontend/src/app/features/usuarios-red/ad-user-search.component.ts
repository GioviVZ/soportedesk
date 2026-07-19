
import { Component, EventEmitter, OnDestroy, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdFilterOption, AdUserSummary } from './active-directory.model';

type EstadoFiltro = 'all' | 'enabled' | 'locked' | 'disabled';

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
    
          <button type="submit" class="btn btn-primary query-submit" [disabled]="loading || !canSearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            {{ loading ? 'Buscando...' : 'Buscar' }}
          </button>
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
            <span>Unidad organizativa</span>
            <select name="ouSelect" [(ngModel)]="ou" (ngModelChange)="queueSearch()">
              <option value="">Todas las OU</option>
              @for (option of organizationalUnits; track option) {
                <option [value]="option.value">
                  {{ option.value }} ({{ option.total }})
                </option>
              }
            </select>
          </label>
    
          <label class="field catalog-field">
            <span>Oficina</span>
            <select name="officeSelect" [(ngModel)]="oficina" (ngModelChange)="queueSearch()">
              <option value="">Todas las oficinas</option>
              @for (option of offices; track option) {
                <option [value]="option.value">
                  {{ option.value }} ({{ option.total }})
                </option>
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
  private searchQueue = new Subject<string>();
  private destroy$ = new Subject<void>();

  @Output() selected = new EventEmitter<AdUserSummary>();

  q = '';
  usuario = '';
  nombre = '';
  oficina = '';
  ou = '';
  estado: EstadoFiltro = 'all';
  showAdvanced = false;
  results: AdUserSummary[] = [];
  organizationalUnits: AdFilterOption[] = [];
  offices: AdFilterOption[] = [];
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
      organizationalUnits: this.adService.getOrganizationalUnitFilters(),
      offices: this.adService.getOfficeFilters(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ organizationalUnits, offices }) => {
        this.organizationalUnits = organizationalUnits;
        this.offices = offices;
      },
      error: () => {
        this.organizationalUnits = [];
        this.offices = [];
      },
    });
  }

  get canSearch(): boolean {
    return [this.q, this.usuario, this.nombre, this.oficina, this.ou].some((value) => value.trim().length >= 2) || this.estado !== 'all';
  }

  get hasAnyFilter(): boolean {
    return [this.q, this.usuario, this.nombre, this.oficina, this.ou].some((value) => value.trim().length > 0) || this.estado !== 'all';
  }

  get activeDescription(): string {
    const filters = [];
    if (this.q.trim()) filters.push(`"${this.q.trim()}"`);
    if (this.usuario.trim()) filters.push(`usuario: ${this.usuario.trim()}`);
    if (this.nombre.trim()) filters.push(`nombre/correo: ${this.nombre.trim()}`);
    if (this.oficina.trim()) filters.push(`oficina: ${this.oficina.trim()}`);
    if (this.ou.trim()) filters.push(`OU: ${this.ou.trim()}`);
    if (this.estado !== 'all') filters.push(this.estadoLabel(this.estado).toLowerCase());
    return filters.length ? `para ${filters.join(', ')}` : '';
  }

  queueSearch(): void {
    this.searchQueue.next(this.searchSignature());
  }

  setEstado(estado: EstadoFiltro): void {
    this.estado = estado;
    this.queueSearch();
  }

  clearFilters(): void {
    this.searchToken++;
    this.q = '';
    this.usuario = '';
    this.nombre = '';
    this.oficina = '';
    this.ou = '';
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
    this.adService.searchUsers({ q: this.q, usuario: this.usuario, nombre: this.nombre, oficina: this.oficina, ou: this.ou, estado: this.estado }).subscribe({
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

  private searchSignature(): string {
    return [this.q, this.usuario, this.nombre, this.oficina, this.ou, this.estado].map((value) => value.trim()).join('|');
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
