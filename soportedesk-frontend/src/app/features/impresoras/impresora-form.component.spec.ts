import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImpresoraFormComponent } from './impresora-form.component';

describe('ImpresoraFormComponent', () => {
  let component: ImpresoraFormComponent;
  let fixture: ComponentFixture<ImpresoraFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresoraFormComponent, HttpClientTestingModule],
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
});
