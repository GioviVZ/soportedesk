import { Component, Input, Output, EventEmitter, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipoDetalle, EquipoOficina, EquipoSoftware, EquipoTeclado } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoEvidenciasComponent } from './equipo-evidencias.component';

interface MonitorRow {
  nombre: string;
  modelo: string;
  fabricante: string;
  serial: string;
}

@Component({
    selector: 'app-equipo-detail',
    imports: [FormsModule, EquipoEvidenciasComponent],
    templateUrl: './equipo-detail.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './equipo-detail.component.scss'
})
export class EquipoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EquipoService);

  @Input() id: number | null = null;
  @Input() embedded = false;
  @Output() closeRequested = new EventEmitter<void>();

  equipo = signal<EquipoDetalle | null>(null);
  software = signal<EquipoSoftware[]>([]);
  teclado = signal<EquipoTeclado | null>(null);
  oficina = signal<EquipoOficina | null>(null);
  tipoEfectivo = signal<string | null>(null);
  softwareFilter = signal('');
  softwareExpanded = signal(false);
  readonly softwarePreviewCount = 6;

  private equipoId = 0;

  monitores = computed(() => this.parseMonitores(this.equipo()));
  filteredSoftware = computed(() => {
    const term = this.softwareFilter().trim().toLowerCase();
    if (!term) return this.software();
    return this.software().filter((row) => row.software?.toLowerCase().includes(term));
  });
  visibleSoftware = computed(() => {
    const all = this.filteredSoftware();
    return this.softwareExpanded() || all.length <= this.softwarePreviewCount
      ? all
      : all.slice(0, this.softwarePreviewCount);
  });

  ngOnInit(): void {
    this.equipoId = this.id ?? Number(this.route.snapshot.paramMap.get('id'));
    this.service.getDetalle(this.equipoId).subscribe((response) => {
      this.equipo.set(response.equipo);
      this.software.set(response.software ?? []);
      this.teclado.set(response.teclado);
      this.oficina.set(response.oficina);
      this.tipoEfectivo.set(response.tipoEfectivo);
    });
  }

  back(): void {
    if (this.embedded) {
      this.closeRequested.emit();
      return;
    }
    this.router.navigate(['/equipos']);
  }

  toggleSoftwareExpanded(): void {
    this.softwareExpanded.set(!this.softwareExpanded());
  }

  stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  gbLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} GB`;
  }

  frequencyLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} MHz`;
  }

  mhzLabel(value: string | null | undefined): string {
    if (!value?.trim()) return '-';
    return /mhz/i.test(value) ? value : `${value} MHz`;
  }

  empty(value: unknown): string {
    return value == null || value === '' ? '-' : String(value);
  }

  private static readonly INVENTORY_JUNK_VALUES = new Set([
    '0000000000',
    'no asset information',
    'chassis asset tag',
    'default string',
    'to be filled by o.e.m.',
  ]);

  inventoryLabel(value: string | null | undefined): string {
    if (value == null || value.trim() === '') return '-';
    return EquipoDetailComponent.INVENTORY_JUNK_VALUES.has(value.trim().toLowerCase()) ? '-' : value;
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  dateOnly(iso: string | null | undefined): string {
    if (!iso) return '-';
    const [year, month, day] = iso.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : iso;
  }

  private parseMonitores(equipo: EquipoDetalle | null): MonitorRow[] {
    if (!equipo) return [];
    const monitores: MonitorRow[] = [];
    if (equipo.monitor1Nombre || equipo.monitor1Serie || equipo.monitor1Marca || equipo.monitor1Modelo) {
      monitores.push({
        nombre: equipo.monitor1Nombre ?? '-',
        modelo: equipo.monitor1Modelo ?? '-',
        fabricante: equipo.monitor1Marca ?? '-',
        serial: equipo.monitor1Serie ?? '-',
      });
    }
    if (equipo.monitor2Nombre || equipo.monitor2Serie || equipo.monitor2Marca || equipo.monitor2Modelo) {
      monitores.push({
        nombre: equipo.monitor2Nombre ?? '-',
        modelo: equipo.monitor2Modelo ?? '-',
        fabricante: equipo.monitor2Marca ?? '-',
        serial: equipo.monitor2Serie ?? '-',
      });
    }
    return monitores;
  }
}
