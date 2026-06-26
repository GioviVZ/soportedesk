# Licencia `serialActivacion` Multi-valor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensanchar `Licencia.serialActivacion` para que acepte varias claves de producto como texto multi-línea (en vez de un solo valor de máx. 200 caracteres), y rellenar los 71 registros reales ya importados con las claves del Excel original.

**Architecture:** Cambio puntual de columna (`NVARCHAR(200)` → `NVARCHAR(MAX)`) sin nueva tabla ni relación — el campo sigue siendo un `String` plano en la entidad, con la convención de "una clave por línea" (`\n`). El frontend cambia el `<input>` a `<textarea>` en el formulario y preserva saltos de línea en el modal de detalle. El backfill de los 71 registros existentes se hace vía la API REST ya viva (no SQL directo), reusando el mismo patrón de script Python temporal (no commiteado) de la importación original.

**Tech Stack:** Spring Boot 3.2.5, Java 17, Jakarta Bean Validation (Hibernate Validator), JUnit 5 + AssertJ, Angular 17+ standalone, Python 3 + `openpyxl` (solo para el script de backfill, no es dependencia del proyecto).

## Global Constraints

- `spring.sql.init.mode: never` y `spring.jpa.hibernate.ddl-auto: none` — los cambios de esquema en la BD real (`172.16.26.16`, base `ssti`) se aplican manualmente vía script en SSMS, nunca automáticos.
- `serialActivacion` queda en texto plano (sin cifrar) — no se reutiliza `LicenciaCredentialConverter`.
- No se agrega validación que relacione el número de líneas de `serialActivacion` con `cantidad` — son campos independientes.
- Los `*ControllerIT` de este proyecto fallan al cargar el `ApplicationContext` por un bug preexistente H2/SQL-Server (documentado en specs anteriores) — fuera de alcance, no se depende de ellos para validar este cambio.
- El script de backfill (Task 3) es temporal: se escribe, se ejecuta, se borra. No se commitea al repo — mismo patrón ya usado para la importación inicial y para `import_ad_usuarios.sql`.

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java` | Modificar | `columnDefinition` de `serialActivacion` |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java` | Modificar | Quitar `@Size(max=200)` de `serialActivacion` |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaRequestTest.java` | Crear | Test de validación Bean Validation directo (sin contexto Spring) |
| `soportedesk-backend/src/main/resources/schema.sql` | Modificar | `serial_activacion` a `NVARCHAR(MAX)` |
| `soportedesk-backend/src/main/resources/alter_licencias_serial_max.sql` | Crear | Migración manual para SSMS |
| `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html` | Modificar | `<input>` → `<textarea>` |
| `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html` | Modificar | `white-space: pre-wrap` en el detalle |

---

## Task 1: Backend — ensanchar `serialActivacion` y quitar el límite de tamaño

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java:35-36`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java:29-30`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaRequestTest.java`
- Modify: `soportedesk-backend/src/main/resources/schema.sql:276`
- Create: `soportedesk-backend/src/main/resources/alter_licencias_serial_max.sql`

**Interfaces:**
- Consumes: `LicenciaRequest` (de `com.inia.soportedesk.licencias`, ya existente).
- Produces: `LicenciaRequest.serialActivacion` sin restricción de tamaño (antes `@Size(max = 200)`). No cambia ningún nombre de campo, método ni firma — solo se relaja una constraint y se actualiza una anotación de columna que no tiene efecto en runtime (`ddl-auto: none`).

