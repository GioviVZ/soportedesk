import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DashboardBreakdownComponent, DashboardBreakdownItem } from '../../shared/dashboard-breakdown/dashboard-breakdown.component';
import { Wifi } from './wifi.model';
import { WifiService } from './wifi.service';

@Component({
  selector: 'app-wifi-dashboard',
  imports: [DashboardBreakdownComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title"><strong>Panorama de redes WiFi</strong><span>Estado, cobertura y seguridad de las redes registradas.</span></div>
        <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">{{ loading ? 'Actualizando' : 'Actualizar' }}</button>
      </div>
      @if (error) { <div class="module-dash-notice">No se pudo cargar el dashboard.</div> }

      <section class="module-dash-stats">
        <div class="module-dash-stat"><span>Total</span><strong>{{ items.length }}</strong><small>Redes registradas</small></div>
        <div class="module-dash-stat tone-success"><span>Activas</span><strong>{{ active }}</strong><small>Disponibles</small></div>
        <div class="module-dash-stat tone-warning"><span>Inactivas</span><strong>{{ items.length - active }}</strong><small>Requieren revisión</small></div>
        <div class="module-dash-stat tone-info"><span>Ubicaciones</span><strong>{{ grouped('ubicacion').length }}</strong><small>Cobertura registrada</small></div>
      </section>

      <section class="module-dash-breakdowns">
        <app-dashboard-breakdown title="Redes por ubicación" subtitle="Cobertura por sede o ambiente" unit="redes" [items]="grouped('ubicacion')" [expanded]="true" [colors]="locationColors" />
        <app-dashboard-breakdown title="Tipo de seguridad" subtitle="Configuración declarada de las redes" unit="redes" [items]="grouped('tipo')" [colors]="securityColors" />
      </section>
    </div>
  `,
})
export class WifiDashboardComponent implements OnInit {
  private service = inject(WifiService);
  items: Wifi[] = [];
  loading = false;
  error = false;
  readonly locationColors = ['#23757b', '#3e9292', '#64aeaa', '#87c4b9', '#466c8a', '#6c91aa'];
  readonly securityColors = ['#315d8a', '#5a8fb8', '#77afc7', '#2f766d', '#6b9b71'];

  get active(): number { return this.items.filter((item) => item.estado?.toLowerCase() === 'activa').length; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getAll().subscribe({
      next: (items) => { this.items = items; this.loading = false; },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  grouped(field: 'ubicacion' | 'tipo'): DashboardBreakdownItem[] {
    const grouped = new Map<string, number>();
    this.items.forEach((item) => {
      const label = item[field] || 'Sin dato';
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    });
    return [...grouped].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }
}
