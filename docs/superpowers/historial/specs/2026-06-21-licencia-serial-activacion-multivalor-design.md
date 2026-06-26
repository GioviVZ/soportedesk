# Spec: Licencia — `serialActivacion` multi-valor

**Fecha:** 2026-06-21
**Estado:** Aprobado
**Contexto:** SoporteDesk INIA — panel de gestión TI para INIA Perú

## Objetivo

El módulo de Licencias (rediseñado el 2026-06-20, ver `2026-06-20-licencias-module-redesign-design.md`) tiene un campo `serialActivacion` pensado para una sola clave de producto. Al importar el inventario real (`inventario_licencias_ofimatica.xlsx`, 771 claves de producto agrupadas en 71 órdenes de compra), ese campo quedó vacío en los 71 registros porque cada orden de compra agrupa entre 1 y 167 claves distintas — no cabían en el campo tal como existía (`NVARCHAR(200)`, un solo valor).

Se ensancha `serialActivacion` para aceptar varias claves por registro, como texto plano con una clave por línea, y se hace el backfill de los 71 registros existentes con los datos reales del Excel.

## Decisiones

- **Forma de almacenamiento:** texto multi-línea en una sola columna ensanchada (`NVARCHAR(MAX)`), una clave por línea (`\n`). Se descartó una tabla hija (`licencia_seriales` 1-a-muchos) porque para grupos de hasta 167 claves, editar vía una lista dinámica de "agregar/quitar fila" en el formulario es peor UX que pegar/editar un bloque de texto en un textarea, y el cambio de esquema es mínimo (un `ALTER COLUMN` en vez de tabla + FK nuevos).
- **Cifrado:** `serialActivacion` queda en texto plano, igual que el diseño original. No se reutiliza `LicenciaCredentialConverter` (reservado para `claveActivacion`, que guarda la contraseña de la cuenta de correo) — las claves de producto de Office son menos sensibles que una credencial de cuenta.
- **Relación con `cantidad`:** no se agrega una regla de validación que fuerce que el número de líneas en `serialActivacion` coincida con `cantidad`. Son campos independientes, igual que hoy.

## Modelo de datos

### Tabla `licencias` (cambio puntual)

| Columna | Tipo actual | Tipo nuevo | Notas |
|---|---|---|---|
| serial_activacion | NVARCHAR(200) NULL | NVARCHAR(MAX) NULL | Resto de la tabla sin cambios |

Migración manual (mismo patrón que `migrate_licencias_v2.sql`): nuevo script `alter_licencias_serial_max.sql`, ejecutado por el usuario en SSMS contra `172.16.26.16`/`ssti`:

```sql
ALTER TABLE dbo.licencias ALTER COLUMN serial_activacion NVARCHAR(MAX) NULL;
```

`schema.sql` se actualiza igual (`serial_activacion NVARCHAR(MAX) NULL`) para que una base nueva quede con la estructura final.

## Backend

- `Licencia.java`: el campo `serialActivacion` pasa de `@Column(name = "serial_activacion")` (sin anotar longitud, default Hibernate 255) a `@Column(name = "serial_activacion", columnDefinition = "NVARCHAR(MAX)")`. Documentación/intención — no tiene efecto en runtime porque `ddl-auto: none`.
- `LicenciaRequest.java`: se quita `@Size(max = 200)` de `serialActivacion`. Queda sin restricción de tamaño, igual que `claveActivacion`.
- `LicenciaServiceTest`: se agrega un test que verifica que un `serialActivacion` largo y multi-línea (varios cientos de caracteres, simulando un grupo de ~100+ claves) se acepta y se persiste sin truncarse — fija el comportamiento de que el `@Size` ya no aplica.
- No hay cambios en `LicenciaService`, `LicenciaRepository`, `LicenciaController` ni en la regla de negocio cuenta/clave existente.

## Frontend

- `licencia-form.component.html`: el campo "Serial de Activación" cambia de `<input type="text" formControlName="serialActivacion">` a `<textarea formControlName="serialActivacion" rows="6" placeholder="Una clave por línea">`.
- `licencias-list.component.html`: en el modal de detalle, el `app-field` de "Serial de Activación" recibe `style="white-space: pre-wrap"` en su contenido para preservar los saltos de línea (el componente compartido `app-field` no se modifica, el estilo se aplica solo en este uso puntual).
- `licencia.model.ts`: sin cambios de tipo — `serialActivacion` sigue siendo `string`, solo cambia la convención de contenido (multi-línea).

## Backfill de los 71 registros existentes

Los 71 registros de `licencias` ya están en la base real (importados el 2026-06-21 desde el mismo Excel, ver memoria del proyecto). Se re-popula `serialActivacion` sin tocar el resto de los campos:

1. Usuario corre `alter_licencias_serial_max.sql` en SSMS.
2. Usuario reinicia el backend (`mvn spring-boot:run`) para que tome el `LicenciaRequest` sin el límite de 200 caracteres.
3. Script temporal en Python (no se commitea al repo, se borra al terminar — mismo patrón usado en la importación inicial y en `import_ad_usuarios.sql`):
   - Login admin vía `/api/auth/login`.
   - `GET /api/licencias` para tener los 71 registros existentes con sus IDs y campos actuales.
   - Lee `inventario_licencias_ofimatica.xlsx`, agrupa filas por `(OC, Year, File)`, une las `LicenseKey` de cada grupo con `\n`.
   - Matchea cada grupo del Excel con su registro existente por `ordenCompra` (= OC) + `anio` (= Year) — combinación confirmada única entre los 71 grupos.
   - `PUT /api/licencias/{id}` por cada uno de los 71, reenviando los campos existentes (tipoLicenciaId, tipoBienId, descripcion, cuentaActivacion, claveActivacion, ordenCompra, anio, cantidad) más el nuevo `serialActivacion`.
4. Verificación: los 71 registros quedan con `serialActivacion` no vacío; en al menos una muestra, el número de líneas coincide con `cantidad`.

## Fuera de alcance

- No se valida ni se fuerza relación entre `cantidad` y el número de líneas de `serialActivacion`.
- No se agrega búsqueda por clave individual dentro de `serialActivacion` (sigue fuera del `LicenciaRepository.search()`).
- Los `*ControllerIT` siguen fuera de alcance del bug preexistente H2/SQL-Server documentado en specs anteriores — no se espera que pasen en este entorno.
