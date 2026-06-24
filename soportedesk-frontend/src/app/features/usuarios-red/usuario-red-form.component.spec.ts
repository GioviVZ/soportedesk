import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsuarioRedFormComponent } from './usuario-red-form.component';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().substring(0, 10);
}

describe('UsuarioRedFormComponent', () => {
  let component: UsuarioRedFormComponent;
  let fixture: ComponentFixture<UsuarioRedFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioRedFormComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioRedFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('updates the estado control and toggles the inactive class when clicking the Inactivo pill', () => {
    component.form.patchValue({ estado: 'Activo' });
    fixture.detectChanges();

    const badges = Array.from(
      fixture.nativeElement.querySelectorAll('.estado-selector .status-badge'),
    ) as HTMLElement[];
    const inactivoBadge = badges.find((el) => el.textContent?.trim() === 'Inactivo')!;
    inactivoBadge.click();
    fixture.detectChanges();

    expect(component.form.value.estado).toBe('Inactivo');

    const activoBadge = Array.from(
      fixture.nativeElement.querySelectorAll('.estado-selector .status-badge'),
    ).find((el) => (el as HTMLElement).textContent?.trim() === 'Activo') as HTMLElement;
    expect(activoBadge.classList).toContain('inactive');
  });

  it('shows the vencimiento badge when fechaFinContrato is within 30 days', () => {
    component.form.patchValue({ fechaFinContrato: isoDateOffset(10) });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Por vencer');
  });

  it('shows no vencimiento badge when fechaFinContrato is empty', () => {
    component.form.patchValue({ fechaFinContrato: '' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Por vencer');
    expect(fixture.nativeElement.textContent).not.toContain('Vencido');
  });
});
