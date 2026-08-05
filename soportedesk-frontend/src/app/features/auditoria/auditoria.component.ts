import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditoriaService } from './auditoria.service';
import { MovimientoAuditoria, MovimientoAuditoriaFilters } from './movimiento-auditoria.model';
import { AdAuditoria, AdAuditoriaFilters } from './ad-auditoria.model';
import { AdAuditoriaService } from './ad-auditoria.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

const MODULOS: Record<string, string> = {
  auth: 'Autenticación',
  'usuarios-red': 'Usuarios de Red/AD',
  correos: 'Correos',
  equipos: 'Inventario de Equipos',
  vpn: 'VPN',
  impresoras: 'Impresoras',
  wifi: 'WiFi',
  licencias: 'Licencias',
  'usuarios-sistema': 'Usuarios del Sistema',
  catalogos: 'Configuración',
  herramientas: 'Herramientas',
};

const EXPORT_LIMIT = 5000;

@Component({
    selector: 'app-auditoria',
    imports: [CommonModule, FormsModule, ModalComponent],
    templateUrl: './auditoria.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './auditoria.component.scss'
})
export class AuditoriaComponent implements OnInit, OnDestroy {
  private service = inject(AuditoriaService);
  private adService = inject(AdAuditoriaService);
  private readonly searchQueue = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  readonly acciones = [
    'LOGIN',
    'LOGIN_FALLIDO',
    'CREAR',
    'CREAR_USUARIO',
    'ACTUALIZAR',
    'ELIMINAR',
    'APROBAR',
    'RECHAZAR',
    'OBSERVAR',
    'ACTUALIZAR_ANTIVIRUS',
    'CAMBIAR_PASSWORD',
    'ADJUNTAR_ARCHIVO',
    'ELIMINAR_ADJUNTO',
    'SUBIR_DRIVER',
    'SINCRONIZAR',
    'EJECUTAR_DIAGNOSTICO',
    'DESBLOQUEAR_CUENTA',
    'RESET_PASSWORD',
    'HABILITAR_CUENTA',
    'DESHABILITAR_CUENTA',
    'MOVER_OU',
    'AGREGAR_GRUPO',
    'QUITAR_GRUPO',
    'ACTUALIZAR_INFO',
  ];
  readonly modulos = Object.entries(MODULOS).map(([key, label]) => ({ key, label }));

  activeTab: 'general' | 'ad' = 'general';

  readonly adAcciones = [
    'CREAR_USUARIO',
    'DESBLOQUEAR_CUENTA',
    'RESET_PASSWORD',
    'HABILITAR_CUENTA',
    'DESHABILITAR_CUENTA',
    'MOVER_OU',
    'AGREGAR_GRUPO',
    'QUITAR_GRUPO',
    'ACTUALIZAR_INFO',
    'ELIMINAR_USUARIO',
  ];

  adMovimientos: AdAuditoria[] = [];
  adLoading = false;
  adLoaded = false;
  adError = '';
  adSeleccionado: AdAuditoria | null = null;

  adFilters: AdAuditoriaFilters = {
    usuarioAfectado: '',
    accion: '',
    resultado: '',
    desde: '',
    hasta: '',
    limit: 100,
  };

  movimientos: MovimientoAuditoria[] = [];
  loading = false;
  exporting = false;
  error = '';
  exportMessage = '';
  movimientoSeleccionado: MovimientoAuditoria | null = null;

  filters: MovimientoAuditoriaFilters = {
    search: '',
    modulo: '',
    accion: '',
    desde: '',
    hasta: '',
    limit: 100,
  };

  get errores(): number {
    return this.movimientos.filter((m) => (m.estadoHttp ?? 0) >= 400).length;
  }

  get usuariosUnicos(): number {
    return new Set(this.movimientos.map((m) => m.usuario).filter(Boolean)).size;
  }

  get ultimaActividad(): string {
    return this.movimientos.length ? this.formatFecha(this.movimientos[0].fecha) : '-';
  }

