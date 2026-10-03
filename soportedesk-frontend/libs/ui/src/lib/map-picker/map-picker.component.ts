import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import type { LeafletEvent, Map, Marker, TileLayer } from 'leaflet';
import { Coordinates, parseCoordinates } from './coordinate-parser';

const DEFAULT_CENTER: [number, number] = [-12.082, -76.943];
const DEFAULT_ZOOM = 15;
const SELECTED_ZOOM = 18;

@Component({
  selector: 'app-map-picker',
  standalone: true,
  templateUrl: './map-picker.component.html',
  styleUrl: './map-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  @ViewChild('mapContainer', { static: true }) private mapContainer!: ElementRef<HTMLDivElement>;

  @Input() latitud: number | null = null;
  @Input() longitud: number | null = null;
  @Input() disabled = false;
  @Output() readonly coordenadasChange = new EventEmitter<Coordinates>();

  pasteText = '';
  statusMessage = '';
  mapLoadError = false;

  private leaflet: typeof import('leaflet') | null = null;
  private map: Map | null = null;
  private marker: Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private selectedCoordinates: Coordinates | null = null;
  private destroyed = false;

  get hasCoordinates(): boolean {
    return this.selectedCoordinates !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['latitud'] || changes['longitud']) {
      const coordinates = this.inputCoordinates();
      if (coordinates) {
        this.selectedCoordinates = coordinates;
        this.syncMarkerWithInputs(coordinates);
      } else if (this.latitud === null || this.longitud === null) {
        this.selectedCoordinates = null;
        this.removeMarker();
      }
    }

    if (changes['disabled']) this.updateMarkerDragging();
  }

  async ngAfterViewInit(): Promise<void> {
    this.selectedCoordinates = this.inputCoordinates();

    try {
      const L = await import('leaflet');
      if (this.destroyed) return;

      this.leaflet = L;
      const initialCoordinates = this.selectedCoordinates;
      const initialCenter: [number, number] = initialCoordinates
        ? [initialCoordinates.latitud, initialCoordinates.longitud]
        : DEFAULT_CENTER;

      this.map = L.map(this.mapContainer.nativeElement).setView(
        initialCenter,
        initialCoordinates ? SELECTED_ZOOM : DEFAULT_ZOOM,
      );

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

      this.map.on('click', (event) => {
        if (this.disabled) return;
        this.selectCoordinates(event.latlng.lat, event.latlng.lng, false);
      });

      if (initialCoordinates) this.ensureMarker(initialCoordinates);

      this.map.invalidateSize();
      requestAnimationFrame(() => this.map?.invalidateSize());
      this.observeContainerSize();
    } catch {
      this.showMapLoadError();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.map?.remove();
    this.map = null;
    this.marker = null;
  }

  onPasteInput(event: Event): void {
    this.pasteText = (event.target as HTMLInputElement).value;
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text');
    if (text === undefined) return;

    event.preventDefault();
    this.pasteText = text;
    this.applyPastedCoordinates();
  }

  onPasteEnter(event: Event): void {
    event.preventDefault();
    this.applyPastedCoordinates();
  }

  applyPastedCoordinates(): void {
    if (this.disabled) return;
    const coordinates = parseCoordinates(this.pasteText);

    if (!coordinates) {
      this.statusMessage = 'No se reconocieron coordenadas en el texto.';
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.selectCoordinates(coordinates.latitud, coordinates.longitud, true);
    this.pasteText = '';
    this.statusMessage = 'Coordenadas aplicadas.';
    this.changeDetectorRef.markForCheck();
  }

  useCurrentLocation(): void {
    if (this.disabled) return;
    if (!navigator.geolocation) {
      this.statusMessage = 'El GPS no está disponible en este dispositivo.';
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.statusMessage = 'Obteniendo ubicación...';
    this.changeDetectorRef.markForCheck();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.selectCoordinates(position.coords.latitude, position.coords.longitude, true);
        this.statusMessage = `Ubicación obtenida (precisión ±${Math.round(position.coords.accuracy)} m).`;
        this.changeDetectorRef.markForCheck();
      },
      () => {
        this.statusMessage = 'No fue posible acceder a tu ubicación.';
        this.changeDetectorRef.markForCheck();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  openGoogleMaps(): void {
    if (this.disabled || !this.selectedCoordinates) return;
    const { latitud, longitud } = this.selectedCoordinates;
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank', 'noopener');
  }

  private inputCoordinates(): Coordinates | null {
    return this.validCoordinates(this.latitud, this.longitud);
  }

  private validCoordinates(latitud: number | null, longitud: number | null): Coordinates | null {
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

  private selectCoordinates(latitud: number, longitud: number, zoom: boolean): void {
    const coordinates = this.validCoordinates(latitud, longitud);
    if (!coordinates) return;

    this.selectedCoordinates = coordinates;
    this.ensureMarker(coordinates);
    if (zoom) this.map?.setView([coordinates.latitud, coordinates.longitud], SELECTED_ZOOM);
    this.coordenadasChange.emit(coordinates);
    this.changeDetectorRef.markForCheck();
  }

  private syncMarkerWithInputs(coordinates: Coordinates): void {
    if (!this.map || !this.leaflet) return;

    if (!this.marker) {
      this.ensureMarker(coordinates);
      this.map.panTo([coordinates.latitud, coordinates.longitud]);
      return;
    }

    const current = this.marker.getLatLng();
    if (
      Math.abs(current.lat - coordinates.latitud) > 1e-7
      || Math.abs(current.lng - coordinates.longitud) > 1e-7
    ) {
      this.marker.setLatLng([coordinates.latitud, coordinates.longitud]);
      this.map.panTo([coordinates.latitud, coordinates.longitud]);
    }
  }

  private ensureMarker(coordinates: Coordinates): void {
    if (!this.map || !this.leaflet) return;

    if (this.marker) {
      this.marker.setLatLng([coordinates.latitud, coordinates.longitud]);
      return;
    }

    const pinIcon = this.leaflet.divIcon({
      className: 'sd-map-pin',
      html: `
        <svg viewBox="0 0 24 32" width="34" height="44" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0Z" />
          <circle cx="12" cy="12" r="4.5" fill="white" />
        </svg>`,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
    });

    this.marker = this.leaflet.marker([coordinates.latitud, coordinates.longitud], {
      icon: pinIcon,
      draggable: !this.disabled,
    }).addTo(this.map);
    this.marker.on('dragend', (event: LeafletEvent) => {
      const marker = event.target as Marker;
      const position = marker.getLatLng();
      this.selectCoordinates(position.lat, position.lng, false);
    });
  }

  private removeMarker(): void {
    if (!this.map || !this.marker) return;
    this.map.removeLayer(this.marker);
    this.marker = null;
  }

  private updateMarkerDragging(): void {
    if (!this.marker?.dragging) return;
    if (this.disabled) this.marker.dragging.disable();
    else this.marker.dragging.enable();
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
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }
}
