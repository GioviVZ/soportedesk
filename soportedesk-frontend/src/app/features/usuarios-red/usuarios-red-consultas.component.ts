import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import * as XLSX from 'xlsx';
import { AuthService } from '../../core/auth/auth.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdUser } from './active-directory.model';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { UsuarioRedConsultaResultado } from './usuario-red-contrato.model';
import { UsuarioRedContratoService } from './usuario-red-contrato.service';

type EstadoFiltro = '' | 'HABILITADO' | 'DESHABILITADO' | 'BLOQUEADO' | 'SIN_FICHA_AD';
type VencimientoFiltro = '' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'SIN_FECHA';
type OrdenCampo = 'nombre' | 'oficina' | 'vencimiento';

@Component({
    selector: 'app-usuarios-red-consultas',
    imports: [CommonModule, FormsModule, ModalComponent, SectionCardComponent, VencimientoBadgeComponent, AdUserDetailComponent],
    template: `
    <div class="usuarios-red-page consultas-page">
      <section class="consulta-panel">
        <form class="consulta-search" (ngSubmit)="buscar()">
          <div class="consulta-input">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="termino"
              [(ngModel)]="termino"
              placeholder="Nombre, usuario, contrato, oficina o sin nombre"
              autocomplete="off"
              [disabled]="searching"
              />
              @if (termino) {
                <button type="button" class="consulta-clear" (click)="limpiar()" aria-label="Limpiar busqueda">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              }
            </div>
            <button type="submit" class="btn btn-primary consulta-submit" [disabled]="!canSearch">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
              Buscar
            </button>
            <button type="button" class="btn btn-secondary consulta-submit" (click)="exportExcel()" [disabled]="!itemsVisibles.length || searching || directorioLoading">
              Exportar Excel
            </button>
          </form>
    
          @if (searched || searchError) {
            <div class="consulta-toolbar">
              @if (searching) {
                <span>Buscando...</span>
              }
              @if (!searching && !searchError) {
                <span>{{ resultados.length }} resultado{{ resultados.length === 1 ? '' : 's' }}</span>
              }
              @if (searchError) {
                <span class="toolbar-error">{{ searchError }}</span>
              }
            </div>
          }
        </section>
    
        @if (!buscandoActivo) {
          <section class="directory-filter-panel">
            <div class="filter-header">
              <div>
                <span>Filtros</span>
                <strong>{{ directorioFiltrado.length }} de {{ directorio.length }} usuarios</strong>
              </div>
              <div class="filter-actions">
                <button type="button" class="ghost-action" (click)="clearFilters()" [disabled]="!hasActiveFilters">Limpiar</button>
              </div>
            </div>
            <div class="filter-grid">
              <label>
                Oficina
                <select [(ngModel)]="filters.oficina">
                  <option value="">Todas</option>
                  @for (oficina of oficinas; track oficina) {
                    <option [value]="oficina">{{ oficina }}</option>
                  }
                </select>
              </label>
              <label>
                Estado
                <select [(ngModel)]="filters.estado">
                  <option value="">Todos</option>
                  <option value="HABILITADO">Habilitado</option>
                  <option value="DESHABILITADO">Deshabilitado</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                  <option value="SIN_FICHA_AD">Sin ficha AD</option>
                </select>
              </label>
              <label>
                Vencimiento red
                <select [(ngModel)]="filters.vencimiento">
                  <option value="">Todos</option>
                  <option value="VIGENTE">Vigente</option>
                  <option value="POR_VENCER">Por vencer</option>
                  <option value="VENCIDO">Vencido</option>
                  <option value="SIN_FECHA">Sin fecha</option>
                </select>
              </label>
              <label>
                Ordenar por
                <select [(ngModel)]="ordenarPor">
                  <option value="nombre">Nombre (A-Z)</option>
                  <option value="oficina">Oficina (A-Z)</option>
                  <option value="vencimiento">Vencimiento (mas proximo primero)</option>
                </select>
              </label>
            </div>
          </section>
        }
    
        @if (!buscandoActivo && directorioFiltrado.length) {
          <div class="usuarios-red-table-wrap">
            <table class="usuarios-red-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Oficina</th>
                  <th>Estado</th>
                  <th>Host GLPI reportado</th>
                  <th>Vencimiento red</th>
                  <th>Contratos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of directorioFiltrado; track trackByResultado($index, item)) {
                  <tr>
                    <td class="col-usuario">
                      <span class="consulta-avatar">{{ initials(item) }}</span>
                      <span class="usuario-info">
                        <strong>{{ item.displayName || item.usuario || 'Sin nombre' }}</strong>
                        <span>{{ item.usuario || 'Sin usuario' }}</span>
                      </span>
                    </td>
                    <td>{{ item.office || 'Sin oficina' }}</td>
                    <td>
                      @if (item.enabled !== null && item.enabled !== undefined) {
                        <span class="mini-badge" [class.success]="item.enabled === true" [class.neutral]="item.enabled === false">
                          {{ item.enabled ? 'Habilitado' : 'Deshabilitado' }}
                        </span>
                      }
                      @if (item.locked) {
                        <span class="mini-badge danger">Bloqueado</span>
                      }
                      @if (!tieneFichaAd(item)) {
                        <span class="mini-badge warning">Sin ficha AD</span>
                      }
                    </td>
                    <td>
                      @if (item.hosts.length) {
                        <span>{{ item.hosts.join(', ') }}</span>
                      }
                      @if (!item.hosts.length) {
                        <span class="muted">Sin host</span>
                      }
                    </td>
                    <td><app-vencimiento-badge [fecha]="item.vencimientoUsuarioRed" /></td>
                    <td>
                      @if (item.contratos.length) {
                        <span class="mini-badge">{{ item.contratos.length }}</span>
                      }
                      @if (!item.contratos.length) {
                        <span class="muted">&mdash;</span>
                      }
                    </td>
                    <td class="consulta-row-actions">
                      <button type="button" class="ghost-action" (click)="abrirResultado(item)">Ver</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
    
        @if (itemsVisibles.length) {
          <section class="consulta-results" [class.directory-cards]="!buscandoActivo">
            @for (item of itemsVisibles; track trackByResultado($index, item)) {
              <button
                type="button"
                class="consulta-card"
                [class.no-ad]="!tieneFichaAd(item)"
                (click)="abrirResultado(item)"
                >
                <span class="consulta-avatar">{{ initials(item) }}</span>
                <span class="consulta-card-main">
                  <span class="consulta-card-head">
                    <strong>{{ item.displayName || item.usuario || 'Sin nombre' }}</strong>
                    <span class="consulta-badges">
                      @if (!item.displayName) {
                        <span class="mini-badge warning">Sin nombre</span>
                      }
                      @if (item.enabled !== null) {
                        <span class="mini-badge" [class.success]="item.enabled === true" [class.neutral]="item.enabled === false">
                          {{ item.enabled ? 'Habilitado' : 'Deshabilitado' }}
                        </span>
                      }
                      @if (item.locked) {
                        <span class="mini-badge danger">Bloqueado</span>
                      }
                      @if (item.vencimientoUsuarioRed) {
                        <span class="mini-badge" [class.danger]="item.estadoVencimientoUsuarioRed === 'VENCIDO'" [class.warning]="item.estadoVencimientoUsuarioRed === 'POR_VENCER'" [class.success]="item.estadoVencimientoUsuarioRed === 'VIGENTE'">
                          Red vence {{ item.vencimientoUsuarioRed | date:'dd/MM/yyyy' }}
                        </span>
                      }
                      @if (!tieneFichaAd(item)) {
                        <span class="mini-badge warning">Sin ficha AD</span>
                      }
                    </span>
                  </span>
                  <span class="consulta-meta">
                    <span>{{ item.usuario || 'Sin usuario' }}</span>
                    @if (item.mail) {
                      <span>{{ item.mail }}</span>
                    }
                    @if (item.office) {
                      <span>{{ item.office }}</span>
                    }
                    @if (item.organizationalUnit) {
                      <span>{{ item.organizationalUnit }}</span>
                    }
                    @if (item.hosts.length) {
                      <span>Host: {{ item.hosts.join(', ') }}</span>
                    }
                  </span>
                  @if (item.contratos.length) {
                    <span class="consulta-contratos">
                      @for (contrato of item.contratos | slice:0:3; track contrato) {
                        <span class="contrato-pill">
                          <strong>{{ contrato.tipoContratoNombre }}</strong>
                          @if (contrato.numeroContrato) {
                            <span>Nro. {{ contrato.numeroContrato }}</span>
                          }
                          <span>{{ contrato.fechaInicio | date:'dd/MM/yyyy' }} - {{ contrato.fechaFin ? (contrato.fechaFin | date:'dd/MM/yyyy') : 'Vigente' }}</span>
                        </span>
                      }
                      @if (item.contratos.length > 3) {
                        <span class="more-pill">+{{ item.contratos.length - 3 }}</span>
                      }
                    </span>
                  }
                </span>
                <span class="consulta-action">Ver</span>
              </button>
            }
          </section>
        }
    
        @if (searched && !searching && !resultados.length && !searchError) {
          <div class="empty-state">
            <strong>Sin resultados</strong>
            <span>{{ terminoBuscado }}</span>
          </div>
        }
    
        @if (!buscandoActivo && directorioLoaded && directorio.length > 0 && !directorioFiltrado.length) {
          <div class="empty-state">
            <strong>Sin resultados con estos filtros</strong>
            <button type="button" class="ghost-action" (click)="clearFilters()">Limpiar filtros</button>
          </div>
        }
    
        @if (!buscandoActivo && directorioLoaded && !directorio.length && !directorioError) {
          <div class="empty-state">
            <strong>Sin usuarios registrados</strong>
          </div>
        }
    
        @if (!buscandoActivo && directorioError) {
          <div class="empty-state">
            <strong>{{ directorioError }}</strong>
          </div>
        }
      </div>
    
      <app-modal title="Detalle de usuario" size="wide" [open]="detailOpen" (closed)="closeDetail()">
        <div class="modal-body">
          @if (error) {
            <div class="notice error">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ error }}
            </div>
          }
          @if (loading) {
            <p class="muted">Cargando usuario...</p>
          }
          @if (!loading && selectedUser) {
            <app-ad-user-detail
              [user]="selectedUser"
              [showManage]="canWrite"
              [puedeEditarContratos]="false"
              (manage)="goToAdmin($event)"
              />
          }
          @if (!loading && selectedUser && selectedConsulta) {
            <app-section-card title="Hosts GLPI reportados">
              <div class="detail-grid">
                <div class="detail-field">
                  <span class="detail-label">Equipo(s) con este usuario</span>
                  <span class="detail-value">{{ selectedConsulta.hosts.length ? selectedConsulta.hosts.join(', ') : 'Sin host asociado en GLPI' }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Origen</span>
                  <span class="detail-value">Último inventario automático reportado por el agente GLPI.</span>
                </div>
              </div>
            </app-section-card>
          }
          @if (!loading && !selectedUser && selectedConsulta) {
            <section class="consulta-only-detail">
              <section class="identity-band">
                <div class="avatar">{{ initials(selectedConsulta) }}</div>
                <div class="identity-main">
                  <h3>{{ selectedConsulta.displayName || selectedConsulta.usuario || 'Sin nombre' }}</h3>
                  <span>{{ selectedConsulta.usuario || 'Sin usuario de red' }}</span>
                  <span>Registro encontrado por contrato, sin ficha AD en la cache local.</span>
                </div>
                <div class="identity-side">
                  <span class="mini-badge warning">Sin ficha AD</span>
                </div>
              </section>
              <section class="detail-sections">
                <app-section-card title="Vencimiento de usuario de red">
                  <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div class="detail-grid">
                    <div class="detail-field">
                      <span class="detail-label">Fecha limite</span>
                      <span class="detail-value">
                        {{ selectedConsulta.vencimientoUsuarioRed ? (selectedConsulta.vencimientoUsuarioRed | date:'dd/MM/yyyy') : 'Sin fecha fin de contrato' }}
                        <app-vencimiento-badge [fecha]="selectedConsulta.vencimientoUsuarioRed" />
                      </span>
                    </div>
                    <div class="detail-field">
                      <span class="detail-label">Uso operativo</span>
                      <span class="detail-value">Referencia para alerta y desactivacion de la cuenta de red.</span>
                    </div>
                  </div>
                </app-section-card>
                <app-section-card title="Contratos" class="groups-card">
                  <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  @if (selectedConsulta.contratos.length) {
                    <div class="assigned-list contrato-list">
                      @for (contrato of selectedConsulta.contratos; track contrato) {
                        <div class="contrato-item">
                          <div class="contrato-main">
                            <span class="contrato-tipo">{{ contrato.tipoContratoNombre }}</span>
                            <span class="contrato-fechas">
                              {{ contrato.fechaInicio | date:'dd/MM/yyyy' }} - {{ contrato.fechaFin ? (contrato.fechaFin | date:'dd/MM/yyyy') : 'Actual' }}
                            </span>
                            @if (contrato.numeroContrato) {
                              <span class="contrato-numero">Nro. {{ contrato.numeroContrato }}</span>
                            }
                            @if (contrato.personalNombre || contrato.personalApellidos) {
                              <span class="contrato-personal">
                                Titular: <strong>{{ contrato.personalNombre }} {{ contrato.personalApellidos }}</strong>
                              </span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="muted">Sin contratos registrados.</p>
                  }
                </app-section-card>
              </section>
            </section>
          }
        </div>
      </app-modal>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: [
        './usuarios-red.shared.scss',
        './usuarios-red-consultas-directorio.scss',
        './usuario-red-contratos-panel.scss',
    ]
})
export class UsuariosRedConsultasComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private contratoService = inject(UsuarioRedContratoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedUser: AdUser | null = null;
  selectedConsulta: UsuarioRedConsultaResultado | null = null;
  detailOpen = false;
  loading = false;
  error = '';

  termino = '';
  terminoBuscado = '';
  resultados: UsuarioRedConsultaResultado[] = [];
  searching = false;
  searched = false;
  searchError = '';

  directorio: UsuarioRedConsultaResultado[] = [];
  directorioLoading = false;
  directorioLoaded = false;
  directorioError = '';

  filters: { oficina: string; estado: EstadoFiltro; vencimiento: VencimientoFiltro } = {
    oficina: '',
    estado: '',
    vencimiento: '',
  };
  ordenarPor: OrdenCampo = 'nombre';

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  get canSearch(): boolean {
    return this.termino.trim().length >= 2 && !this.searching;
  }

  get buscandoActivo(): boolean {
    return this.termino.trim().length >= 2;
  }

  get oficinas(): string[] {
    return this.unique(this.directorio.map((item) => item.office || 'Sin oficina'));
  }

  get directorioFiltrado(): UsuarioRedConsultaResultado[] {
    return this.directorio
      .filter((item) => !this.filters.oficina || (item.office || 'Sin oficina') === this.filters.oficina)
      .filter((item) => !this.filters.estado || this.matchesEstado(item, this.filters.estado))
      .filter((item) => !this.filters.vencimiento || item.estadoVencimientoUsuarioRed === this.filters.vencimiento)
      .sort(this.comparadorPara(this.ordenarPor));
  }

  get itemsVisibles(): UsuarioRedConsultaResultado[] {
    return this.buscandoActivo ? this.resultados : this.directorioFiltrado;
  }

  get hasActiveFilters(): boolean {
    return Boolean(this.filters.oficina || this.filters.estado || this.filters.vencimiento);
  }

  ngOnInit(): void {
    this.cargarDirectorio();
  }

  private cargarDirectorio(): void {
    this.directorioLoading = true;
    this.directorioError = '';
    this.contratoService.buscarConsultas()
      .pipe(finalize(() => (this.directorioLoading = false)))
      .subscribe({
        next: (resultados) => {
          this.directorio = resultados.map((item) => ({
            ...item,
            hosts: item.hosts ?? [],
            contratos: item.contratos ?? [],
          }));
          this.directorioLoaded = true;
        },
        error: () => {
          this.directorioError = 'No se pudo cargar el directorio de usuarios.';
        },
      });
  }

  clearFilters(): void {
    this.filters = { oficina: '', estado: '', vencimiento: '' };
  }

  private matchesEstado(item: UsuarioRedConsultaResultado, estado: EstadoFiltro): boolean {
    switch (estado) {
      case 'SIN_FICHA_AD':
        return !this.tieneFichaAd(item);
      case 'BLOQUEADO':
        return !!item.locked;
      case 'HABILITADO':
        return item.enabled === true;
      case 'DESHABILITADO':
        return item.enabled === false;
      default:
        return true;
    }
  }

  private comparadorPara(campo: OrdenCampo) {
    return (a: UsuarioRedConsultaResultado, b: UsuarioRedConsultaResultado): number => {
      if (campo === 'vencimiento') {
        if (!a.vencimientoUsuarioRed && !b.vencimientoUsuarioRed) return 0;
        if (!a.vencimientoUsuarioRed) return 1;
        if (!b.vencimientoUsuarioRed) return -1;
        return a.vencimientoUsuarioRed.localeCompare(b.vencimientoUsuarioRed);
      }
      const valorA = campo === 'oficina' ? (a.office || 'Sin oficina') : (a.displayName || a.usuario || '');
      const valorB = campo === 'oficina' ? (b.office || 'Sin oficina') : (b.displayName || b.usuario || '');
      return valorA.localeCompare(valorB, 'es');
    };
  }

  private unique(values: string[]): string[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'es'));
  }

  buscar(): void {
    const term = this.termino.trim();
    if (term.length < 2) {
      this.resultados = [];
      return;
    }

    this.searching = true;
    this.searched = true;
    this.searchError = '';
    this.terminoBuscado = term;

    this.contratoService.buscarConsultas(term)
      .pipe(finalize(() => (this.searching = false)))
      .subscribe({
        next: (resultados) => {
          this.resultados = resultados.map((item) => ({
            ...item,
            hosts: item.hosts ?? [],
            contratos: item.contratos ?? [],
            vencimientoUsuarioRed: item.vencimientoUsuarioRed ?? this.vencimientoDesdeContratos(item.contratos ?? []),
            estadoVencimientoUsuarioRed: item.estadoVencimientoUsuarioRed ?? null,
          }));
        },
        error: () => {
          this.resultados = [];
          this.searchError = 'No se pudo realizar la busqueda.';
        },
      });
  }

  limpiar(): void {
    this.termino = '';
    this.terminoBuscado = '';
    this.resultados = [];
    this.searched = false;
    this.searchError = '';
  }

  exportExcel(): void {
    const rows = this.itemsVisibles.map((item) => ({
      Usuario: item.usuario ?? '',
      Nombre: item.displayName ?? '',
      Correo: item.mail ?? '',
      Oficina: item.office ?? '',
      'Unidad organizativa': item.organizationalUnit ?? '',
      'Host GLPI reportado': item.hosts.join(' | '),
      Estado: this.estadoParaExportar(item),
      Bloqueo: item.locked === null || item.locked === undefined ? '' : item.locked ? 'Bloqueado' : 'Sin bloqueo',
      'Vencimiento de usuario de red': this.fechaParaExportar(item.vencimientoUsuarioRed),
      'Estado de vencimiento': this.estadoVencimientoParaExportar(item.estadoVencimientoUsuarioRed),
      'Cantidad de contratos': item.contratos.length,
      Contratos: item.contratos.map((contrato) => {
        const numero = contrato.numeroContrato ? ` N.° ${contrato.numeroContrato}` : '';
        const periodo = `${this.fechaParaExportar(contrato.fechaInicio)} - ${this.fechaParaExportar(contrato.fechaFin) || 'Vigente'}`;
        return `${contrato.tipoContratoNombre}${numero} (${periodo})`;
      }).join(' | '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 35 }, { wch: 32 }, { wch: 28 }, { wch: 40 }, { wch: 28 },
      { wch: 18 }, { wch: 16 }, { wch: 25 }, { wch: 22 }, { wch: 22 }, { wch: 70 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios de red');
    XLSX.writeFile(workbook, `usuarios-red-${this.exportDate()}.xlsx`);
  }

  private estadoParaExportar(item: UsuarioRedConsultaResultado): string {
    if (!this.tieneFichaAd(item)) return 'Sin ficha AD';
    return item.enabled ? 'Habilitado' : 'Deshabilitado';
  }

  private estadoVencimientoParaExportar(estado: UsuarioRedConsultaResultado['estadoVencimientoUsuarioRed']): string {
    const labels: Record<NonNullable<UsuarioRedConsultaResultado['estadoVencimientoUsuarioRed']>, string> = {
      VENCIDO: 'Vencido',
      POR_VENCER: 'Por vencer',
      VIGENTE: 'Vigente',
      SIN_FECHA: 'Sin fecha',
    };
    return estado ? labels[estado] : 'Sin fecha';
  }

  private fechaParaExportar(fecha: string | null): string {
    if (!fecha) return '';
    const [year, month, day] = fecha.substring(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : fecha;
  }

  private exportDate(): string {
    const now = new Date();
    const twoDigits = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${twoDigits(now.getMonth() + 1)}${twoDigits(now.getDate())}-${twoDigits(now.getHours())}${twoDigits(now.getMinutes())}`;
  }

  abrirResultado(item: UsuarioRedConsultaResultado): void {
    this.selectedConsulta = item;
    if (!this.tieneFichaAd(item) || !item.usuario) {
      this.detailOpen = true;
      this.loading = false;
      this.error = '';
      this.selectedUser = null;
      return;
    }
    this.loadUser(item.usuario);
  }

  tieneFichaAd(item: UsuarioRedConsultaResultado): boolean {
    return !!item.usuario && item.enabled !== null && item.enabled !== undefined;
  }

  initials(item: UsuarioRedConsultaResultado): string {
    const value = item.displayName || item.usuario || '?';
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('');
  }

  trackByResultado(index: number, item: UsuarioRedConsultaResultado): string {
    return item.usuario || item.displayName || String(index);
  }

  private vencimientoDesdeContratos(contratos: UsuarioRedConsultaResultado['contratos']): string | null {
    const fechas = contratos
      .map((contrato) => contrato.fechaFin)
      .filter((fecha): fecha is string => !!fecha)
      .sort();
    return fechas.length ? fechas[fechas.length - 1] : null;
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.selectedUser = null;
    this.selectedConsulta = null;
    this.error = '';
  }

  goToAdmin(sam: string): void {
    this.closeDetail();
    this.router.navigate(['/usuarios-red/administracion'], { queryParams: { sam, action: 'edit' } });
  }

  private loadUser(sam: string): void {
    this.detailOpen = true;
    this.loading = true;
    this.error = '';
    this.selectedUser = null;
    this.adService.getUser(sam).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.selectedUser = response.data;
          return;
        }
        this.error = response.message || 'No se pudo cargar el usuario.';
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el usuario.';
      },
    });
  }
}
