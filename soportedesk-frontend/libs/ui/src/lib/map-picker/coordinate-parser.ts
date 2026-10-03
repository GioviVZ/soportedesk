export interface Coordinates {
  latitud: number;
  longitud: number;
}

const NUMBER_PATTERN = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
const PAIR_PATTERN = new RegExp(`(${NUMBER_PATTERN})\\s*[,;\\s]\\s*(${NUMBER_PATTERN})`);
const PLAIN_PAIR_PATTERN = new RegExp(
  `^\\s*\\(?\\s*(${NUMBER_PATTERN})\\s*(?:,|;|\\s)\\s*(${NUMBER_PATTERN})\\s*\\)?\\s*$`,
);

function roundedCoordinates(latitudText: string, longitudText: string): Coordinates | null {
  const latitud = Number(latitudText);
  const longitud = Number(longitudText);

  if (
    !Number.isFinite(latitud)
    || !Number.isFinite(longitud)
    || latitud < -90
    || latitud > 90
    || longitud < -180
    || longitud > 180
  ) {
    return null;
  }

  return {
    latitud: Number(latitud.toFixed(6)),
    longitud: Number(longitud.toFixed(6)),
  };
}

function coordinatesFromMatch(match: RegExpMatchArray | null): Coordinates | null {
  return match ? roundedCoordinates(match[1], match[2]) : null;
}

function isGoogleMapsUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  return (
    (hostname === 'google.com' || hostname.endsWith('.google.com') || /(^|\.)google\.[a-z.]+$/.test(hostname))
    && (hostname.startsWith('maps.') || url.pathname.toLowerCase().includes('/maps'))
  );
}

export function parseCoordinates(text: string): Coordinates | null {
  const value = text.trim();
  if (!value || /https?:\/\/maps\.app\.goo\.gl(?:\/|$)/i.test(value)) return null;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep the original text when it contains a malformed escape sequence.
  }

  let url: URL | null = null;
  try {
    url = new URL(value);
  } catch {
    // Plain coordinate pairs are handled below.
  }

  if (url && isGoogleMapsUrl(url)) {
    const atCoordinates = coordinatesFromMatch(
      decoded.match(new RegExp(`@(${NUMBER_PATTERN}),(${NUMBER_PATTERN})(?:[,/?]|$)`)),
    );
    if (atCoordinates) return atCoordinates;

    const dataCoordinates = coordinatesFromMatch(
      decoded.match(new RegExp(`!3d(${NUMBER_PATTERN})!4d(${NUMBER_PATTERN})(?:[!/?&]|$)`)),
    );
    if (dataCoordinates) return dataCoordinates;

    for (const parameter of ['q', 'query', 'll', 'destination']) {
      const parameterValue = url.searchParams.get(parameter);
      if (!parameterValue) continue;
      const queryCoordinates = coordinatesFromMatch(parameterValue.match(PAIR_PATTERN));
      if (queryCoordinates) return queryCoordinates;
    }
  }

  return coordinatesFromMatch(decoded.match(PLAIN_PAIR_PATTERN));
}