  ngOnInit(): void {
    this.searchQueue.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.load());
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.filters.search = value;
    this.searchQueue.next(value.trim());
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.exportMessage = '';
    this.service.getMovimientos(this.filters).subscribe({
      next: (rows) => {
        this.movimientos = rows;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudieron cargar los movimientos';
        this.loading = false;
      },
    });
  }

  clearFilters(): void {
    this.filters = { search: '', modulo: '', accion: '', desde: '', hasta: '', limit: 100 };
    this.load();
  }

  setTab(tab: 'general' | 'ad'): void {
    this.activeTab = tab;
    if (tab === 'ad' && !this.adLoaded) {
      this.loadAd();
    }
  }

  loadAd(): void {
    this.adLoading = true;
    this.adError = '';
    this.adService.getMovimientos(this.adFilters).subscribe({
      next: (rows) => {
        this.adMovimientos = rows;
        this.adLoading = false;
        this.adLoaded = true;
      },
      error: (err) => {
        this.adError = err?.error?.message ?? 'No se pudieron cargar los movimientos de Active Directory';
        this.adLoading = false;
      },
    });
  }

  clearAdFilters(): void {
    this.adFilters = { usuarioAfectado: '', accion: '', resultado: '', desde: '', hasta: '', limit: 100 };
    this.loadAd();
  }

  verDetalleAd(movimiento: AdAuditoria): void {
    this.adSeleccionado = movimiento;
  }

  cerrarDetalleAd(): void {
    this.adSeleccionado = null;
  }

  formatDuracion(ms: number | null): string {
    if (ms == null) {
      return '-';
    }
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
  }

  verDetalle(movimiento: MovimientoAuditoria): void {
    this.movimientoSeleccionado = movimiento;
  }

  cerrarDetalle(): void {
    this.movimientoSeleccionado = null;
  }

  exportarExcel(): void {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.error = '';
    this.exportMessage = '';
    this.service.getMovimientos({ ...this.filters, limit: EXPORT_LIMIT }).subscribe({
      next: (rows) => {
        if (rows.length === 0) {
          this.exportMessage = 'No hay movimientos para exportar con los filtros seleccionados.';
          this.exporting = false;
          return;
        }

        const data = rows.map((movimiento) => ({
          Fecha: this.formatFechaDia(movimiento.fecha),
          Hora: this.formatHora(movimiento.fecha),
          Usuario: movimiento.usuario,
          Módulo: this.moduloLabel(movimiento.modulo),
          Acción: movimiento.accion,
          'Detalle del cambio': this.detalleMovimiento(movimiento),
          Método: movimiento.metodo,
          Ruta: movimiento.ruta,
          'ID de registro': movimiento.entidadId ?? '',
          Resultado: this.resultadoLabel(movimiento.estadoHttp),
          'Estado HTTP': movimiento.estadoHttp ?? '',
          'Dirección IP': movimiento.ip ?? '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet['!cols'] = [
          { wch: 12 }, { wch: 11 }, { wch: 20 }, { wch: 24 }, { wch: 24 }, { wch: 72 },
          { wch: 10 }, { wch: 48 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
        ];
        if (worksheet['!ref']) {
          worksheet['!autofilter'] = { ref: worksheet['!ref'] };
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
        XLSX.writeFile(workbook, `movimientos_${this.exportTimestamp()}.xlsx`, { compression: true });

        this.exportMessage = rows.length === EXPORT_LIMIT
          ? `Se exportaron los primeros ${EXPORT_LIMIT.toLocaleString('es-PE')} movimientos filtrados.`
          : `Excel generado con ${rows.length.toLocaleString('es-PE')} movimientos.`;
        this.exporting = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudo generar el archivo Excel';
        this.exporting = false;
      },
    });
  }

  moduloLabel(modulo: string): string {
    return MODULOS[modulo] ?? modulo;
  }

  accionClass(accion: string): string {
    return `accion-${accion.toLowerCase()}`;
  }

  formatFecha(fecha: string): string {
    return `${this.formatFechaDia(fecha)} ${this.formatHora(fecha)}`;
  }

  formatFechaDia(fecha: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(fecha));
  }

  formatHora(fecha: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(fecha));
  }

  detalleMovimiento(movimiento: MovimientoAuditoria): string {
    const legacyDetail = `${movimiento.metodo} ${movimiento.ruta}`;
    if (movimiento.detalle && movimiento.detalle.trim() !== legacyDetail) {
      return movimiento.detalle;
    }

    const modulo = this.moduloLabel(movimiento.modulo);
    const id = movimiento.entidadId ? ` (ID ${movimiento.entidadId})` : '';
    return `${this.accionLabel(movimiento.accion)} en ${modulo}${id}`;
  }

  accionLabel(accion: string): string {
    const labels: Record<string, string> = {
      LOGIN: 'Inicio de sesión',
      LOGIN_FALLIDO: 'Intento de acceso fallido',
      CREAR: 'Creación de registro',
      ACTUALIZAR: 'Actualización de registro',
      ELIMINAR: 'Eliminación de registro',
      APROBAR: 'Aprobación de solicitud',
      RECHAZAR: 'Rechazo de solicitud',
      OBSERVAR: 'Observación de solicitud',
      CAMBIAR_PASSWORD: 'Cambio de contraseña',
    };
    return labels[accion] ?? accion.replaceAll('_', ' ').toLocaleLowerCase('es-PE');
  }

  resultadoLabel(status: number | null): string {
    if (status == null) {
      return 'Sin estado';
    }
    return status >= 400 ? 'Con error' : 'Completado';
  }

  private exportTimestamp(): string {
    const now = new Date();
    const part = (value: number) => value.toString().padStart(2, '0');
    return `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}_${part(now.getHours())}${part(now.getMinutes())}`;
  }
}
