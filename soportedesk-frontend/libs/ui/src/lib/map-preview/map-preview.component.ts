import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import type { Map, Marker, TileLayer } from 'leaflet';
import { createMapPinIcon } from '../map-picker/map-pin';

interface PreviewCoordinates {
  latitud: number;
  longitud: number;
}

const PREVIEW_ZOOM = 17;

@Component({
  selector: 'app-map-preview',
  standalone: true,
  templateUrl: './map-preview.component.html',
  styleUrl: './map-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapPreviewComponent implements OnChanges, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  @Input() latitud: number | null = null;
  @Input() longitud: number | null = null;
  @Input() titulo = '';
  @Input() height = 260;

  mapLoadError = false;

  private coordinates: PreviewCoordinates | null = null;
  private mapContainer: ElementRef<HTMLDivElement> | null = null;
  private leaflet: typeof import('leaflet') | null = null;
  private map: Map | null = null;
  private marker: Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private initializing = false;
  private destroyed = false;

  @ViewChild('mapContainer')
  private set mapContainerRef(element: ElementRef<HTMLDivElement> | undefined) {
    this.mapContainer = element ?? null;
    if (element && this.coordinates && !this.map) void this.initializeMap();
  }

  get hasCoordinates(): boolean {
    return this.coordinates !== null;
  }

  get coordinatesText(): string {
    if (!this.coordinates) return '';
    return `${this.coordinates.latitud.toFixed(6)}, ${this.coordinates.longitud.toFixed(6)}`;
  }

  get googleMapsUrl(): string {
    if (!this.coordinates) return '';
    return `https://www.google.com/maps?q=${this.coordinates.latitud},${this.coordinates.longitud}`;
  }

  get mapAriaLabel(): string {
    const title = this.titulo.trim();
    return title ? `Mapa de ubicación de ${title}` : 'Mapa de la ubicación registrada';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['latitud'] || changes['longitud']) {
      this.coordinates = this.validCoordinates(this.latitud, this.longitud);
      if (!this.coordinates) {
        this.teardownMap();
      } else if (this.map && this.marker) {
        this.marker.setLatLng([this.coordinates.latitud, this.coordinates.longitud]);
        this.map.setView([this.coordinates.latitud, this.coordinates.longitud], PREVIEW_ZOOM);
      } else if (this.mapContainer) {
        void this.initializeMap();
      }
    }

    if (changes['titulo'] && this.marker) this.updateMarkerTooltip();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.teardownMap();
  }

  private async initializeMap(): Promise<void> {
    if (this.initializing || this.map || !this.mapContainer || !this.coordinates || this.destroyed) return;
    this.initializing = true;

    try {
      const m = await import('leaflet');
      const L = ((m as unknown as { default?: typeof m }).default ?? m) as typeof m;
      if (this.destroyed || !this.mapContainer || !this.coordinates) return;

      this.leaflet = L;
      const coordinates = this.coordinates;
      this.map = L.map(this.mapContainer.nativeElement, { scrollWheelZoom: false })
        .setView([coordinates.latitud, coordinates.longitud], PREVIEW_ZOOM);

      const streetLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      });
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Tiles &copy; Esri' },
      );

      this.watchForTileErrors(streetLayer);
      this.watchForTileErrors(satelliteLayer);
      streetLayer.addTo(this.map);
      L.control.layers({ Mapa: streetLayer, 'Satélite': satelliteLayer }, undefined, { position: 'topright' })
        .addTo(this.map);

      this.marker = L.marker([coordinates.latitud, coordinates.longitud], {
        icon: createMapPinIcon(L),
        draggable: false,
      }).addTo(this.map);
      this.updateMarkerTooltip();

      this.map.invalidateSize();
      requestAnimationFrame(() => this.map?.invalidateSize());
      this.observeContainerSize();
    } catch (error) {
      console.error('No se pudo inicializar el mapa de solo lectura', error);
      this.showMapLoadError();
    } finally {
      this.initializing = false;
    }
  }

  private validCoordinates(latitud: number | null, longitud: number | null): PreviewCoordinates | null {
    if (
      typeof latitud !== 'number'
      || typeof longitud !== 'number'
      || !Number.isFinite(latitud)
      || !Number.isFinite(longitud)
      || latitud < -90
      || latitud > 90
      || longitud < -180
      || longitud > 180
    ) {
      return null;
    }

    return {
      latitud: Number(latitud.toFixed(6)),
      longitud: Number(longitud.toFixed(6)),
    };
  }

  private updateMarkerTooltip(): void {
    if (!this.marker) return;
    this.marker.unbindTooltip();
    const title = this.titulo.trim();
    if (title) this.marker.bindTooltip(title);
  }

  // Un mosaico fallido aislado es normal en redes lentas: solo se avisa si
  // la capa no ha logrado cargar ninguno, y el aviso se retira al cargar uno.
  private watchForTileErrors(layer: TileLayer): void {
    let tilesLoaded = 0;
    layer.on('tileload', () => {
      tilesLoaded++;
      if (this.mapLoadError) {
        this.mapLoadError = false;
        this.changeDetectorRef.markForCheck();
      }
    });
    layer.on('tileerror', () => {
      if (tilesLoaded === 0) this.showMapLoadError();
    });
  }

  private showMapLoadError(): void {
    this.mapLoadError = true;
    this.changeDetectorRef.markForCheck();
  }

  private observeContainerSize(): void {
    if (!this.mapContainer || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  private teardownMap(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.map?.remove();
    this.map = null;
    this.marker = null;
    this.mapLoadError = false;
  }
}
