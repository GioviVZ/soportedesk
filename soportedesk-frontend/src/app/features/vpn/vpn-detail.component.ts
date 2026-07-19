import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { Vpn } from './vpn.model';

@Component({
  selector: 'app-vpn-detail',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, VencimientoBadgeComponent, SectionCardComponent],
  template: `
    <section class="identity-band">
      <div class="identity-main">
        <span>{{ vpn.titularOrigenLabel }} / {{ vpn.tipoEquipo === 'INIA' ? 'Equipo INIA' : 'Equipo personal' }}</span>
        <h3>{{ vpn.titularNombreCompleto }}</h3>
        <span>{{ vpn.titularCargo }}<ng-container *ngIf="vpn.titularCorreo"> / {{ vpn.titularCorreo }}</ng-container></span>
      </div>
      <div class="identity-side">
        <app-status-badge [label]="vpn.estadoSolicitud" [tone]="estadoTone(vpn.estadoSolicitud)" />
        <app-vencimiento-badge [fecha]="vpn.vence" />
      </div>
    </section>

    <section class="card decision-panel" *ngIf="showDecisionPanel && vpn.estadoSolicitud === 'PENDIENTE'">
      <div>
        <strong>Decision del responsable</strong>
        <span class="muted">Revisa la solicitud y registra el resultado</span>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" (click)="aprobarRequested.emit(vpn)">Aprobar</button>
        <button type="button" class="btn btn-ghost" (click)="resolucionRequested.emit({ vpn, modo: 'OBSERVAR' })">Observar</button>
        <button type="button" class="btn btn-danger" (click)="resolucionRequested.emit({ vpn, modo: 'RECHAZAR' })">Rechazar</button>
      </div>
    </section>

    <section class="module-stats">
      <div class="stat-pill"><strong>{{ vpn.vence || 'Sin fecha' }}</strong><span>Vence VPN</span></div>
      <div class="stat-pill" *ngIf="vpn.vencimientoContrato"><strong>{{ vpn.vencimientoContrato }}</strong><span>Fin contrato</span></div>
      <div class="stat-pill"><strong>{{ vpn.estado || 'Sin estado' }}</strong><span>Estado acceso</span></div>
      <div class="stat-pill"><strong>{{ vpn.solicitadoPorNombre || vpn.solicitadoPor }}</strong><span>Solicitado por</span></div>
    </section>

    <div class="detail-sections">
      <app-section-card title="Solicitud">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field" *ngIf="vpn.titularTipo === 'EXTERNO'"><span class="detail-label">Empresa</span><span class="detail-value">{{ vpn.titularEmpresa || 'No registrado' }}</span></div>
          <div class="detail-field" *ngIf="vpn.titularTipo === 'EXTERNO'"><span class="detail-label">Motivo</span><span class="detail-value">{{ vpn.titularMotivo || 'No registrado' }}</span></div>
          <div class="detail-field" *ngIf="vpn.glpiNombreEquipo"><span class="detail-label">Equipo GLPI</span><span class="detail-value">{{ vpn.glpiNombreEquipo }}<small *ngIf="vpn.glpiIpEquipo"> ({{ vpn.glpiIpEquipo }})</small></span></div>
          <div class="detail-field"><span class="detail-label">Tipo de equipo</span><span class="detail-value">{{ vpn.tipoEquipo === 'INIA' ? 'Equipo de INIA' : 'Equipo personal' }}</span></div>
        </div>
      </app-section-card>

      <app-section-card title="Validacion tecnica">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">Antivirus verificado</span><span class="detail-value">{{ boolLabel(vpn.antivirusVerificado) }}</span></div>
          <div class="detail-field"><span class="detail-label">Analisis antivirus</span><span class="detail-value">{{ boolLabel(vpn.analisisAntivirusRealizado) }}</span></div>
          <div class="detail-field"><span class="detail-label">Sistema operativo</span><span class="detail-value">{{ boolLabel(vpn.sistemaOperativoActualizado) }}</span></div>
          <div class="detail-field"><span class="detail-label">Forticlient</span><span class="detail-value">{{ boolLabel(vpn.forticlientInstalado) }}</span></div>
          <div class="detail-field" *ngIf="vpn.glpiComputerId"><span class="detail-label">Host actualizado</span><span class="detail-value">{{ boolLabel(vpn.hostActualizado) }}</span></div>
        </div>
      </app-section-card>

      <app-section-card title="Antivirus y vencimiento">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">{{ vpn.tipoEquipo === 'INIA' ? 'Antivirus institucional' : 'Antivirus personal' }}</span><span class="detail-value">{{ antivirusOrigenValor(vpn) }}</span></div>
          <div class="detail-field"><span class="detail-label">Fecha base</span><span class="detail-value">{{ fechaBaseAntivirus(vpn) }}</span></div>
          <div class="detail-field"><span class="detail-label">Fin de contrato</span><span class="detail-value">{{ vpn.vencimientoContrato || 'Sin contrato con fecha fin' }}</span></div>
          <div class="detail-field"><span class="detail-label">Fecha final VPN</span><span class="detail-value">{{ vpn.vence || 'Sin fecha' }}<small>{{ venceOrigenLabel(vpn) }}</small></span></div>
        </div>
      </app-section-card>

      <app-section-card title="Resolucion" *ngIf="vpn.aprobadoPorNombre || vpn.comentarioResponsable">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field" *ngIf="vpn.aprobadoPorNombre"><span class="detail-label">Responsable</span><span class="detail-value">{{ vpn.aprobadoPorNombre }}<small>{{ vpn.fechaResolucion }}</small></span></div>
          <div class="detail-field" *ngIf="vpn.comentarioResponsable"><span class="detail-label">Comentario</span><span class="detail-value">{{ vpn.comentarioResponsable }}</span></div>
        </div>
      </app-section-card>

      <app-section-card title="Credenciales VPN" *ngIf="canViewCredenciales">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">Usuario VPN</span><span class="detail-value">{{ vpn.usuarioVpn || 'No asignado' }}</span></div>
          <div class="detail-field"><span class="detail-label">Credencial VPN</span><span class="detail-value">{{ vpn.credencialVpn || 'No asignada' }}</span></div>
        </div>
      </app-section-card>
    </div>

    <footer class="modal-actions">
      <button type="button" class="btn btn-ghost" *ngIf="canEditSolicitud && vpn.estadoSolicitud !== 'APROBADO'" (click)="editRequested.emit(vpn)">Editar</button>
      <button type="button" class="btn btn-danger" *ngIf="canDeleteSolicitud" (click)="deleteRequested.emit(vpn)">Eliminar</button>
    </footer>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnDetailComponent {
  @Input({ required: true }) vpn!: Vpn;
  @Input() canEditSolicitud = false;
  @Input() canDeleteSolicitud = false;
  @Input() showDecisionPanel = false;
  @Input() canViewCredenciales = false;

  @Output() editRequested = new EventEmitter<Vpn>();
  @Output() deleteRequested = new EventEmitter<Vpn>();
  @Output() closeRequested = new EventEmitter<void>();
  @Output() aprobarRequested = new EventEmitter<Vpn>();
  @Output() resolucionRequested = new EventEmitter<{ vpn: Vpn; modo: 'RECHAZAR' | 'OBSERVAR' }>();

  estadoTone(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    if (estado === 'OBSERVADO') return 'warning';
    return 'neutral';
  }

  boolLabel(value: boolean | null | undefined): string {
    if (value === null || value === undefined) return 'No registrado';
    return value ? 'Si' : 'No';
  }

  antivirusOrigenValor(vpn: Vpn): string {
    if (vpn.tipoEquipo === 'INIA') return 'Configuracion institucional';
    return vpn.vencimientoAntivirus ? 'Registrado en la solicitud' : 'Sin fecha registrada';
  }

  fechaBaseAntivirus(vpn: Vpn): string {
    if (vpn.tipoEquipo === 'INIA') return vpn.vencimientoBaseVpn || 'Sin fecha institucional';
    return vpn.vencimientoAntivirus || 'Sin fecha registrada';
  }

  venceOrigenLabel(vpn: Vpn): string {
    if (vpn.venceOrigen === 'CONTRATO') return 'Aplicado por fin de contrato';
    if (vpn.venceOrigen === 'INSTITUCIONAL') return 'Aplicado por fecha institucional';
    if (vpn.venceOrigen === 'ANTIVIRUS_PERSONAL') return 'Aplicado por antivirus personal';
    return 'Sin regla aplicada';
  }
}
