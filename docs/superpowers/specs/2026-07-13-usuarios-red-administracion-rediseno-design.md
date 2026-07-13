# Rediseño visual de Administración — Usuarios de Red/AD

## Contexto

`soportedesk-backend/src/main/resources/usuarios-red-administracion/` contiene un modelo de referencia (Angular standalone, template externo) de una pantalla CRUD para un `UsuarioRed` local (con `sede`/`dependencia`/`subdependencia`/`tipoContrato`/`fechaFinContrato` como entidad propia). Ese modelo es solo una referencia de diseño: la entidad `UsuarioRed` local ya no existe como tal en el backend real — el módulo actual administra cuentas reales de Active Directory vía LDAP (alta, reset de clave, grupos, mover OU, editar info, habilitar/deshabilitar, desbloquear), expuestas por `ActiveDirectoryService`.

La pantalla real de Administración (`usuarios-red-administracion.component.ts`) es hoy un único componente de ~980 líneas con template inline: toolbar de sincronización, KPIs (`app-ad-kpis`, estilo `stat-pill`), buscador (`app-ad-user-search`), detalle (`app-ad-user-detail`), grid de acciones, y 5 formularios modales con campos en `div.field` planos sin agrupar.

El objetivo es **tomar el patrón visual** del modelo de referencia (secciones con ícono vía `app-section-card`, agrupación clara de campos, cards de resumen con tono) y aplicarlo a la pantalla real, **sin cambiar ningún campo/endpoint del backend** — es un rediseño de presentación, no de datos.

## Alcance

- Dividir `usuarios-red-administracion.component.ts` en 6 subcomponentes autocontenidos (siguiendo el patrón ya usado por `usuario-red-contratos-panel.component.ts`: inyectan su propio servicio, manejan su propio estado/notice, template inline + `styleUrls` — no se introducen archivos `.html` externos, para mantener la convención real del módulo).
- Reemplazar los KPIs `stat-pill` por `summary-card` con tono, **solo en esta vista** (no se toca `ad-kpis.component.ts`, que se reusa en Dashboard).
- No se agregan/quitan campos, endpoints, ni validaciones de negocio. No se toca el backend.

## Componentes nuevos

Todos viven en `soportedesk-frontend/src/app/features/usuarios-red/` (mismo nivel que el resto del módulo, sin subcarpeta).

### `ad-admin-summary.component.ts`
KPI cards con tono (reemplaza `stat-pill` solo en Administración):
- Total (neutral)
- Habilitados (success)
- Bloqueados (danger)
- Deshabilitados (warning)

`@Input({required:true}) dashboard: ActiveDirectoryDashboard | null`.

### `ad-create-user-panel.component.ts`
Alta de usuario en AD + contrato inicial opcional. Inyecta `ActiveDirectoryService`, `CatalogoService`, `UsuarioRedContratoService`.

Agrupación en `app-section-card`:
- **Cuenta**: usuario (samAccountName), contraseña temporal, nombres, apellidos, nombre mostrado, correo, UPN, cargo, checkboxes habilitar/forzar cambio.
- **Ubicación**: dependencia, subdependencia, teléfono, celular, buscador de OU destino, descripción.
- **Contrato** (toggle "Registrar contrato al crear"): tipo, número, fecha inicio/fin, nombre/apellidos de personal si el tipo es OS (`esTipoContratoOs`).

Comportamiento a preservar exactamente igual al actual:
- Si falla la creación en AD → no cierra, notice de error inline.
- Si la creación en AD tiene éxito pero falla el registro del contrato → SÍ cierra, pero el notice final (a nivel página) advierte que el contrato no se guardó.
- UPN autogenerado desde el samAccountName mientras el usuario no lo edite manualmente (misma lógica `onCreateSamChanged`/`onCreateUpnChanged`/`generatedUpn`).

Emite `(saved)` con `{ user: AdUser, notice: {tone, text} }` una vez la cuenta AD quedó creada (con o sin contrato exitoso). Emite `(cancelled)` al cancelar.

