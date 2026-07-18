import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Impresora, ImpresoraIntervencion, ImpresoraIntervencionAdjunto, impresoraEstadoTone } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { ModeloImpresoraToner } from '../../core/models/catalogo.model';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type FichaTab = 'instalacion' | 'consumibles' | 'driver' | 'intervenciones';

interface AdjuntoView extends ImpresoraIntervencionAdjunto {
  previewUrl: string | null;
}

interface IntervencionView extends Omit<ImpresoraIntervencion, 'adjuntos'> {
  adjuntos: AdjuntoView[];
}

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SectionCardComponent, StatusBadgeComponent],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private catalogoService = inject(CatalogoService);
  private impresoraService = inject(ImpresoraService);

  @Input({ required: true }) impresora!: Impresora;
  @Input() allowActions = true;
  @Output() editRequested = new EventEmitter<Impresora>();

  activeTab: FichaTab = 'instalacion';
  readonly impresoraEstadoTone = impresoraEstadoTone;

  intervenciones = signal<IntervencionView[]>([]);
  errorIntervencion = signal<string | null>(null);
  guardandoIntervencion = signal(false);
  visorUrl = signal<string | null>(null);
  nuevaFecha = '';
  nuevaObservacion = '';
  editando: IntervencionView | null = null;
  editFecha = '';
  editObservacion = '';

  get isAdmin(): boolean {
    return this.authService.canWrite('impresoras');
  }

  get canWriteIntervenciones(): boolean {
    return this.isAdmin && this.allowActions;
  }

  get tonersPorColor(): { color: string; variantes: ModeloImpresoraToner[] }[] {
    const grupos = new Map<string, ModeloImpresoraToner[]>();
    for (const toner of this.impresora.modeloImpresora?.toners ?? []) {
      const lista = grupos.get(toner.color) ?? [];
      lista.push(toner);
      grupos.set(toner.color, lista);
    }
    return Array.from(grupos.entries()).map(([color, variantes]) => ({ color, variantes }));
  }

  ngOnInit(): void {
    this.loadIntervenciones();
  }

  ngOnDestroy(): void {
    this.intervenciones().forEach((i) => i.adjuntos.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); }));
    const visor = this.visorUrl();
    if (visor) URL.revokeObjectURL(visor);
  }

  setTab(tab: FichaTab): void {
    this.activeTab = tab;
  }

  downloadDriver(): void {
    const modeloId = this.impresora.modeloImpresora.id;
    this.catalogoService.downloadModeloImpresoraDriver(modeloId).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.impresora.modeloImpresora.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  loadIntervenciones(): void {
    this.impresoraService.getIntervenciones(this.impresora.id).subscribe((items) => {
      const views: IntervencionView[] = items.map((item) => ({
        ...item,
        adjuntos: item.adjuntos.map((a) => ({ ...a, previewUrl: null })),
      }));
      this.intervenciones.set(views);
      views.forEach((view) => view.adjuntos.forEach((adjunto) => this.cargarPreview(view.id, adjunto)));
    });
  }

  crearIntervencion(): void {
    if (!this.nuevaFecha || !this.nuevaObservacion.trim()) return;
    this.guardandoIntervencion.set(true);
    this.errorIntervencion.set(null);
    this.impresoraService.crearIntervencion(this.impresora.id, { fecha: this.nuevaFecha, observacion: this.nuevaObservacion.trim() })
      .subscribe({
        next: (nueva) => {
          this.guardandoIntervencion.set(false);
          this.nuevaFecha = '';
          this.nuevaObservacion = '';
          const view: IntervencionView = { ...nueva, adjuntos: [] };
          this.intervenciones.set([view, ...this.intervenciones()]);
        },
        error: (err) => {
          this.guardandoIntervencion.set(false);
          this.errorIntervencion.set(err?.error?.message || 'No se pudo registrar la intervención.');
        },
      });
  }

  iniciarEdicion(intervencion: IntervencionView): void {
    this.editando = intervencion;
    this.editFecha = intervencion.fecha;
    this.editObservacion = intervencion.observacion;
  }

  cancelarEdicion(): void {
    this.editando = null;
  }

  guardarEdicion(): void {
    if (!this.editando || !this.editFecha || !this.editObservacion.trim()) return;
    const intervencionId = this.editando.id;
    this.impresoraService.actualizarIntervencion(this.impresora.id, intervencionId, {
      fecha: this.editFecha,
      observacion: this.editObservacion.trim(),
    }).subscribe((actualizada) => {
      this.intervenciones.set(this.intervenciones().map((i) =>
        i.id === intervencionId ? { ...i, fecha: actualizada.fecha, observacion: actualizada.observacion } : i
      ));
      this.editando = null;
    });
  }

  eliminarIntervencion(intervencion: IntervencionView): void {
    if (!confirm(`¿Eliminar la intervención del ${intervencion.fecha}?`)) return;
    intervencion.adjuntos.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
    this.impresoraService.eliminarIntervencion(this.impresora.id, intervencion.id).subscribe(() => {
      this.intervenciones.set(this.intervenciones().filter((i) => i.id !== intervencion.id));
    });
  }

  onAdjuntosSelected(event: Event, intervencionId: number): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    this.errorIntervencion.set(null);
    this.impresoraService.subirAdjuntos(this.impresora.id, intervencionId, files).subscribe({
      next: (nuevosAdjuntos) => {
        input.value = '';
        const views: AdjuntoView[] = nuevosAdjuntos.map((a) => ({ ...a, previewUrl: null }));
        this.intervenciones.set(this.intervenciones().map((i) =>
          i.id === intervencionId ? { ...i, adjuntos: [...i.adjuntos, ...views] } : i
        ));
        views.forEach((adjunto) => this.cargarPreview(intervencionId, adjunto));
      },
      error: (err) => {
        this.errorIntervencion.set(err?.error?.message || 'No se pudo subir el/los archivo(s).');
        input.value = '';
      },
    });
  }

  eliminarAdjunto(intervencionId: number, adjunto: AdjuntoView): void {
    if (!confirm(`¿Eliminar el adjunto "${adjunto.nombreOriginal}"?`)) return;
    this.impresoraService.eliminarAdjunto(this.impresora.id, intervencionId, adjunto.id).subscribe(() => {
      if (adjunto.previewUrl) URL.revokeObjectURL(adjunto.previewUrl);
      this.intervenciones.set(this.intervenciones().map((i) =>
        i.id === intervencionId ? { ...i, adjuntos: i.adjuntos.filter((a) => a.id !== adjunto.id) } : i
      ));
    });
  }

  abrirAdjunto(intervencionId: number, adjunto: AdjuntoView): void {
    if (adjunto.mimeType.startsWith('image/')) {
      if (adjunto.previewUrl) this.visorUrl.set(adjunto.previewUrl);
      return;
    }
    this.impresoraService.descargarAdjunto(this.impresora.id, intervencionId, adjunto.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = adjunto.nombreOriginal;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  cerrarVisor(): void {
    this.visorUrl.set(null);
  }

  private cargarPreview(intervencionId: number, adjunto: AdjuntoView): void {
    if (!adjunto.mimeType.startsWith('image/')) return;
    this.impresoraService.descargarAdjunto(this.impresora.id, intervencionId, adjunto.id).subscribe((blob) => {
      adjunto.previewUrl = URL.createObjectURL(blob);
      this.intervenciones.set([...this.intervenciones()]);
    });
  }
}
