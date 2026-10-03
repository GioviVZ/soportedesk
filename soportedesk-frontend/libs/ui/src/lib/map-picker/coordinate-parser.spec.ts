import { parseCoordinates } from './coordinate-parser';

describe('parseCoordinates', () => {
  it('lee coordenadas desde el segmento @ de Google Maps', () => {
    expect(parseCoordinates('https://www.google.com/maps/@-12.08201234,-76.94304567,18z')).toEqual({
      latitud: -12.082012,
      longitud: -76.943046,
    });
  });

  it('lee coordenadas desde los segmentos !3d y !4d', () => {
    expect(parseCoordinates('https://www.google.com/maps/place/INIA/data=!3m1!4b1!3d-12.0819!4d-76.9428!8m2')).toEqual({
      latitud: -12.0819,
      longitud: -76.9428,
    });
  });

  it('lee el parámetro q', () => {
    expect(parseCoordinates('https://www.google.com/maps?q=-12.0820%2C-76.9430')).toEqual({
      latitud: -12.082,
      longitud: -76.943,
    });
  });

  it('lee el parámetro query', () => {
    expect(parseCoordinates('https://www.google.com/maps/search/?api=1&query=-12.0821,-76.9431')).toEqual({
      latitud: -12.0821,
      longitud: -76.9431,
    });
  });

  it('lee el parámetro ll', () => {
    expect(parseCoordinates('https://maps.google.com/maps?ll=-12.0822,-76.9432')).toEqual({
      latitud: -12.0822,
      longitud: -76.9432,
    });
  });

  it('lee el parámetro destination decodificado', () => {
    expect(parseCoordinates('https://www.google.com/maps/dir/?api=1&destination=-12.0823%2C%20-76.9433')).toEqual({
      latitud: -12.0823,
      longitud: -76.9433,
    });
  });

  it('lee un par simple separado por coma y entre paréntesis', () => {
    expect(parseCoordinates('(-12.082000, -76.943000)')).toEqual({ latitud: -12.082, longitud: -76.943 });
  });

  it('lee pares separados por espacio o punto y coma', () => {
    expect(parseCoordinates('-12.0820 -76.9430')).toEqual({ latitud: -12.082, longitud: -76.943 });
    expect(parseCoordinates('-12.0820; -76.9430')).toEqual({ latitud: -12.082, longitud: -76.943 });
  });

  it('rechaza coordenadas fuera de rango', () => {
    expect(parseCoordinates('-91, -76')).toBeNull();
    expect(parseCoordinates('-12, 181')).toBeNull();
  });

  it('rechaza texto sin coordenadas', () => {
    expect(parseCoordinates('ubicación de la sede central')).toBeNull();
  });

  it('rechaza enlaces cortos que requieren resolución de red', () => {
    expect(parseCoordinates('https://maps.app.goo.gl/AbCdEf123')).toBeNull();
  });
});
