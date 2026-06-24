import { usuarioRedEstadoTone } from './usuario-red.model';

describe('usuarioRedEstadoTone', () => {
  it('returns success for Activo', () => {
    expect(usuarioRedEstadoTone('Activo')).toBe('success');
  });

  it('returns danger for Inactivo', () => {
    expect(usuarioRedEstadoTone('Inactivo')).toBe('danger');
  });

  it('returns neutral for an unknown or missing value', () => {
    expect(usuarioRedEstadoTone('algo-raro')).toBe('neutral');
    expect(usuarioRedEstadoTone(null)).toBe('neutral');
    expect(usuarioRedEstadoTone(undefined)).toBe('neutral');
  });
});
