import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EquipoSaludItem } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquiposMantenimientoComponent } from './equipos-mantenimiento.component';

describe('EquiposMantenimientoComponent', () => {
  let fixture: ComponentFixture<EquiposMantenimientoComponent>;
  let component: EquiposMantenimientoComponent;
  let service: jasmine.SpyObj<EquipoService>;

  const item = (overrides: Partial<EquipoSaludItem>): EquipoSaludItem => ({
    computerID: 1,
    nombreEquipo: 'PC-001',
    sedeNombre: 'SEDE CENTRAL',
    dependenciaNombre: 'Dirección de Tecnología',
    subdependenciaNombre: 'Oficina de Soporte',
    tipoEquipo: 'Laptop',
    fabricanteEquipo: 'Dell',
    modeloEquipo: 'Latitude 5450',
    usuarioContacto: 'usuario',
    fechaCreacion: '2026-08-01T10:00:00',
    sinEncendidoMeses: 1,
    sinActualizacionMeses: 1,
    nivelAlerta: 'OK',
    sinCodigoPatrimonial: true,
    sinUsuario: false,
    sinSede: false,
    sinDependencia: false,
    sinSubdependencia: false,
    sinNumeroSerie: false,
    estadoDepuracion: null,
    ...overrides,
  });

  beforeEach(async () => {
    service = jasmine.createSpyObj<EquipoService>('EquipoService', ['getSalud']);
    service.getSalud.and.returnValue(of([
      item({ computerID: 1, nombreEquipo: 'PC-001' }),
      item({
        computerID: 2,
        nombreEquipo: 'PC-002',
        sedeNombre: 'EEA DONOSO',
        dependenciaNombre: 'Dirección Agraria',
        subdependenciaNombre: 'Oficina de Campo',
      }),
      item({
        computerID: 3,
        nombreEquipo: 'PC-003',
        sedeNombre: null,
        dependenciaNombre: null,
        subdependenciaNombre: null,
      }),
    ]));

    await TestBed.configureTestingModule({
      imports: [EquiposMantenimientoComponent],
      providers: [{ provide: EquipoService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(EquiposMantenimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('combina los filtros de ubicación, dirección y oficina', () => {
    component.onUbicacionChange('SEDE CENTRAL');
    component.onDireccionChange('Dirección de Tecnología');
    component.selectedOficina.set('Oficina de Soporte');

    expect(component.filtered().map((equipo) => equipo.computerID)).toEqual([1]);
    expect(component.activeFilterCount()).toBe(3);
  });

  it('permite encontrar registros sin dirección ni oficina', () => {
    component.selectedDireccion.set(component.missingFilter);
    component.selectedOficina.set(component.missingFilter);

    expect(component.filtered().map((equipo) => equipo.computerID)).toEqual([3]);
  });

  it('ordena la vista por ubicación y deja los valores vacíos al final', () => {
    component.sortBy.set('ubicacion');

    expect(component.filtered().map((equipo) => equipo.computerID)).toEqual([2, 1, 3]);
  });

  it('limpia todos los filtros sin cambiar el criterio de orden', () => {
    component.query.set('PC-001');
    component.onlyRecent.set(true);
    component.selectedUbicacion.set('SEDE CENTRAL');
    component.sortBy.set('oficina');

    component.clearFilters();

    expect(component.hasActiveFilters()).toBeFalse();
    expect(component.filtered()).toHaveSize(3);
    expect(component.sortBy()).toBe('oficina');
  });
});
