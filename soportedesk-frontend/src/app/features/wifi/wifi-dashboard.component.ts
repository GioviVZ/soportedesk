import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Wifi } from './wifi.model';
import { WifiService } from './wifi.service';

@Component({
  selector: 'app-wifi-dashboard', standalone: true, imports: [CommonModule],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar"><div class="module-dash-title"><strong>Panorama de redes WiFi</strong><span>Estado, seguridad y distribución de las redes registradas.</span></div><button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">{{ loading ? 'Actualizando' : 'Actualizar' }}</button></div>
      <div class="module-dash-notice" *ngIf="error">No se pudo cargar el dashboard.</div>
      <section class="module-dash-stats">
        <div class="module-dash-stat"><span>Total</span><strong>{{ items.length }}</strong><small>Redes registradas</small></div>
        <div class="module-dash-stat"><span>Activas</span><strong>{{ active }}</strong><small>Disponibles</small></div>
        <div class="module-dash-stat tone-warning"><span>Inactivas</span><strong>{{ items.length - active }}</strong><small>Requieren revisión</small></div>
        <div class="module-dash-stat tone-info"><span>Ubicaciones</span><strong>{{ grouped('ubicacion').length }}</strong><small>Cobertura registrada</small></div>
      </section>
      <section class="module-dash-grid">
        <article class="module-dash-card"><header class="module-dash-card__header"><div><strong>Por ubicación</strong><span>Redes disponibles por sede o ambiente</span></div></header><div class="module-dash-list"><div class="module-dash-row tone-info" *ngFor="let row of grouped('ubicacion')"><strong>{{ row.label }}</strong><small>{{ row.total }} redes</small></div></div></article>
        <article class="module-dash-card"><header class="module-dash-card__header"><div><strong>Por tipo de seguridad</strong><span>Configuración declarada de las redes</span></div></header><div class="module-dash-list"><div class="module-dash-row" *ngFor="let row of grouped('tipo')"><strong>{{ row.label }}</strong><small>{{ row.total }} redes</small></div></div></article>
      </section>
    </div>`,
})
export class WifiDashboardComponent implements OnInit {
  private service = inject(WifiService); items: Wifi[] = []; loading = false; error = false;
  get active(): number { return this.items.filter(x => x.estado?.toLowerCase() === 'activa').length; }
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.error = false; this.service.getAll().subscribe({ next: x => { this.items = x; this.loading = false; }, error: () => { this.error = true; this.loading = false; } }); }
  grouped(field: 'ubicacion' | 'tipo'): { label: string; total: number }[] { const map = new Map<string, number>(); this.items.forEach(x => { const key = x[field] || 'Sin dato'; map.set(key, (map.get(key) ?? 0) + 1); }); return [...map].map(([label,total]) => ({label,total})).sort((a,b) => b.total-a.total); }
}
