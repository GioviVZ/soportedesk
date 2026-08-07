# Product

## Register

product

## Platform

web

## Users

Personal de mesa de soporte y TI del INIA (Instituto Nacional de Investigación
Agropecuaria), usando el sistema desde una oficina durante su jornada laboral
para gestionar equipos, impresoras, usuarios de red, correos, licencias, VPN y
WiFi del instituto. El sistema diferencia dos roles con la misma base de
usuarios: **ADMIN** (acceso total, incluye catálogos y usuarios del sistema) y
**SOPORTE** (lectura por defecto, escritura solo en los módulos donde tiene
permiso explícito). No son los usuarios finales de la red institucional
(esos son registros gestionados por el sistema, no quienes lo operan).

## Product Purpose

Reemplazar planillas dispersas y procesos manuales por un panel único que
centraliza el estado de todos los activos y servicios de soporte técnico de
INIA. El éxito se mide en tres frentes: menos tiempo perdido buscando
información (todo centralizado y buscable en vez de repartido en Excel/papel),
trazabilidad y auditoría real (bitácora de quién hizo qué cambio y cuándo, con
permisos por módulo), y menos errores operativos (vencimientos de VPN,
licencias o contratos que hoy pasan desapercibidos, equipos mal asignados).

## Positioning

Unifica todos los módulos de soporte técnico institucional —equipos,
impresoras, correos, usuarios de red, VPN, WiFi, licencias y auditoría— bajo
un mismo shell, un mismo control de acceso por rol/permiso y una misma lente
organizacional (sede → dependencia → subdependencia), algo que ni una
planilla ni un inventario TI genérico ofrecen.

## Brand Personality

Moderno, ágil y accesible, con un acabado elegante y de colores sobrios antes
que llamativo: es una herramienta de trabajo institucional, no un producto de
consumo. Debe sostener modo claro y modo oscuro como ciudadanos de primera
clase (ya implementados), con paneles de control ricos en gráficas y
desgloses detallados por módulo. La lectura de datos prioriza la dimensión
geográfica/organizacional: qué tiene y cómo está cada oficina (sede/
dependencia), no solo totales globales.

## Anti-references

No se mencionaron anti-referencias concretas en esta ronda. Guía general
por defecto: evitar el look genérico de dashboard SaaS intercambiable sin
identidad propia; mantener la identidad verde/amarillo de INIA ya establecida
en `_variables.scss` en vez de reemplazarla por una paleta genérica.

## Design Principles

- **Centralizar sobre fragmentar**: cada módulo vive bajo el mismo shell,
  navegación y control de acceso — nunca una isla visual aparte.
- **La ubicación institucional es la lente principal**: sede → dependencia →
  subdependencia organiza la lectura de los datos antes que cualquier otro
  filtro.
- **Trazabilidad visible, no oculta**: toda acción relevante queda en
  auditoría y debe poder consultarse sin fricción desde la interfaz.
- **Sobriedad institucional sobre efecto vistoso**: elegante y confiable
  antes que llamativo; el color comunica estado y módulo, no decora.
- **Los permisos se reflejan en la UI**: lo que un rol no puede editar no
  debe sentirse como una promesa rota (debe leerse como solo-lectura, no
  como un botón roto u oculto sin explicación).

## Accessibility & Inclusion

Buenas prácticas estándar sin un nivel WCAG certificado exigido: contraste
correcto (texto de cuerpo ≥4.5:1), soporte completo de teclado y foco
visible, y respeto a `prefers-reduced-motion`. El soporte de modo claro/oscuro
ya implementado debe mantenerse y extenderse a cualquier componente nuevo.