- [ ] **Step 1: Escribir el test de validación que falla**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaRequestTest.java`:

```java
package com.inia.soportedesk.licencias;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class LicenciaRequestTest {

    private static final Validator VALIDATOR;

    static {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        VALIDATOR = factory.getValidator();
    }

    private LicenciaRequest validRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setTipoLicenciaId(1L);
        request.setTipoBienId(1L);
        request.setDescripcion("Office 2024 Profesional Home and Business");
        request.setCuentaActivacion("j.perez@inia.gob.pe");
        request.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        request.setCantidad(5);
        return request;
    }

    @Test
    void serialActivacion_withLongMultilineValue_hasNoViolations() {
        String muchasClaves = IntStream.range(0, 200)
                .mapToObj(i -> String.format("AAAAA-BBBBB-CCCCC-DDDDD-%05d", i))
                .collect(Collectors.joining("\n"));
        assertThat(muchasClaves.length()).isGreaterThan(200);

        LicenciaRequest request = validRequest();
        request.setSerialActivacion(muchasClaves);

        Set<ConstraintViolation<LicenciaRequest>> violations = VALIDATOR.validate(request);

        assertThat(violations).isEmpty();
    }
}
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `cd soportedesk-backend && mvn test -Dtest=LicenciaRequestTest`
Expected: FAIL — `violations` no está vacío, reporta una violación de `@Size` sobre `serialActivacion` (mensaje tipo "size must be between 0 and 200").

- [ ] **Step 3: Quitar el límite de tamaño en `LicenciaRequest.java`**

En `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java`, el bloque actual:

```java
    @Size(max = 200)
    private String serialActivacion;
```

Reemplazar por:

```java
    private String serialActivacion;
```

(El import `jakarta.validation.constraints.Size` se mantiene — sigue usado por `descripcion` y `cuentaActivacion`.)

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `cd soportedesk-backend && mvn test -Dtest=LicenciaRequestTest`
Expected: PASS (1 test)

- [ ] **Step 5: Actualizar el `columnDefinition` en la entidad**

En `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java`, el bloque actual:

```java
    @Column(name = "serial_activacion")
    private String serialActivacion;
```

Reemplazar por:

```java
    @Column(name = "serial_activacion", columnDefinition = "NVARCHAR(MAX)")
    private String serialActivacion;
```

- [ ] **Step 6: Actualizar `schema.sql`**

En `soportedesk-backend/src/main/resources/schema.sql:276`, la línea actual:

```sql
    serial_activacion  NVARCHAR(200)  NULL,
```

Reemplazar por:

```sql
    serial_activacion  NVARCHAR(MAX)  NULL,
```

- [ ] **Step 7: Crear el script de migración manual para SSMS**

Crear `soportedesk-backend/src/main/resources/alter_licencias_serial_max.sql`:

```sql
-- =============================================================
-- Migración: ensanchar serial_activacion para soportar varias
-- claves de producto por licencia (una por línea).
-- Ejecutar manualmente en SSMS contra el servidor 172.16.26.16, base ssti.
-- =============================================================

USE ssti;
GO

ALTER TABLE dbo.licencias ALTER COLUMN serial_activacion NVARCHAR(MAX) NULL;
GO

-- Verificación
SELECT name, system_type_name(system_type_id) AS tipo, max_length
FROM sys.dm_exec_describe_first_result_set(N'SELECT serial_activacion FROM dbo.licencias', NULL, 0)
WHERE name = 'serial_activacion';
GO
```

- [ ] **Step 8: Verificar que el proyecto compila**

Run: `cd soportedesk-backend && mvn compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaRequestTest.java soportedesk-backend/src/main/resources/schema.sql soportedesk-backend/src/main/resources/alter_licencias_serial_max.sql
git commit -m "feat: widen Licencia.serialActivacion to support multiple product keys"
```

---

## Task 2: Frontend — textarea en el formulario y salto de línea en el detalle

**Files:**
- Modify: `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html:31-34`
- Modify: `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html:21`

**Interfaces:**
- Consumes: `form.controls.serialActivacion` (ya existe en `licencia-form.component.ts:34`, sin validators — no requiere cambios en el `.ts`); `viewing.serialActivacion` (ya existe en `licencia.model.ts:10`, tipo `string`).
- Produces: ningún cambio de tipo ni de nombre — solo de presentación (HTML/CSS).

- [ ] **Step 1: Cambiar el input por un textarea en el formulario**

En `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html`, el bloque actual (líneas 31-34):

