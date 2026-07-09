# Módulo Correos — Rediseño en 2 caras (Consultas / Dashboard)

**Fecha:** 2026-07-09
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Precedente:** [2026-07-08-modulo-active-directory-tres-caras-design.md](2026-07-08-modulo-active-directory-tres-caras-design.md), [2026-07-09-modulo-vpn-tres-caras-design.md](2026-07-09-modulo-vpn-tres-caras-design.md)

---

## 1. Objetivo

Reorganizar la página única actual de Correos (`correos-list.component.ts`, un espejo de solo
lectura de Google Workspace vía la vista `vw_GW_Dashboard`) en **dos caras**, sin cara de
Administración porque el módulo no tiene ninguna operación de escritura (confirmado: el
controller solo expone endpoints `GET`, no hay create/edit/delete en ningún lado del código):

1. **Consultas** — todo lo que existe hoy salvo las tarjetas KPI: filtros (búsqueda, sede,
   dependencia, subdependencia, estado, modalidad, "sin uso +30 días"), tabla/lista de
   resultados, exportar Excel, modal de detalle de solo lectura.
2. **Dashboard** — las 6 tarjetas KPI actuales (Licencias Totales/Activas/Suspendidas/
   Disponibles/Sede Central/EEAs) + gráfico de distribución por dependencia + adopción de
   verificación en 2 pasos + top-10 cuentas sin uso 30+ días, con un endpoint backend nuevo de
   agregación.

Ambas caras usan el mismo permiso plano `READ_correos` que ya existe hoy — no hay un nivel de
permiso más alto que crear artificialmente, así que no se restringe el Dashboard a un
subconjunto de usuarios (a diferencia de AD/VPN, donde Dashboard sí requería el permiso de
escritura del módulo).

## 2. Arquitectura y rutas

```
/correos                                       (layout: CorreosShellComponent)
  ├── /consultas       canActivate: moduloGuard('correos')   [default redirect]
  └── /dashboard       canActivate: moduloGuard('correos')
```

- `CorreosShellComponent`: mismo patrón delgado que `UsuariosRedShellComponent`/
  `VpnShellComponent` — `module-header` + barra de 2 pestañas + `<router-outlet>`. Sin lógica
  condicional de permisos en las pestañas (ambas usan el mismo guard).
- El ítem del sidebar sigue siendo uno solo ("Correos"), apunta a `/correos` y redirige a
  `consultas`.
- `correo.service.ts` y `correo.model.ts` (ya existentes) se extienden con el nuevo método/tipo
  del punto 3; no se toca ningún endpoint existente.
- No se crea ningún guard nuevo (a diferencia de VPN) — `moduloGuard('correos')` alcanza para
  ambas caras.

## 3. Backend — nuevo endpoint

Dentro de `com.inia.soportedesk.correos` (paquete ya existente).

```
GET /api/correos/dashboard/completo
```
- `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")` (mismo nivel que el resto
  del módulo, no más restrictivo).
- Reutiliza `VwGwDashboardRepository.findAll()` (ya usado hoy en `getKpis()`), agrega en
  memoria (lógica pura, testeable):
  - Los 6 conteos ya existentes en `CorreoKpisDto` (se incluyen tal cual para evitar una
    segunda llamada desde el frontend).
  - **Distribución por dependencia**: agrupa por `oficinaPadre` (fallback `"Sin dependencia"`),
    cuenta todas las cuentas (no solo activas, ya que el interés es volumen por dependencia).
  - **Adopción de 2FA**: cuenta cuántas cuentas tienen `verificacion2Pasos == "Enrolado"` vs
    total, expresado como conteo + porcentaje.
  - **Top 10 sin uso**: cuentas con `ultimoInicioSesion` nulo o anterior a hoy-30 días
    (reutiliza el mismo umbral que ya usa el filtro `sinUso30Dias` existente en
    `CorreoService.findAll`/`VwGwDashboardRepository.findFiltered`), ordenadas por
    `ultimoInicioSesion` ascendente (las más antiguas primero; las nulas van primero).
- DTOs (en el paquete `correos`, sin subpaquete `dto`, igual que `CorreoKpisDto` ya existente):
  ```java
  public record CorreoDependenciaCount(String dependencia, long total) {}
  public record CorreoInactividadAlerta(String email, String nombreCompleto, String detalle) {}
  public record CorreoDashboardCompleto(
      CorreoKpisDto kpis,
      List<CorreoDependenciaCount> distribucionPorDependencia,
      long cuentasCon2FA, long totalCuentas, double porcentaje2FA,
      List<CorreoInactividadAlerta> sinUso, long totalSinUso
  ) {}
  ```
