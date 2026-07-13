import { esTipoContratoOs } from './usuario-red-contrato.model';

describe('esTipoContratoOs', () => {
  it('returns true for "OS" regardless of case', () => {
    expect(esTipoContratoOs('OS')).toBe(true);
    expect(esTipoContratoOs('os')).toBe(true);
    expect(esTipoContratoOs('Os')).toBe(true);
  });

  it('returns false for other contract types', () => {
    expect(esTipoContratoOs('CAS')).toBe(false);
    expect(esTipoContratoOs('CAP')).toBe(false);
  });

  it('returns false for a missing value', () => {
    expect(esTipoContratoOs(null)).toBe(false);
    expect(esTipoContratoOs(undefined)).toBe(false);
  });
});
