# Modularización física del backend (Maven multi-módulo) — bitácora

**Motivo:** requerimiento de calidad basado en ISO/IEC 25010 — característica
"Modularidad" (sub-característica de Mantenibilidad): bajo acoplamiento entre
módulos, alta cohesión dentro de cada uno, interfaces bien definidas, impacto
mínimo de un cambio en un módulo sobre los demás. El sistema previo era un
único módulo Maven (`packaging=jar`) organizado por paquete, sin ningún
límite físico entre dominios.

**Alcance de la decisión (confirmado con el usuario antes de empezar):**
separación física real (reactor Maven multi-módulo), no solo límites lógicos
dentro de un único módulo; arreglar el acceso directo a GLPI encontrado en la
auditoría ahora, no después; agregar ArchUnit como guardia de regresión;
hacer todo el backend primero, recién después el frontend (ver el archivo
`-frontend` hermano de este).

Este documento resume el trabajo; el resultado técnico final vive en
`docs/ARQUITECTURA.md` §3.1 (siempre actualizado) — este archivo es la
bitácora de decisiones y fases, no la referencia técnica vigente.

## Auditoría previa (antes de tocar código)

Se revisó import por import los 20 paquetes de dominio del backend. Hallazgos:

- **3 ciclos bidireccionales duros**: `equipos ↔ glpi`, `auth ↔ security`,
  `activedirectory ↔ usuariosred`.
- **Sin relaciones JPA cruzando datasources**: se confirmó que ningún
  `@ManyToOne` cruza entre el datasource GLPI (MySQL, secundario) y el
  datasource principal (SQL Server) — el acoplamiento `equipos↔glpi` es solo
  a nivel de servicio/repositorio, no de Hibernate. Esto eliminó el
  bloqueador técnico más duro que se temía antes de empezar.
- **Acoplamiento oculto**: `glpi.VwInvComputerFullRepository` (vista de solo
  lectura de GLPI) era importado directo por 4 módulos no relacionados
  (`equipos`, `usuariosred`, `vpn`, `herramientas`), saltándose el dominio
  dueño de esos datos (`equipos`).

## Orden de extracción (topológico, sin ciclos entre módulos)

```
Tier 0: common (kernel: common+exception), gestiontiinia, realtime
Tier 1: catalogo, auditoria, wifi
Tier 2: identity (auth+security), equipos (equipos+glpi), impresoras, licencias, correos
Tier 3: red-directorio (activedirectory+usuariosred), herramientas
Tier 4: vpn
Tier 5: dashboard
Tier 6: soportedesk-app (composition root)
```

## Fases y resultado de verificación

Cada fase se implementó vía Codex (`npx @openai/codex exec --sandbox
workspace-write`), con instrucciones precisas diseñadas de antemano y
verificación independiente posterior (nunca se confió en el auto-reporte de
Codex). Toda fase cerró con `mvn test` completo desde la raíz del reactor
(no solo el módulo tocado) y, en las fases que tocan datasource/entity-scan,
un arranque real (`spring-boot:run`) contra datos reales.

- **B0 — Línea base.** `mvn test` (~315 verdes), `mvn dependency:tree`, smoke
  de arranque real con ambos datasources. Sin cambios de código.
- **B1 — Esqueleto multi-módulo.** `soportedesk-backend/pom.xml` pasa a POM
  padre (`packaging=pom`); único módulo hijo `soportedesk-app` con el 100%
  del código sin tocar. `spring-boot-maven-plugin` se mueve a `soportedesk-app`.
  Verificado: mismos ~315 tests, mismo arranque.
- **B2 — Tier 0**: extraídos `soportedesk-common`, `soportedesk-gestiontiinia`,
  `soportedesk-realtime`. Cero cambios de import (los paquetes Java no cambian).
- **B3 — Tier 1**: extraídos `soportedesk-catalogo`, `soportedesk-auditoria`,
  `soportedesk-wifi`.
- **B4 — Tier 2 (fase con más cambios estructurales):**
  - Fusión `auth`+`security` → `soportedesk-identity` (el ciclo se vuelve
    intra-módulo, deja de ser un problema para ISO 25010, que mide a nivel de
    componente).
  - Fusión `equipos`+`glpi` → `soportedesk-equipos` (incluye
    `glpi/GlpiDataSourceConfig.java`, autocontenido).
  - Se introdujo `com.inia.soportedesk.equipos.api` (`EquipoConsultaDto` +
    `EquipoConsultaApi`) como único punto de acceso público a datos GLPI, y se
    migraron los 3 consumidores indebidos (`herramientas`, `usuariosred`,
    `vpn`) a esa API.
  - Extraídos también `soportedesk-impresoras`, `soportedesk-licencias`,
    `soportedesk-correos`.
  - Verificado: test suite completo + smoke manual de detalle de equipo
    (toca ambos datasources) + login.
- **B5 — Tier 3**: fusión `activedirectory`+`usuariosred` →
  `soportedesk-red-directorio`; extraído `soportedesk-herramientas`.
- **B6 — Tier 4**: extraído `soportedesk-vpn`. Un task en background de Codex
  reportó exit code 1 por límite de uso de la API de Codex (no un error de
  código — el log mostraba `BUILD SUCCESS` de todos los módulos, incluido
  `soportedesk-vpn`, justo antes del error de límite); se verificó
  independientemente que el trabajo ya estaba completo en disco y se
  continuó sin volver a correr la tarea completa.
- **B7 — Tier 5**: extraído `soportedesk-dashboard` (agregador puro).
- **B8 — `soportedesk-app` reducido a raíz de composición** (solo
  `SoportedeskApplication.java` + `config/PrimaryDataSourceConfig.java`).
  Verificación final completa: `mvn clean test` (sin usar `mvn clean` directo
  por el bug de Windows con `hsperfdata_*` bloqueado — se borró manualmente
  `*/target/{surefire-reports,test-classes,classes}` antes de cada test run
  limpio) + arranque real + smoke manual de todas las pantallas.
- **B9 — ArchUnit.** Se agregó `archunit-junit5:1.5.0` como dependencia de
  test en `soportedesk-app` con 2 reglas:
  1. `top_level_domain_packages_should_be_free_of_cycles` — sin ciclos entre
     **módulos Maven** (no entre paquetes Java crudos: un primer intento
     agrupando por paquete marcaba como "ciclo" relaciones intencionales
     dentro del mismo módulo como `equipos↔glpi`; se corrigió con un
     `SliceAssignment` a medida que mapea paquete→módulo Maven real).
  2. `only_equipos_should_access_glpi` — nada fuera de `equipos`/`glpi` puede
     depender de `com.inia.soportedesk.glpi..` (justo lo que hubiera evitado
     el problema original de `VwInvComputerFullRepository` si hubiera
     existido antes).
  Verificado: 317/317 tests en verde (315 originales + las 2 reglas de
  ArchUnit).

## Resultado final

16 módulos Maven (`common`, `catalogo`, `gestiontiinia`, `realtime`,
`auditoria`, `wifi`, `identity`, `equipos`, `impresoras`, `licencias`,
`correos`, `red-directorio`, `herramientas`, `vpn`, `dashboard`, `app`), cero
ciclos entre módulos, sin acceso indebido a GLPI, ArchUnit como guardia
permanente de regresión. Detalle técnico vigente en `docs/ARQUITECTURA.md`
§3.1 y §4.
