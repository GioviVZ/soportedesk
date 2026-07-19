import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DashboardBreakdownComponent, DashboardBreakdownItem } from '../../shared/dashboard-breakdown/dashboard-breakdown.component';
import { Licencia } from './licencia.model';
import { LicenciaService } from './licencia.service';

@Component({
  selector: 'app-licencias-dashboard',
  imports: [DashboardBreakdownComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title"><strong>Panorama de licencias</strong><span>Compras, unidades y activaciones registradas.</span></div>
        <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">{{ loading ? 'Actualizando' : 'Actualizar' }}</button>
      </div>
      @if (error) { <div class="module-dash-notice">No se pudo cargar el dashboard.</div> }

      <section class="module-dash-stats">
        <div class="module-dash-stat"><span>Registros</span><strong>{{ items.length }}</strong><small>Licencias registradas</small></div>
        <div class="module-dash-stat tone-info"><span>Unidades</span><strong>{{ units }}</strong><small>Unidades adquiridas</small></div>
        <div class="module-dash-stat tone-success"><span>Activaciones</span><strong>{{ activations }}</strong><small>Cuentas configuradas</small></div>
        <div class="module-dash-stat tone-warning"><span>Sin activación</span><strong>{{ withoutActivation }}</strong><small>Registros por completar</small></div>
      </section>

      <section class="module-dash-breakdowns">
        <app-dashboard-breakdown title="Unidades por tipo de licencia" subtitle="Qué licencias concentran más unidades" unit="unidades" [items]="grouped('tipo')" [expanded]="true" [colors]="licenseColors" />
        <app-dashboard-breakdown title="Unidades por año" subtitle="Volumen adquirido en cada periodo" unit="unidades" [items]="grouped('anio')" [colors]="yearColors" />
      </section>
    </div>
  `,
})
export class LicenciasDashboardComponent implements OnInit {
  private service = inject(LicenciaService);
  items: Licencia[] = [];
  loading = false;
  error = false;
  readonly licenseColors = ['#8a641f', '#b48935', '#d0ab5a', '#e0c483', '#6c748c', '#48546f'];
  readonly yearColors = ['#315d8a', '#5485aa', '#76a8c0', '#2f766d', '#78a27c'];

  get units(): number { return this.items.reduce((total, item) => total + (item.cantidad ?? 0), 0); }
  get activations(): number { return this.items.reduce((total, item) => total + (item.activaciones?.length || (item.cuentaActivacion || item.claveActivacion ? 1 : 0)), 0); }
  get withoutActivation(): number { return this.items.filter((item) => !(item.activaciones?.length || item.cuentaActivacion || item.claveActivacion)).length; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getAll().subscribe({
      next: (items) => { this.items = items; this.loading = false; },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  grouped(field: 'tipo' | 'anio'): DashboardBreakdownItem[] {
    const grouped = new Map<string, number>();
    this.items.forEach((item) => {
      const label = field === 'tipo' ? (item.tipoLicencia?.nombre || 'Sin tipo') : (item.anio || 'Sin año');
      grouped.set(label, (grouped.get(label) ?? 0) + (item.cantidad ?? 0));
    });
    return [...grouped].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }
}
