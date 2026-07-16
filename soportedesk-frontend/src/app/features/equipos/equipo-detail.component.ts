import { Component, Input, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipoDetalle, EquipoEvidencia, EquipoOficina, EquipoSoftware, EquipoTeclado } from './equipo.model';
import { EquipoService } from './equipo.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuthService } from '../../core/auth/auth.service';

interface MonitorRow {
  nombre: string;
  modelo: string;
  fabricante: string;
  serial: string;
}

interface EvidenciaView extends EquipoEvidencia {
  previewUrl: string | null;
}

@Component({
  selector: 'app-equipo-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './equipo-detail.component.html',
  styleUrl: './equipo-detail.component.scss',
})
export class EquipoDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EquipoService);
  private authService = inject(AuthService);

  @Input() id: number | null = null;
  @Input() embedded = false;

  equipo = signal<EquipoDetalle | null>(null);
  software = signal<EquipoSoftware[]>([]);
  teclado = signal<EquipoTeclado | null>(null);
  oficina = signal<EquipoOficina | null>(null);
  tipoEfectivo = signal<string | null>(null);
  softwareFilter = signal('');

  evidencias = signal<EvidenciaView[]>([]);
  subiendoEvidencia = signal(false);
  errorEvidencia = signal<string | null>(null);
  visorUrl = signal<string | null>(null);
  descripcionEvidencia = '';

  private equipoId = 0;

  monitores = computed(() => this.parseMonitores(this.equipo()));
  filteredSoftware = computed(() => {
    const term = this.softwareFilter().trim().toLowerCase();
    if (!term) return this.software();
    return this.software().filter((row) => row.software?.toLowerCase().includes(term));
  });

  get canWrite(): boolean {
    return this.authService.canWrite('equipos');
  }

  ngOnInit(): void {
    this.equipoId = this.id ?? Number(this.route.snapshot.paramMap.get('id'));
    this.service.getDetalle(this.equipoId).subscribe((response) => {
      this.equipo.set(response.equipo);
      this.software.set(response.software ?? []);
      this.teclado.set(response.teclado);
      this.oficina.set(response.oficina);
      this.tipoEfectivo.set(response.tipoEfectivo);
    });
    this.loadEvidencias();
  }

  ngOnDestroy(): void {
    this.evidencias().forEach((e) => { if (e.previewUrl) URL.revokeObjectURL(e.previewUrl); });
    const visor = this.visorUrl();
    if (visor) URL.revokeObjectURL(visor);
  }

  loadEvidencias(): void {
    this.service.getEvidencias(this.equipoId).subscribe((items) => {
      const views: EvidenciaView[] = items.map((item) => ({ ...item, previewUrl: null }));
      this.evidencias.set(views);
      views.forEach((view) => {
        this.service.descargarEvidencia(this.equipoId, view.id).subscribe((blob) => {
          view.previewUrl = URL.createObjectURL(blob);
          this.evidencias.set([...this.evidencias()]);
        });
      });
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.subiendoEvidencia.set(true);
    this.errorEvidencia.set(null);
    this.service.subirEvidencia(this.equipoId, file, this.descripcionEvidencia).subscribe({
      next: (nueva) => {
        this.subiendoEvidencia.set(false);
        this.descripcionEvidencia = '';
        input.value = '';
        const view: EvidenciaView = { ...nueva, previewUrl: null };
        this.evidencias.set([view, ...this.evidencias()]);
        this.service.descargarEvidencia(this.equipoId, nueva.id).subscribe((blob) => {
          view.previewUrl = URL.createObjectURL(blob);
          this.evidencias.set([...this.evidencias()]);
        });
      },
      error: (err) => {
        this.subiendoEvidencia.set(false);
        this.errorEvidencia.set(err?.error?.message || 'No se pudo subir la evidencia.');
        input.value = '';
      },
    });
  }

  verEvidencia(url: string | null): void {
    if (url) this.visorUrl.set(url);
  }

  cerrarVisor(): void {
    this.visorUrl.set(null);
  }

  eliminarEvidencia(evidencia: EvidenciaView): void {
    if (!confirm(`¿Eliminar la evidencia "${evidencia.nombreOriginal}"?`)) return;
    this.service.eliminarEvidencia(this.equipoId, evidencia.id).subscribe(() => {
      if (evidencia.previewUrl) URL.revokeObjectURL(evidencia.previewUrl);
      this.evidencias.set(this.evidencias().filter((e) => e.id !== evidencia.id));
    });
  }

  back(): void {
    if (this.embedded) return;
    this.router.navigate(['/equipos']);
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
