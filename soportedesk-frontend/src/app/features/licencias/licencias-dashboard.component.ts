import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Licencia } from './licencia.model';
import { LicenciaService } from './licencia.service';

@Component({
  selector: 'app-licencias-dashboard', standalone: true, imports: [CommonModule],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar"><div class="module-dash-title"><strong>Panorama de licencias</strong><span>Compras, unidades y activaciones registradas.</span></div><button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">{{ loading ? 'Actualizando' : 'Actualizar' }}</button></div>
      <div class="module-dash-notice" *ngIf="error">No se pudo cargar el dashboard.</div>
      <section class="module-dash-stats">
        <div class="module-dash-stat"><span>Registros</span><strong>{{ items.length }}</strong><small>Licencias registradas</small></div>
        <div class="module-dash-stat tone-info"><span>Unidades</span><strong>{{ units }}</strong><small>Unidades adquiridas</small></div>
        <div class="module-dash-stat"><span>Activaciones</span><strong>{{ activations }}</strong><small>Cuentas configuradas</small></div>
        <div class="module-dash-stat tone-warning"><span>Sin activación</span><strong>{{ withoutActivation }}</strong><small>Registros por completar</small></div>
      </section>
      <section class="module-dash-grid">
        <article class="module-dash-card"><header class="module-dash-card__header"><div><strong>Por tipo de licencia</strong><span>Distribución de unidades</span></div></header><div class="module-dash-list"><div class="module-dash-row tone-info" *ngFor="let row of grouped('tipo')"><strong>{{ row.label }}</strong><small>{{ row.total }} unidades</small></div></div></article>
        <article class="module-dash-card"><header class="module-dash-card__header"><div><strong>Por año</strong><span>Unidades adquiridas por periodo</span></div></header><div class="module-dash-list"><div class="module-dash-row" *ngFor="let row of grouped('anio')"><strong>{{ row.label }}</strong><small>{{ row.total }} unidades</small></div></div></article>
      </section>
    </div>`,
})
export class LicenciasDashboardComponent implements OnInit {
  private service = inject(LicenciaService); items: Licencia[] = []; loading = false; error = false;
  get units(): number { return this.items.reduce((n,x) => n + (x.cantidad ?? 0), 0); }
  get activations(): number { return this.items.reduce((n,x) => n + (x.activaciones?.length || (x.cuentaActivacion || x.claveActivacion ? 1 : 0)), 0); }
  get withoutActivation(): number { return this.items.filter(x => !(x.activaciones?.length || x.cuentaActivacion || x.claveActivacion)).length; }
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.error = false; this.service.getAll().subscribe({ next: x => { this.items = x; this.loading = false; }, error: () => { this.error = true; this.loading = false; } }); }
  grouped(field: 'tipo' | 'anio'): { label: string; total: number }[] { const map = new Map<string, number>(); this.items.forEach(x => { const key = field === 'tipo' ? (x.tipoLicencia?.nombre || 'Sin tipo') : (x.anio || 'Sin año'); map.set(key, (map.get(key) ?? 0) + (x.cantidad ?? 0)); }); return [...map].map(([label,total]) => ({label,total})).sort((a,b) => b.total-a.total); }
}
