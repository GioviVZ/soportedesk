import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ImpresoraFormComponent } from './impresora-form.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('ImpresoraFormComponent', () => {
  let component: ImpresoraFormComponent;
  let fixture: ComponentFixture<ImpresoraFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ImpresoraFormComponent],
    providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

    fixture = TestBed.createComponent(ImpresoraFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/marcas-impresora')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requires an explicit connection selection', () => {
    component.form.patchValue({ modeloImpresoraId: 1 });
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[formControlName="tipoConexion"]');
    const saveButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(select.value).toBe('');
    expect(select.required).toBeTrue();
    expect(saveButton.disabled).toBeTrue();

    component.form.patchValue({ tipoConexion: 'Sin conexión' });
    fixture.detectChanges();

    expect(component.form.valid).toBeTrue();
    expect(saveButton.disabled).toBeFalse();
    expect(Array.from(select.options).map((option) => option.text)).toContain('Sin conexión');
  });

  it('allows selecting Inoperativo as the printer state', () => {
    const badge = Array.from(fixture.nativeElement.querySelectorAll('app-status-badge'))
      .find((element) => (element as HTMLElement).textContent?.trim() === 'Inoperativo') as HTMLElement | undefined;

    expect(badge).toBeDefined();
    badge!.querySelector('.status-badge')!.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(component.form.value.estado).toBe('Inoperativo');
  });

  it('hides the ip field when tipoConexion is USB', () => {
    component.form.patchValue({ tipoConexion: 'USB' });
    fixture.detectChanges();

    const ipInput = fixture.nativeElement.querySelector('input[formControlName="ip"]');
    expect(ipInput).toBeNull();
  });

  it('shows the ip field when tipoConexion is IP', () => {
    component.form.patchValue({ tipoConexion: 'IP' });
    fixture.detectChanges();

    const ipInput = fixture.nativeElement.querySelector('input[formControlName="ip"]');
    expect(ipInput).not.toBeNull();
  });

  it('shows referencia as a visible textarea', () => {
    const referencia = fixture.nativeElement.querySelector('textarea[formControlName="referencia"]');

    expect(referencia).not.toBeNull();
    expect(referencia.getAttribute('placeholder')).toContain('Ubicación exacta');
  });

  it('clears ip when switching tipoConexion back to USB', () => {
    component.form.patchValue({ tipoConexion: 'IP', ip: '10.0.0.5' });

    component.form.patchValue({ tipoConexion: 'USB' });

    expect(component.form.getRawValue().ip).toBe('');
  });

  it('clears ip when switching tipoConexion to Sin conexión', () => {
    component.form.patchValue({ tipoConexion: 'IP', ip: '10.0.0.5' });

    component.form.patchValue({ tipoConexion: 'Sin conexión' });

    expect(component.form.getRawValue().ip).toBe('');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[formControlName="ip"]')).toBeNull();
  });
});
