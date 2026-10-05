import type { DivIcon } from 'leaflet';

export function createMapPinIcon(L: typeof import('leaflet')): DivIcon {
  return L.divIcon({
    className: 'sd-map-pin',
    html: `
      <svg viewBox="0 0 24 32" width="34" height="44" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0Z" />
        <circle cx="12" cy="12" r="4.5" fill="white" />
      </svg>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
  });
}