### `ad-reset-password-panel.component.ts`
Sección única "Nueva contraseña": contraseña temporal + checkbox forzar cambio. `@Input({required:true}) samAccountName: string`. Emite `(saved)` con `{ user, notice }` solo si el reset fue exitoso (igual que hoy: en error, se queda abierto mostrando el notice).

### `ad-groups-panel.component.ts`
Sección "Membresías": buscador de grupos + lista de resultados + lista de asignados con "Quitar". `@Input({required:true}) samAccountName`. A diferencia de los demás, **no cierra el modal** al agregar/quitar (mismo comportamiento actual): emite `(changed)` con `{ user, notice }` para que el padre refresque estado sin cerrar. Cierre solo vía backdrop/X del modal (ya provisto por `app-modal`).

### `ad-move-ou-panel.component.ts`
Sección "Nueva unidad organizativa": buscador + lista de resultados seleccionables. `@Input({required:true}) samAccountName`. Emite `(saved)` con `{ user, notice }` en éxito (cierra); en error se queda abierto.

### `ad-edit-info-panel.component.ts`
Sección "Datos de AD": nombre mostrado, cargo, dependencia/subdependencia, teléfono, celular, correo, descripción. `@Input({required:true}) user: AdUser`. Emite `(saved)` con `{ user, notice }` en éxito; en error se queda abierto.

## Componente padre (`usuarios-red-administracion.component.ts`)

Se reduce a: toolbar de sync + `app-ad-admin-summary` + acción primaria "Crear usuario de red" + `app-ad-user-search` + notice de página + estado vacío + `app-ad-user-detail` + grid de 6 acciones que abren cada modal.

Maneja: `dashboard`, `syncStatus`, `user`, `groups`, `activePanel`, notice de página. Handlers unificados:
- `onPanelSaved(result)`: actualiza `user`, recarga `groups`/`dashboard`, cierra el panel activo, flashea `result.notice`.
- `onPanelChanged(result)` (solo grupos): igual que arriba pero sin cerrar el panel.
- `onPanelCancelled()`: cierra sin tocar estado.

Toda la lógica de llamadas HTTP para cada acción (unlock, reset password, grupos, mover OU, editar info, crear usuario+contrato) se mueve del padre a su respectivo panel; el padre deja de inyectar `UsuarioRedContratoService` y `CatalogoService` directamente (cada panel que los necesita los inyecta él mismo).

`unlock()` y `toggleEnabled()` no son modales (son botones directos en el grid de acciones) — se quedan en el padre tal cual están hoy, sin cambios.

## Estilos

Se reutiliza `usuarios-red.shared.scss` para clases comunes (`.field`, `.modal-form`, `.form-grid`, `.pick-list`, `.assigned-list`, `.notice`, `.action-card`, etc.) tal como ya hace el resto del módulo. Cada panel nuevo puede tener su propio `.scss` puntual solo si necesita algo específico (siguiendo el patrón de `ad-user-search.component.scss`).

`app-section-card` y `app-field` (ya existentes, usados en `ad-user-detail` y en el modelo de referencia) se reutilizan tal cual, sin modificarlos.

## Testing

- Cada subcomponente nuevo recibe su propio spec básico (creación, render de secciones, emisión de eventos en éxito/error) siguiendo el estilo de los specs ya existentes en el módulo.
- El spec actual `usuarios-red-administracion.component.spec.ts` se adapta al componente padre reducido (deja de probar el detalle interno de cada formulario, que ahora vive en su propio spec).
- No se tocan tests de backend: no hay cambios de API.

## Fuera de alcance

- Cambiar `ad-kpis.component.ts` (Dashboard sigue igual).
- Cambiar cualquier endpoint, DTO o validación de backend.
- Tocar `Consultas` o `Dashboard` (las otras dos pestañas del shell).
- Adoptar el modelo CRUD local (`UsuarioRed` con sede/dependencia propia) del backend de referencia — no aplica a la arquitectura real basada en AD en vivo.