- Ante error (p.ej. la vista externa no responde), mismo patrón lenient ya establecido en AD y
  VPN: capturar la excepción, loguear `WARN`, devolver un DTO vacío con HTTP 200.

## 4. Cara 1 — Consultas

Ruta `/correos/consultas`, visible para `READ_correos` (igual que hoy).

- Filtros, tabla/lista, exportar Excel y modal de detalle — se relocalizan sin cambios de
  lógica desde `correos-list.component.ts/.html` (~líneas 43-254 del HTML actual, todo excepto
  el bloque `summary-grid` de KPIs).
- Sin tarjetas KPI en esta cara (las 6 tarjetas se mueven enteras a Dashboard, siguiendo el
  mismo criterio que AD/VPN: la cara de "solo consulta/registro" no lleva resumen agregado).

## 5. Cara 2 — Dashboard

Ruta `/correos/dashboard`, visible para `READ_correos`. Usa `GET /correos/dashboard/completo`.

- Fila de KPIs (las 6 tarjetas actuales, sin cambios de contenido).
- Gráfico de barras horizontal de distribución por dependencia (`ng2-charts`, mismo patrón
  visual que los dashboards de AD/VPN).
- Tarjeta de adopción de 2FA: conteo + porcentaje destacado (no un gráfico separado, solo un
  stat destacado — no amerita su propio chart con un solo par de valores).
- Tarjeta "top 10 cuentas sin uso 30+ días": conteo total destacado + las 10 filas más
  antiguas (correo, nombre, detalle "sin acceso" o "Xd sin acceso"), clicable → no navega a
  ningún lado (no hay cara de Administración a la cual enviar), simplemente muestra el dato;
  si el total > 10, texto informativo "+N más" sin link.

## 6. Manejo de errores

- Dashboard completo: mismo patrón que AD/VPN — ante error, DTO vacío con HTTP 200, frontend
  muestra "No se pudo cargar" + botón reintentar.
- Consultas no cambia su manejo de errores actual (ya es solo lectura, sin mutaciones que
  puedan fallar).

## 7. Pruebas

- **Backend unit**: cálculo de agregados del dashboard completo (dado un
  `List<VwGwDashboard>` simulado, verificar distribución por dependencia, conteo/porcentaje de
  2FA, top-10 sin uso con el orden correcto incluyendo nulos primero).
- **Backend integración**: `@WebMvcTest`/`@SpringBootTest` del endpoint nuevo con el service
  mockeado — verifica ruta, `@PreAuthorize` (403 sin `READ_correos`), forma de la respuesta.
- **Frontend**: specs de cada cara nueva si el patrón de specs ya existe para el módulo
  (`correos-list.component.ts` no tiene spec propio hoy — no se agrega uno nuevo salvo que se
  pida explícitamente, siguiendo el mismo criterio que VPN, que tampoco tenía specs previos).
- **Verificación manual**: filtros y export en Consultas, los 3 bloques del Dashboard con datos
  reales.

## 8. Fuera de alcance

- Cualquier operación de escritura (el módulo sigue siendo 100% de solo lectura).
- Restringir el Dashboard a un subconjunto de usuarios (no existe un permiso más alto que
  `READ_correos` para este módulo; no se inventa uno).
- Paginación completa de la lista de "sin uso" más allá del top 10.

## 9. Decisiones registradas

| Tema | Decisión |
|---|---|
| Número de caras | 2 (Consultas, Dashboard) — sin Administración porque no hay escritura |
| Audiencia por cara | Ambas `READ_correos`, sin restricción adicional en Dashboard |
| KPIs | Se mueven enteros de Consultas a Dashboard (Consultas queda sin resumen agregado) |
| Distribución del Dashboard | Por dependencia (`oficinaPadre`), cuenta todas las cuentas |
| Métrica de 2FA | Conteo + porcentaje, sin gráfico propio |
| Umbral de inactividad | 30 días sin `ultimoInicioSesion`, mismo que el filtro ya existente |
| Guard nuevo | Ninguno — `moduloGuard('correos')` alcanza para ambas caras |
| Construcción del dashboard | Reutiliza `VwGwDashboardRepository.findAll()`, agregados en memoria |