```html
  <div class="field">
    <label>Serial de Activación</label>
    <input type="text" formControlName="serialActivacion" />
  </div>
```

Reemplazar por:

```html
  <div class="field">
    <label>Serial de Activación</label>
    <textarea formControlName="serialActivacion" rows="6" placeholder="Una clave por línea"></textarea>
  </div>
```

- [ ] **Step 2: Preservar saltos de línea en el modal de detalle**

En `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html`, la línea actual (línea 21):

```html
    <app-field label="Serial de Activación">{{ viewing.serialActivacion || '—' }}</app-field>
```

Reemplazar por:

```html
    <app-field label="Serial de Activación"><span style="white-space: pre-wrap">{{ viewing.serialActivacion || '—' }}</span></app-field>
```

- [ ] **Step 3: Verificar que el frontend compila**

Run: `cd soportedesk-frontend && ng build`
Expected: `Application bundle generation complete` sin errores nuevos (los warnings de tamaño de bundle ya existentes no son una regresión).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/licencias/licencia-form.component.html soportedesk-frontend/src/app/features/licencias/licencias-list.component.html
git commit -m "feat: edit serialActivacion as multiline textarea, preserve line breaks in detail view"
```

---

## Task 3: Backfill de los 71 registros reales con sus claves de producto

**Files:**
- Ninguno se crea/modifica en el repo. Este task opera contra la base de datos real (`172.16.26.16`/`ssti`) a través de la API REST del backend ya corriendo en `http://localhost:8080`. El script Python usado es temporal y se borra al final del task (no se commitea).

**Interfaces:**
- Consumes: endpoints ya existentes `POST /api/auth/login` (`AuthResponse.token`), `GET /api/licencias` (devuelve `List<Licencia>` con `id`, `tipoLicencia.id`, `tipoBien.id`, `descripcion`, `cuentaActivacion`, `claveActivacion` ya desencriptado, `serialActivacion`, `ordenCompra`, `anio`, `cantidad`), `PUT /api/licencias/{id}` (body `LicenciaRequest`, devuelve `Licencia` actualizado). El archivo `soportedesk-backend/src/main/resources/inventario_licencias_ofimatica.xlsx` (gitignored, ya en disco) con columnas `OC, Year, File, LicenseNumberInFile, LicenseKey, EmailPrimary, EmailsAll, Password`.
- Produces: los 71 registros de `licencias` en la BD real quedan con `serialActivacion` poblado. No se produce ningún artefacto en el repo.

**Pre-requisito (lo hace el usuario, no el agente):** correr `alter_licencias_serial_max.sql` en SSMS contra `172.16.26.16`/`ssti`, y reiniciar el backend (`mvn spring-boot:run` desde `soportedesk-backend/`) para que cargue el `LicenciaRequest` sin el límite de 200 caracteres (Task 1 ya debe estar mergeado/compilado en el working tree para esto).

- [ ] **Step 1: Confirmar que el pre-requisito está hecho**

Antes de continuar, confirmar con el usuario que ya corrió el ALTER en SSMS y reinició el backend. Verificar que el backend está arriba:

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d "{}"`
Expected: `400` (endpoint responde — un body vacío falla la validación de `LoginRequest`, pero confirma que el backend está corriendo y no es un `000`/timeout).

- [ ] **Step 2: Escribir el script temporal de backfill**

Crear `backfill_licencias_seriales.py` en la raíz del repo (temporal, no se commitea):

```python
import json
import sys
import urllib.request
from collections import OrderedDict

import openpyxl

BASE_URL = "http://localhost:8080"
XLSX_PATH = "soportedesk-backend/src/main/resources/inventario_licencias_ofimatica.xlsx"


def http_json(method, path, token=None, body=None):
    url = BASE_URL + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8") or "null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8") or "null")


def load_serial_map():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["Licencias"]
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    groups = OrderedDict()
    for oc, year, file, num, key, email_primary, emails_all, password in rows:
        groups.setdefault((str(oc), str(year)), []).append(key)
    return {k: "\n".join(v) for k, v in groups.items()}


