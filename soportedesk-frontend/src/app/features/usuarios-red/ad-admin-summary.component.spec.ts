import { AdAdminSummaryComponent } from './ad-admin-summary.component';

describe('AdAdminSummaryComponent', () => {
  it('calcula el total como habilitados + deshabilitados', () => {
    const component = new AdAdminSummaryComponent();
    component.dashboard = {
      usuariosHabilitados: 110,
      usuariosBloqueados: 3,
      usuariosDeshabilitados: 15,
      controladoresDominio: 2,
    };
    expect(component.total()).toBe(125);
  });

  it('retorna 0 de total cuando no hay dashboard', () => {
    const component = new AdAdminSummaryComponent();
    component.dashboard = null;
    expect(component.total()).toBe(0);
  });
});
