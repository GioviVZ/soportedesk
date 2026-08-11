---
name: Sistema Gestión de Soporte Informático INIA
description: Panel operativo interno para equipos, redes, licencias, cuentas y soporte TI
creativeDirection: "Social Utility · Liquid Glass"
colors:
  azul-marino: "#0b2f6b"
  azul-marino-profundo: "#061a3a"
  azul-accion: "#1554ad"
  negro-azulado: "#02050b"
  blanco: "#ffffff"
  fondo-claro: "#edf2f8"
typography:
  family: "Manrope Variable, Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  display: "790 / clamp(30px, 3vw, 46px)"
  headline: "780 / clamp(22px, 2vw, 30px)"
  title: "750 / 16px"
  body: "500 / 14px"
  label: "750 / 10.5px / 0.065em"
---

# Design System: Social Utility · Liquid Glass

## Dirección

SoporteDesk adopta la claridad y familiaridad de una aplicación social moderna:
navegación inmediata, iconos reconocibles, avatares circulares, jerarquía fuerte,
tarjetas redondeadas y acciones fáciles de encontrar. No copia la identidad de
Instagram; toma su sensación de producto directo, rápido y humano y la adapta a
una herramienta institucional de TI.

El acabado “liquid glass” se limita a navegación, tarjetas, menús y overlays. Los
colores de identidad y los botones permanecen sólidos. Esto evita que el vidrio
reduzca contraste o convierta el producto en una colección de degradados.

## Paleta

- Azul marino `#0b2f6b`: navegación activa, botones primarios y encabezados de tabla.
- Azul profundo `#061a3a`: panel de marca y fondos de alto contraste.
- Azul de acción `#1554ad`: enlaces, foco e información interactiva.
- Negro azulado `#02050b`: fondo principal del modo oscuro.
- Blanco `#ffffff`: texto sobre azul y superficies del modo claro.
- Fondo claro `#edf2f8`: lienzo frío que contrasta con blanco y azul oscuro.
- Colores semánticos verde, ámbar y rojo: únicamente para éxito, advertencia y peligro.

Todos los módulos utilizan variaciones de azul. Ningún módulo introduce una nueva
familia cromática como identidad principal.

## Regla de color sólido

No usar gradientes decorativos en fondos, botones, tarjetas ni navegación. El
azul y el negro son superficies sólidas. La profundidad se obtiene con opacidad,
desenfoque, borde luminoso e iluminación interior del vidrio.

## Liquid glass

Una superficie de vidrio combina:

- fondo blanco/negro translúcido entre 70% y 90%;
- `backdrop-filter: blur(20px) saturate(145%)`;
- borde claro muy fino;
- highlight interior de 1px;
- sombra ambiental oscura, amplia y difusa.

No aplicar vidrio a celdas individuales ni a todos los controles. Inputs y tablas
mantienen superficies simples para conservar legibilidad y rendimiento.

## Tipografía

Manrope Variable se sirve localmente. Se usa una única familia en todo el sistema.

- Display: peso 790, tracking negativo, cifras KPI.
- Headline: peso 780, títulos de página.
- Title: peso 750, encabezados de tarjetas y navegación.
- Body: peso 500–620 según relevancia.
- Label: peso 750–800, mayúsculas y tracking amplio.
- Datos técnicos pueden conservar una fuente monoespaciada.

## Iconografía

Tabler Icons es la fuente canónica. Los iconos usan trazo uniforme, tamaño óptico
de 18–22px y siempre incluyen etiqueta accesible cuando funcionan como acción.
Evitar símbolos Unicode y mezclar familias de iconos dentro de un mismo bloque.

## Componentes

### Navegación

- Sidebar de vidrio con iconos dentro de cuadrados suaves.
- Opción activa en azul marino sólido con texto blanco.
- Header flotante de vidrio con acceso directo al modo claro/oscuro.
- Avatar circular con aro azul, siguiendo el lenguaje de producto social.

### Botones

- Primario: azul marino sólido y texto blanco.
- Secundario: negro azulado o azul grisáceo sólido y texto blanco.
- Peligro: rojo sólido únicamente para acciones destructivas.
- Radios entre 10 y 13px, altura táctil mínima de 44px.

### Tarjetas

- Radio de 18–24px.
- Fondo de vidrio con borde luminoso sutil.
- Acento de módulo como barra superior sólida de 4px.
- Hover: elevación corta, nunca cambio drástico de color.

### Tablas y formularios

- Encabezados de tabla azul marino sólido con texto blanco.
- Filas claras o negras, sin degradados.
- Inputs blancos en modo claro y negro azulado en oscuro.
- Foco azul visible de 3–4px.

## Modos

### Claro

Fondo azul grisáceo frío, superficies blancas translúcidas, texto casi negro y
acciones azul marino. El contraste principal es azul oscuro contra blanco.

### Oscuro

Fondo negro azulado, superficies negras translúcidas, texto blanco y acentos
azules fríos. Nunca invertir automáticamente colores semánticos sin revisar
contraste.

## Accesibilidad y movimiento

- Texto de cuerpo con contraste mínimo 4.5:1.
- Foco visible en toda acción.
- Objetivos táctiles de al menos 44px.
- Respetar `prefers-reduced-motion`.
- Blur y transparencia deben tener siempre un color de respaldo.

## No hacer

- No usar gradientes decorativos.
- No introducir verdes, púrpuras o naranjas como identidad de módulo.
- No poner texto tenue encima de vidrio sin contraste suficiente.
- No usar glass en cada elemento de una tabla.
- No mezclar SVG heredados, emojis y Tabler dentro de la misma navegación.
- No usar animaciones largas o elásticas en tareas operativas.