def main():
    execute = "--execute" in sys.argv

    serial_map = load_serial_map()
    print(f"Grupos leídos del Excel: {len(serial_map)}")

    status, body = http_json("POST", "/api/auth/login", body={"username": "admin", "password": "admin"})
    if status != 200:
        print("Login fallido:", status, body)
        sys.exit(1)
    token = body["token"]

    status, licencias = http_json("GET", "/api/licencias", token=token)
    if status != 200:
        print("GET /api/licencias falló:", status, licencias)
        sys.exit(1)
    print(f"Licencias existentes: {len(licencias)}")

    ok, fail, sin_match = 0, 0, 0
    for lic in licencias:
        key = (lic["ordenCompra"], lic["anio"])
        seriales = serial_map.get(key)
        if seriales is None:
            print("SIN MATCH en Excel:", key)
            sin_match += 1
            continue

        payload = {
            "tipoLicenciaId": lic["tipoLicencia"]["id"],
            "tipoBienId": lic["tipoBien"]["id"],
            "descripcion": lic["descripcion"],
            "cuentaActivacion": lic["cuentaActivacion"],
            "claveActivacion": lic["claveActivacion"],
            "serialActivacion": seriales,
            "ordenCompra": lic["ordenCompra"],
            "anio": lic["anio"],
            "cantidad": lic["cantidad"],
        }

        if not execute:
            continue

        status, resp = http_json("PUT", f"/api/licencias/{lic['id']}", token=token, body=payload)
        if status == 200:
            ok += 1
        else:
            fail += 1
            print("FALLO", key, status, resp)

    if not execute:
        print(f"\nDry-run: {len(licencias) - sin_match} listos para actualizar, {sin_match} sin match.")
        print("Vuelve a correr con --execute para aplicar de verdad.")
        return

    print(f"\nActualizadas: {ok}  Fallidas: {fail}  Sin match: {sin_match}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Dry-run del script**

Run: `python backfill_licencias_seriales.py`
Expected: `Grupos leídos del Excel: 71`, `Licencias existentes: 71`, `Dry-run: 71 listos para actualizar, 0 sin match.` — si aparece algún "SIN MATCH", detenerse e investigar antes de ejecutar (no debería pasar, ya se confirmó que `(ordenCompra, anio)` es único entre los 71 grupos).

- [ ] **Step 4: Ejecutar el backfill real**

Run: `python backfill_licencias_seriales.py --execute`
Expected: `Actualizadas: 71  Fallidas: 0  Sin match: 0`

- [ ] **Step 5: Verificar el resultado contra la API**

```bash
python -c "
import json, urllib.request

def http_json(method, path, token=None, body=None):
    req = urllib.request.Request('http://localhost:8080'+path, data=json.dumps(body).encode('utf-8') if body else None, method=method)
    req.add_header('Content-Type','application/json')
    if token: req.add_header('Authorization', 'Bearer '+token)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

token = http_json('POST','/api/auth/login',body={'username':'admin','password':'admin'})['token']
data = http_json('GET','/api/licencias',token=token)
vacios = [d for d in data if not d['serialActivacion']]
print('total:', len(data), 'sin serialActivacion:', len(vacios))
muestra = data[0]
lineas = muestra['serialActivacion'].count(chr(10)) + 1
print('muestra ordenCompra=', muestra['ordenCompra'], 'cantidad=', muestra['cantidad'], 'lineas=', lineas)
"
```

Expected: `total: 71 sin serialActivacion: 0`, y en la muestra `lineas` igual a `cantidad` (o razonablemente cercano si hubiera claves duplicadas/vacías en el Excel original — no se espera, ya se validó la data antes de la importación inicial).

- [ ] **Step 6: Borrar el script temporal**

```bash
rm backfill_licencias_seriales.py
```

No hay commit en este task — nada queda en el repo, solo cambió el estado de la base de datos real.
