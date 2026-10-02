import { imeiLuhnValid } from './moviles-shared';

describe('imeiLuhnValid', () => {
  it('acepta un IMEI válido', () => {
    expect(imeiLuhnValid('490154203237518')).toBeTrue();
  });

  it('rechaza un IMEI con dígito de control inválido', () => {
    expect(imeiLuhnValid('490154203237519')).toBeFalse();
  });
});
