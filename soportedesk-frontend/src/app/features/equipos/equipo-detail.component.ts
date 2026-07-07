import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipoDetalle, EquipoEnrichmentDto, EquipoSoftware, EquipoTeclado, HistorialItem } from './equipo.model';
import { EquipoService } from './equipo.service';
import { AuthService } from '../../core/auth/auth.service';

interface MonitorRow {
  nombre: string;
  modelo: string;
  fabricante: string;
  serial: string;
}

@Component({
  selector: 'app-equipo-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo-detail.component.html',
  styleUrl: './equipo-detail.component.scss',
})
export class EquipoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EquipoService);
  auth = inject(AuthService);

  equipo = signal<EquipoDetalle | null>(null);
  software = signal<EquipoSoftware[]>([]);
  teclado = signal<EquipoTeclado | null>(null);
  tipoEfectivo = signal<string | null>(null);
  enrichment = signal<EquipoEnrichmentDto>({
    tipoOverride: null,
    fabricanteOverride: null,
    modeloOverride: null,
    codigoPatrimonial: null,
    estadoDepuracion: null,
    observaciones: null,
    revisadoPor: null,
    fechaRevision: null,
  });
  historial = signal<HistorialItem[]>([]);
  savingEnrichment = signal(false);
  saveSuccess = signal(false);
  softwareFilter = signal('');

  private equipoId = 0;

  monitores = computed(() => this.parseMonitores(this.equipo()));
  filteredSoftware = computed(() => {
    const term = this.softwareFilter().trim().toLowerCase();
    if (!term) return this.software();
    return this.software().filter((row) => row.software?.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.equipoId = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getDetalle(this.equipoId).subscribe((response) => {
      this.equipo.set(response.equipo);
      this.software.set(response.software ?? []);
      this.teclado.set(response.teclado);
      this.tipoEfectivo.set(response.tipoEfectivo);
      if (response.enrichment) this.enrichment.set(response.enrichment);
    });
    this.service.getHistorial(this.equipoId).subscribe((h) => this.historial.set(h));
  }

  saveEnrichment(): void {
    this.savingEnrichment.set(true);
    this.saveSuccess.set(false);
    this.service.saveEnrichment(this.equipoId, this.enrichment()).subscribe({
      next: (saved) => {
        this.enrichment.set(saved);
        this.service.getHistorial(this.equipoId).subscribe((h) => this.historial.set(h));
        this.savingEnrichment.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => this.savingEnrichment.set(false),
    });
  }

  updateField(field: keyof EquipoEnrichmentDto, value: string): void {
    this.enrichment.update((e) => ({ ...e, [field]: value || null }));
  }

  back(): void {
    this.router.navigate(['/equipos']);
  }

  stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  gbLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} GB`;
  }

  empty(value: unknown): string {
    return value == null || value === '' ? '-' : String(value);
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private parseMonitores(equipo: EquipoDetalle | null): MonitorRow[] {
    if (!equipo || !equipo.monCantidad) return [];
    const nombres = this.splitPipe(equipo.monNombres);
    const modelos = this.splitPipe(equipo.monModelos);
    const fabricantes = this.splitPipe(equipo.monFabricantes);
    const seriales = this.splitPipe(equipo.monSeriales);
    const count = Math.max(equipo.monCantidad, nombres.length, modelos.length, fabricantes.length, seriales.length);
    return Array.from({ length: count }, (_, i) => ({
      nombre: nombres[i] ?? '-',
      modelo: modelos[i] ?? '-',
      fabricante: fabricantes[i] ?? '-',
      serial: seriales[i] ?? '-',
    }));
  }

  private splitPipe(value: string | null | undefined): string[] {
    return (value ?? '').split('|').map((p) => p.trim()).filter(Boolean);
  }
}
