import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericTableComponent } from './generic-table.component';

describe('GenericTableComponent', () => {
  let fixture: ComponentFixture<GenericTableComponent>;
  let component: GenericTableComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericTableComponent],
    });
    fixture = TestBed.createComponent(GenericTableComponent);
    component = fixture.componentInstance;
    component.columns = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'sede.nombre', label: 'Sede' },
    ];
    component.data = [
      { id: 1, nombre: 'Juan Pérez', sede: { nombre: 'Lima' } },
      { id: 2, nombre: 'Ana Gómez', sede: { nombre: 'Cusco' } },
    ];
  });

  it('renders one row per data item with nested column values', () => {
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Juan Pérez');
    expect(rows[0].textContent).toContain('Lima');
    expect(rows[1].textContent).toContain('Ana Gómez');
    expect(rows[1].textContent).toContain('Cusco');
  });

  it('emits delete with the row when the Eliminar button is clicked', () => {
    component.canEdit = true;
    fixture.detectChanges();
    let deleted: unknown;
    component.delete.subscribe((row) => (deleted = row));
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('tbody tr:first-child .actions button');
    const deleteButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Eliminar');
    deleteButton!.click();
    expect(deleted).toEqual(component.data[0]);
  });

  it('shows "Sin registros" when data is empty', () => {
    component.data = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin registros');
  });
});
