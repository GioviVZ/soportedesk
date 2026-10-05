import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapPreviewComponent } from './map-preview.component';

describe('MapPreviewComponent', () => {
  let fixture: ComponentFixture<MapPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MapPreviewComponent] }).compileComponents();
    fixture = TestBed.createComponent(MapPreviewComponent);
  });

  it('muestra el estado vacío sin crear un contenedor Leaflet cuando no hay coordenadas', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin ubicación registrada');
    expect(fixture.nativeElement.querySelector('.leaflet-container')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-map-preview__map')).toBeNull();
  });

  it('formatea las coordenadas y construye el enlace de Google Maps', () => {
    fixture.componentRef.setInput('latitud', -12.0817);
    fixture.componentRef.setInput('longitud', -76.9431);
    fixture.detectChanges();

    const coordinates: HTMLElement = fixture.nativeElement.querySelector('.sd-map-preview__coordinates code');
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.sd-map-preview__external-link');

    expect(coordinates.textContent?.trim()).toBe('-12.081700, -76.943100');
    expect(link.getAttribute('href')).toBe('https://www.google.com/maps?q=-12.0817,-76.9431');
  });
});
