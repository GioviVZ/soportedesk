import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { EquipoEvidencia } from './equipo.model';
import { EquipoService } from './equipo.service';

interface EvidenciaView extends EquipoEvidencia {
  previewUrl: string | null;
}

@Component({
  selector: 'app-equipo-evidencias',
  imports: [FormsModule, ModalComponent],
  templateUrl: './equipo-evidencias.component.html',
  styleUrl: './equipo-evidencias.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EquipoEvidenciasComponent implements OnChanges, OnDestroy {
  private readonly service = inject(EquipoService);
  private readonly authService = inject(AuthService);
  private readonly allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  private readonly maxFileSize = 8 * 1024 * 1024;

  @Input({ required: true }) computerId!: number;
  @Input() sectionNumber: string | null = null;

  evidencias = signal<EvidenciaView[]>([]);
  loading = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  viewerUrl = signal<string | null>(null);
  description = '';

  get canWrite(): boolean {
    return this.authService.canWrite('equipos');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['computerId'] && this.computerId > 0) this.load();
  }

  ngOnDestroy(): void {
    this.releasePreviewUrls();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    const invalidType = files.find((file) => !this.allowedTypes.has(file.type));
    if (invalidType) {
      this.error.set(`"${invalidType.name}" no es una imagen JPG, PNG o WEBP.`);
      input.value = '';
      return;
    }

    const oversized = files.find((file) => file.size > this.maxFileSize);
    if (oversized) {
      this.error.set(`"${oversized.name}" supera el máximo de 8 MB.`);
      input.value = '';
      return;
    }

    this.uploading.set(true);
    this.error.set(null);
    forkJoin(files.map((file) => this.service.subirEvidencia(this.computerId, file, this.description.trim()))).subscribe({
      next: () => {
        this.uploading.set(false);
        this.description = '';
        input.value = '';
        this.load();
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err?.error?.message || 'No se pudieron subir las imágenes. Inténtalo nuevamente.');
        input.value = '';
        this.load();
      },
    });
  }

  view(url: string | null): void {
    if (url) this.viewerUrl.set(url);
  }

  closeViewer(): void {
    this.viewerUrl.set(null);
  }

  remove(evidencia: EvidenciaView): void {
    if (!confirm(`¿Eliminar la imagen "${evidencia.descripcion || evidencia.nombreOriginal}"?`)) return;
    this.service.eliminarEvidencia(this.computerId, evidencia.id).subscribe({
      next: () => {
        if (evidencia.previewUrl) URL.revokeObjectURL(evidencia.previewUrl);
        this.evidencias.set(this.evidencias().filter((item) => item.id !== evidencia.id));
      },
      error: (err) => this.error.set(err?.error?.message || 'No se pudo eliminar la imagen.'),
    });
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getEvidencias(this.computerId).subscribe({
      next: (items) => {
        this.releasePreviewUrls();
        const views: EvidenciaView[] = items.map((item) => ({ ...item, previewUrl: null }));
        this.evidencias.set(views);
        this.loading.set(false);
        views.forEach((view) => {
          this.service.descargarEvidencia(this.computerId, view.id).subscribe({
            next: (blob) => {
              view.previewUrl = URL.createObjectURL(blob);
              this.evidencias.set([...this.evidencias()]);
            },
            error: () => this.error.set(`No se pudo cargar la vista previa de ${view.nombreOriginal}.`),
          });
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'No se pudieron cargar las imágenes del equipo.');
      },
    });
  }

  private releasePreviewUrls(): void {
    this.evidencias().forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    this.viewerUrl.set(null);
  }
}
