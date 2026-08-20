import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { EquipoDetalle, EquipoDetalleResponse, EquipoEnrichmentDto } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentModalComponent } from './equipo-enrichment-modal.component';

describe('EquipoEnrichmentModalComponent', () => {
  let component: EquipoEnrichmentModalComponent;
  let service: jasmine.SpyObj<EquipoService>;
  let catalogos: jasmine.SpyObj<CatalogoService>;

  const detail = {
    computerID: 1,
    nombreEquipo: 'PC-001',
    usuarioContacto: 'jperez',
    tipoEquipo: 'Laptop',
    fabricanteEquipo: 'Dell',
    modeloEquipo: 'Latitude 5450',
    numeroserie: 'SERIE-001',
    codigoInterno: 'INT-001',
    ipEquipo: '172.16.0.10',
    sedeNombre: 'SEDE CENTRAL',
    oficinaId: 'Dirección de Tecnología',
    unidadId: 'Oficina de Soporte',
    usuarioTelefono: 'Juan Pérez',
  } as EquipoDetalle;

  const response = {
    equipo: detail,
    software: [],
    teclado: null,
    oficina: null,
    tipoEfectivo: 'Laptop',
  } as EquipoDetalleResponse;

  beforeEach(() => {
    service = jasmine.createSpyObj<EquipoService>('EquipoService', [
      'getEnrichment',
      'getDetalle',
      'saveEnrichment',
    ]);
    catalogos = jasmine.createSpyObj<CatalogoService>('CatalogoService', ['getTiposEquipo']);
    service.getEnrichment.and.returnValue(of(null));
    service.getDetalle.and.returnValue(of(response));
    catalogos.getTiposEquipo.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        { provide: EquipoService, useValue: service },
        { provide: CatalogoService, useValue: catalogos },
      ],
    });

    component = TestBed.runInInjectionContext(() => new EquipoEnrichmentModalComponent());
    component.open = true;
    component.computerId = 1;
    component.nombreEquipo = 'PC-001';
    component.ngOnChanges({ open: new SimpleChange(false, true, true) });
  });

  it('carga los datos principales con marca y modelo en modo de solo lectura', () => {
    expect(component.detail()).toBe(detail);
    expect(component.detail()?.fabricanteEquipo).toBe('Dell');
    expect(component.detail()?.modeloEquipo).toBe('Latitude 5450');
    expect(component.effectiveType()).toBe('Laptop');
    expect(component.editingBrandModel()).toBeFalse();
  });

  it('habilita la corrección opcional y propone los valores actuales', () => {
    component.onBrandModelEditingChange(true);

    expect(component.editingBrandModel()).toBeTrue();
    expect(component.form.fabricanteOverride).toBe('Dell');
    expect(component.form.modeloOverride).toBe('Latitude 5450');
  });

  it('mantiene separados los códigos interno y patrimonial ingresados manualmente', () => {
    component.update('codigoInternoOverride', 'INT-2026-001');
    component.update('codigoPatrimonial', 'PAT-2026-001');

    expect(component.form.codigoInternoOverride).toBe('INT-2026-001');
    expect(component.form.codigoPatrimonial).toBe('PAT-2026-001');
  });

  it('descarta una corrección sin guardar al desmarcar el check', () => {
    component.onBrandModelEditingChange(true);
    component.update('fabricanteOverride', 'HP');
    component.update('modeloOverride', 'EliteBook 840');

    component.onBrandModelEditingChange(false);

    expect(component.editingBrandModel()).toBeFalse();
    expect(component.form.fabricanteOverride).toBeNull();
    expect(component.form.modeloOverride).toBeNull();
  });

  it('restaura una corrección previamente guardada al desmarcar el check', () => {
    const enrichment = {
      fabricanteOverride: 'Lenovo',
      modeloOverride: 'ThinkPad T14',
    } as EquipoEnrichmentDto;
    service.getEnrichment.and.returnValue(of(enrichment));

    component.ngOnChanges({ computerId: new SimpleChange(null, 1, false) });
    component.onBrandModelEditingChange(true);
    component.update('fabricanteOverride', 'HP');
    component.onBrandModelEditingChange(false);

    expect(component.form.fabricanteOverride).toBe('Lenovo');
    expect(component.form.modeloOverride).toBe('ThinkPad T14');
  });
});
