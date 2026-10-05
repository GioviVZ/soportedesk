import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapPickerComponent } from './map-picker.component';

describe('MapPickerComponent', () => {
  let fixture: ComponentFixture<MapPickerComponent>;
  let component: MapPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MapPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(MapPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('emite las coordenadas pegadas redondeadas a seis decimales', () => {
    const emitted: { latitud: number; longitud: number }[] = [];
    component.coordenadasChange.subscribe((coordinates) => emitted.push(coordinates));
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.sd-map-picker__paste-input');
    input.value = '-12.08201234, -76.94304567';
    input.dispatchEvent(new Event('input'));

    const applyButton: HTMLButtonElement = fixture.nativeElement.querySelector('.sd-map-picker__apply');
    applyButton.click();

    expect(emitted).toEqual([{ latitud: -12.082012, longitud: -76.943046 }]);
  });

  it('deshabilita Google Maps cuando no hay coordenadas', () => {
    const googleMapsButton: HTMLButtonElement = fixture.nativeElement.querySelector('.sd-map-picker__google-maps');
    expect(googleMapsButton.disabled).toBeTrue();
  });

  it('no renderiza la línea de estado cuando no hay un mensaje', () => {
    const statusRegion: HTMLElement = fixture.nativeElement.querySelector('.sd-map-picker__status-region');
    const statusLine: HTMLElement | null = fixture.nativeElement.querySelector('.sd-map-picker__status');

    expect(statusRegion).not.toBeNull();
    expect(statusRegion.textContent?.trim()).toBe('');
    expect(statusLine).toBeNull();
  });

  it('limpia el estado al seleccionar coordenadas desde el mapa', () => {
    component.statusMessage = 'Coordenadas aplicadas.';

    component['selectCoordinates'](-12.082, -76.943, false);
    fixture.detectChanges();

    expect(component.statusMessage).toBe('');
    expect(fixture.nativeElement.querySelector('.sd-map-picker__status')).toBeNull();
  });
});
