# Permisos por módulo (vista vs edición) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin choose, per usuario de soporte and per módulo, one of three access levels — sin acceso / solo vista / vista+edición — and have that respected end-to-end (JWT authorities, backend `@PreAuthorize` on GET endpoints, VPN credential masking, Angular sidebar/guards, and the "Usuarios del Sistema" form).

**Architecture:** Reuse the existing `permisos` table (usuario_id + modulo) by adding a `nivel` column (`VIEW`/`EDIT`). JWT carries `{modulo: nivel}` instead of a flat list; `JwtAuthFilter` derives `READ_<modulo>` (always) and `WRITE_<modulo>` (only if `EDIT`) authorities. Every GET endpoint that today has no `@PreAuthorize` gets `READ_<modulo>`. Angular's `AuthService` gains `canRead()`; sidebar items and route guards switch from `canWrite` to `canRead` for visibility.

**Tech Stack:** Spring Boot 3 / Spring Security `@PreAuthorize` / JJWT, Angular 17+ standalone components, SQL Server (manual schema.sql, no Flyway).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-06-27-permisos-vista-edicion-design.md`
- No new tables — only a `nivel NVARCHAR(10)` column on `dbo.permisos`.
- `auditoria`, `herramientas`, `inventario-equipos` are always `nivel = VIEW` (no edit concept) — enforced server-side, not just by the UI.
- `IllegalArgumentException` in this backend maps to **HTTP 409** (see `GlobalExceptionHandler.handleIllegalArgument`), not 400 — use `isConflict()` in tests, not `isBadRequest()`.
- `mvn test` runs only Surefire (`*Test`/`*ServiceTest`); `*ControllerIT`/`*ServiceIT` run via Failsafe with `mvn verify`. A pre-existing Surefire failure (`UsuarioRepositoryTest`) means use `mvn verify -Dmaven.test.failure.ignore=true` and check `target/failsafe-reports/*.txt` to confirm ITs ran.
- `UsuarioSistemaServiceIT` and `AuthControllerIT` are `@SpringBootTest` with no embedded DB override — they hit the **real** SQL Server dev DB (`172.16.26.16/ssti`). The `nivel` column migration (Task 19) must be applied to that DB before running `mvn verify`, or these ITs will fail with a SQL error.
- Running SQL against `172.16.26.16/ssti` requires explicit user confirmation first (shared dev database).

---

## Phase 1 — Modelo de datos y JWT (backend)

### Task 1: `NivelPermiso` enum + `Modulos` whitelist

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/NivelPermiso.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Modulos.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/ModulosTest.java`

**Interfaces:**
- Produces: `NivelPermiso { VIEW, EDIT }`; `Modulos.VALIDOS: Set<String>` (11 keys); `Modulos.SOLO_VISTA: Set<String>` (3 keys, subset of `VALIDOS`).

- [ ] **Step 1: Write the failing test**

```java
package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ModulosTest {

    @Test
    void validos_containsAllElevenModuleKeys() {
        assertThat(Modulos.VALIDOS).containsExactlyInAnyOrder(
                "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
                "impresoras", "wifi", "licencias",
                "auditoria", "herramientas", "inventario-equipos");
    }

    @Test
    void soloVista_isSubsetOfValidos() {
        assertThat(Modulos.SOLO_VISTA).containsExactlyInAnyOrder(
                "auditoria", "herramientas", "inventario-equipos");
        assertThat(Modulos.VALIDOS).containsAll(Modulos.SOLO_VISTA);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=ModulosTest` (from `soportedesk-backend/`)
Expected: compile error — `Modulos` does not exist.

- [ ] **Step 3: Write minimal implementation**

```java
package com.inia.soportedesk.auth;

public enum NivelPermiso {
    VIEW, EDIT
}
```

```java
package com.inia.soportedesk.auth;

import java.util.Set;

public final class Modulos {

    public static final Set<String> SOLO_VISTA = Set.of(
            "auditoria", "herramientas", "inventario-equipos");

    public static final Set<String> VALIDOS = Set.of(
            "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
            "impresoras", "wifi", "licencias",
            "auditoria", "herramientas", "inventario-equipos");

    private Modulos() {
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=ModulosTest` (from `soportedesk-backend/`)
Expected: `Tests run: 2, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auth/NivelPermiso.java soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Modulos.java soportedesk-backend/src/test/java/com/inia/soportedesk/auth/ModulosTest.java
git commit -m "feat: add NivelPermiso enum and Modulos whitelist"
```

---

### Task 2: `Permiso` entity gains `nivel`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Permiso.java`

**Interfaces:**
- Consumes: `NivelPermiso` (Task 1).
- Produces: `Permiso.getNivel(): NivelPermiso`, `Permiso.setNivel(NivelPermiso)`. Defaults to `EDIT` when not set (matches the DB column default, preserves current behavior for code paths that don't set it explicitly).

This task has no dedicated test — `Permiso` is a plain JPA entity with Lombok-generated accessors; its behavior is exercised by `UsuarioSistemaServiceIT` (Task 7) and the controller ITs (Phase 3). Writing a test for a generated getter/setter pair would be testing Lombok, not our code.

- [ ] **Step 1: Add the field**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Permiso.java`, change:

```java
    @Column(nullable = false, length = 50)
    private String modulo;
}
```

to:

```java
    @Column(nullable = false, length = 50)
    private String modulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NivelPermiso nivel = NivelPermiso.EDIT;
}
```

(`jakarta.persistence.*` is already imported via the wildcard import at the top of the file, so `EnumType`/`Enumerated` need no new import.)

- [ ] **Step 2: Compile to verify**

Run: `mvn -q compile` (from `soportedesk-backend/`)
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Permiso.java
git commit -m "feat: add nivel field to Permiso entity"
```

---

### Task 3: `JwtService` carries `Map<modulo, nivel>` instead of `List<modulo>`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/security/JwtService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/security/JwtServiceTest.java`

**Interfaces:**
- Produces: `JwtService.generateToken(String username, String role, Map<String,String> permisos): String`; `JwtService.extractPermisos(String token): Map<String,String>`.
- Consumed by: `JwtAuthFilter` (Task 4), `AuthController` (Task 5).

- [ ] **Step 1: Write the failing test**

Replace the contents of `JwtServiceTest.java` with:

```java
package com.inia.soportedesk.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
                "c29wb3J0ZWRlc2staW5pYS1zZWNyZXQta2V5LWNoYW5nZS1pbi1wcm9kdWNjaW9uLTEyMzQ1Ng==");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 86400000L);
    }

    @Test
    void generateToken_thenExtractUsernameAndRole() {
        String token = jwtService.generateToken("jperez", "ADMIN", Map.of());

        assertThat(jwtService.extractUsername(token)).isEqualTo("jperez");
        assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN");
        assertThat(jwtService.isTokenValid(token, "jperez")).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForDifferentUsername() {
        String token = jwtService.generateToken("jperez", "ADMIN", Map.of());

        assertThat(jwtService.isTokenValid(token, "otro")).isFalse();
    }

    @Test
    void generateToken_thenExtractPermisos_roundTripsModuloNivelMap() {
        String token = jwtService.generateToken("soporte01", "SOPORTE",
                Map.of("licencias", "EDIT", "auditoria", "VIEW"));

        Map<String, String> permisos = jwtService.extractPermisos(token);

        assertThat(permisos).containsEntry("licencias", "EDIT");
        assertThat(permisos).containsEntry("auditoria", "VIEW");
    }

    @Test
    void extractPermisos_withNoPermisosClaim_returnsEmptyMap() {
        String token = jwtService.generateToken("soporte01", "SOPORTE", Map.of());

        assertThat(jwtService.extractPermisos(token)).isEmpty();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=JwtServiceTest` (from `soportedesk-backend/`)
Expected: compile error — `generateToken(String, String, Map<String,String>)` does not exist (current signature takes `List<String>`).

- [ ] **Step 3: Write minimal implementation**

In `JwtService.java`, change the import block and the two methods:

```java
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
```

```java
    public String generateToken(String username, String role, Map<String, String> permisos) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("permisos", permisos);

        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
```

```java
    @SuppressWarnings("unchecked")
    public Map<String, String> extractPermisos(String token) {
        return extractClaim(token, claims -> {
            Object p = claims.get("permisos");
            return (p instanceof Map) ? (Map<String, String>) p : Collections.emptyMap();
        });
    }
```

Remove the now-unused `import java.util.List;`.

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=JwtServiceTest` (from `soportedesk-backend/`)
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/security/JwtService.java soportedesk-backend/src/test/java/com/inia/soportedesk/security/JwtServiceTest.java
git commit -m "feat: JwtService carries modulo->nivel map instead of flat permiso list"
```

---

### Task 4: `JwtAuthFilter` derives `READ_<modulo>` and `WRITE_<modulo>` from nivel

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/security/JwtAuthFilter.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/security/JwtAuthFilterTest.java`

**Interfaces:**
- Consumes: `JwtService.extractUsername`, `JwtService.isTokenValid`, `JwtService.extractPermisos` (Task 3); `CustomUserDetailsService.loadUserByUsername`.
- Produces: authorities `ROLE_<rol>` + `READ_<modulo>` for every entry in the permisos map + `WRITE_<modulo>` only when the nivel is `"EDIT"`.

- [ ] **Step 1: Write the failing test**

```java
package com.inia.soportedesk.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthFilter filter;

    @BeforeEach
    void setUp() {
        // Built here, not as a field initializer: @Mock fields are only injected by
        // MockitoExtension after the test instance is constructed, so a field
        // initializer would capture nulls for jwtService/userDetailsService.
        filter = new JwtAuthFilter(jwtService, userDetailsService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_withEditPermiso_grantsReadAndWriteAuthorities() throws Exception {
        UserDetails userDetails = new User("soporte01", "hash", true, true, true, true,
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SOPORTE")));

        when(request.getHeader("Authorization")).thenReturn("Bearer faketoken");
        when(jwtService.extractUsername("faketoken")).thenReturn("soporte01");
        when(userDetailsService.loadUserByUsername("soporte01")).thenReturn(userDetails);
        when(jwtService.isTokenValid("faketoken", "soporte01")).thenReturn(true);
        when(jwtService.extractPermisos("faketoken")).thenReturn(Map.of("licencias", "EDIT", "auditoria", "VIEW"));

        filter.doFilterInternal(request, response, filterChain);

        List<String> authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream().map(GrantedAuthority::getAuthority).toList();

        assertThat(authorities).contains("ROLE_SOPORTE", "READ_licencias", "WRITE_licencias",
                "READ_auditoria");
        assertThat(authorities).doesNotContain("WRITE_auditoria");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=JwtAuthFilterTest` (from `soportedesk-backend/`)
Expected: FAIL — assertion `doesNotContain("WRITE_auditoria")` fails (current filter adds `WRITE_<modulo>` for every permiso, with no `READ_` at all), or the test fails earlier because `authorities` doesn't contain `READ_licencias`/`READ_auditoria`.

- [ ] **Step 3: Write minimal implementation**

In `JwtAuthFilter.java`, replace:

```java
                    List<String> permisos = jwtService.extractPermisos(token);
                    for (String modulo : permisos) {
                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("WRITE_" + modulo));
                    }
```

with:

```java
                    java.util.Map<String, String> permisos = jwtService.extractPermisos(token);
                    for (java.util.Map.Entry<String, String> entry : permisos.entrySet()) {
                        String modulo = entry.getKey();
                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("READ_" + modulo));
                        if ("EDIT".equals(entry.getValue())) {
                            authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("WRITE_" + modulo));
                        }
                    }
```

Remove the now-unused `import java.util.List;` only if nothing else in the file uses `List` — it's still used for `authorities` (`List<GrantedAuthority>`), so keep it.

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=JwtAuthFilterTest` (from `soportedesk-backend/`)
Expected: `Tests run: 1, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/security/JwtAuthFilter.java soportedesk-backend/src/test/java/com/inia/soportedesk/security/JwtAuthFilterTest.java
git commit -m "feat: JwtAuthFilter derives READ_/WRITE_ authorities from permiso nivel"
```

---

### Task 5: `AuthResponse`/`AuthController` build the `modulo -> nivel` map

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/AuthResponse.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/AuthController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/AuthControllerTest.java`

**Interfaces:**
- Consumes: `Permiso.getModulo()`, `Permiso.getNivel()` (Task 2); `JwtService.generateToken(..., Map<String,String>)` (Task 3).
- Produces: `AuthResponse.permisos: Map<String,String>` (was `List<String>`).

- [ ] **Step 1: Write the failing test**

Add to `AuthControllerTest.java` (new imports: `java.util.List`, `com.inia.soportedesk.auth.NivelPermiso`; keep existing imports):

```java
    @Test
    void login_returnsPermisosAsModuloNivelMap() {
        Usuario soporte = new Usuario();
        soporte.setId(2L);
        soporte.setUsername("soporte01");
        soporte.setPasswordHash("hash");
        soporte.setNombre("Soporte Uno");
        soporte.setRol(Rol.SOPORTE);
        soporte.setActivo(true);

        Permiso editLicencias = new Permiso();
        editLicencias.setUsuario(soporte);
        editLicencias.setModulo("licencias");
        editLicencias.setNivel(NivelPermiso.EDIT);

        Permiso viewAuditoria = new Permiso();
        viewAuditoria.setUsuario(soporte);
        viewAuditoria.setModulo("auditoria");
        viewAuditoria.setNivel(NivelPermiso.VIEW);

        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.of(soporte));
        when(permisoRepository.findByUsuario(soporte)).thenReturn(List.of(editLicencias, viewAuditoria));
        when(jwtService.generateToken(eq("soporte01"), eq("SOPORTE"), any())).thenReturn("fake-token");

        LoginRequest request = new LoginRequest();
        request.setUsername("soporte01");
        request.setPassword("secret");

        ResponseEntity<?> response = controller.login(request);

        AuthResponse body = (AuthResponse) response.getBody();
        assertThat(body.getPermisos()).containsEntry("licencias", "EDIT");
        assertThat(body.getPermisos()).containsEntry("auditoria", "VIEW");
    }
```

This needs `eq`/`any` matchers and `ResponseEntity` already imported; add to the static imports:

```java
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
```

`authenticationManager.authenticate(...)` is a mock with no stubbed behavior, so by default it returns `null` without throwing — that's fine, `login()` doesn't use the return value before looking up the user.

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=AuthControllerTest` (from `soportedesk-backend/`)
Expected: compile error — `Permiso.setNivel` exists (Task 2) but `AuthResponse.getPermisos()` is typed `List<String>`, so `containsEntry` doesn't compile against it (or, if it does compile because `getBody()` is `Object`/raw, the assertion fails because `permisos` is still a flat list of module names, not nivel values).

- [ ] **Step 3: Write minimal implementation**

In `AuthResponse.java`:

```java
package com.inia.soportedesk.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String nombre;
    private String rol;
    private Map<String, String> permisos;
}
```

In `AuthController.java`, add `import java.util.Map;` and `import java.util.stream.Collectors;`, then replace both occurrences of:

```java
        List<String> permisos = permisoRepository.findByUsuario(usuario).stream()
                .map(Permiso::getModulo)
                .toList();
```

with:

```java
        Map<String, String> permisos = permisoRepository.findByUsuario(usuario).stream()
                .collect(Collectors.toMap(Permiso::getModulo, p -> p.getNivel().name()));
```

(one occurrence in `login()`, one in `me()` — both build the same shape).

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=AuthControllerTest` (from `soportedesk-backend/`)
Expected: `Tests run: 3, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auth/AuthResponse.java soportedesk-backend/src/main/java/com/inia/soportedesk/auth/AuthController.java soportedesk-backend/src/test/java/com/inia/soportedesk/auth/AuthControllerTest.java
git commit -m "feat: AuthResponse exposes permisos as modulo->nivel map"
```

---

## Phase 2 — `UsuarioSistema` CRUD con niveles

### Task 6: `UsuarioSistemaRequest`/`Response` use `Map<String,String> permisos`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioSistemaRequest.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioSistemaResponse.java`

**Interfaces:**
- Produces: `UsuarioSistemaRequest.getPermisos(): Map<String,String>`; `UsuarioSistemaResponse(..., Map<String,String> permisos)`.

No isolated test here — both are plain DTOs; their new shape is exercised by Task 7's tests. Compiling will fail until Task 7 updates `UsuarioSistemaService` to match, so do Steps 1 and the compile check together with Task 7 in mind (this task alone will not compile standalone — that's expected and resolved by the next task).

- [ ] **Step 1: Update `UsuarioSistemaRequest`**

```java
package com.inia.soportedesk.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class UsuarioSistemaRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String nombre;

    private String password;

    private boolean activo = true;

    private Map<String, String> permisos;
}
```

- [ ] **Step 2: Update `UsuarioSistemaResponse`**

```java
package com.inia.soportedesk.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class UsuarioSistemaResponse {
    private Long id;
    private String username;
    private String nombre;
    private String rol;
    private boolean activo;
    private Map<String, String> permisos;
}
```

- [ ] **Step 3: Commit together with Task 7**

Do not commit yet — `UsuarioSistemaService` (Task 7) still references the old `List<String>` shape and won't compile. Proceed directly to Task 7; the commit at the end of Task 7 covers both files.

---

### Task 7: `UsuarioSistemaService` validates and persists `modulo -> nivel`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioSistemaService.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/UsuarioSistemaServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/UsuarioSistemaServiceIT.java`

**Interfaces:**
- Consumes: `Modulos.VALIDOS`, `Modulos.SOLO_VISTA` (Task 1); `NivelPermiso` (Task 1); `UsuarioSistemaRequest`/`Response` (Task 6).
- Produces: `UsuarioSistemaService.create/update` throw `IllegalArgumentException` (→ HTTP 409) for an unknown módulo key or an invalid nivel value; for módulos in `SOLO_VISTA`, the persisted nivel is forced to `VIEW` regardless of what was requested.

- [ ] **Step 1: Write the failing unit tests**

Create `UsuarioSistemaServiceTest.java`:

```java
package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioSistemaServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PermisoRepository permisoRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioSistemaService service;

    private UsuarioSistemaRequest baseRequest(Map<String, String> permisos) {
        UsuarioSistemaRequest request = new UsuarioSistemaRequest();
        request.setUsername("soporte01");
        request.setNombre("Soporte Uno");
        request.setPassword("secret123");
        request.setActivo(true);
        request.setPermisos(permisos);
        return request;
    }

    @Test
    void create_withUnknownModulo_throwsIllegalArgumentException() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("modulo-inexistente", "EDIT"));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withInvalidNivel_throwsIllegalArgumentException() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("licencias", "DELETE"));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withSoloVistaModuloRequestedAsEdit_persistsAsView() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("auditoria", "EDIT"));

        service.create(request);

        ArgumentCaptor<Permiso> captor = ArgumentCaptor.forClass(Permiso.class);
        verify(permisoRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getModulo()).isEqualTo("auditoria");
        assertThat(captor.getValue().getNivel()).isEqualTo(NivelPermiso.VIEW);
    }

    @Test
    void create_withValidEditModulo_persistsRequestedNivel() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("licencias", "EDIT"));

        service.create(request);

        ArgumentCaptor<Permiso> captor = ArgumentCaptor.forClass(Permiso.class);
        verify(permisoRepository).save(captor.capture());
        assertThat(captor.getValue().getModulo()).isEqualTo("licencias");
        assertThat(captor.getValue().getNivel()).isEqualTo(NivelPermiso.EDIT);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn test -Dtest=UsuarioSistemaServiceTest` (from `soportedesk-backend/`)
Expected: compile error or failures — `setPermisos` currently accepts `List<String>` and does no validation at all (any string is accepted, nivel is never set).

- [ ] **Step 3: Write minimal implementation**

Replace `setPermisos` and `normalizePermisos` in `UsuarioSistemaService.java`, and update `toResponse`:

```java
    private void setPermisos(Usuario u, Map<String, String> permisos) {
        permisoRepository.deleteByUsuario(u);
        permisoRepository.flush();

        if (permisos == null) {
            return;
        }
        for (Map.Entry<String, String> entry : permisos.entrySet()) {
            String modulo = entry.getKey();
            if (modulo == null || modulo.isBlank() || !Modulos.VALIDOS.contains(modulo)) {
                throw new IllegalArgumentException("Modulo de permiso invalido: " + modulo);
            }
            NivelPermiso nivel = Modulos.SOLO_VISTA.contains(modulo)
                    ? NivelPermiso.VIEW
                    : parseNivel(entry.getValue());

            Permiso p = new Permiso();
            p.setUsuario(u);
            p.setModulo(modulo);
            p.setNivel(nivel);
            permisoRepository.save(p);
        }
    }

    private NivelPermiso parseNivel(String value) {
        try {
            return NivelPermiso.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new IllegalArgumentException("Nivel de permiso invalido: " + value);
        }
    }
```

Replace the body of `toResponse`:

```java
    private UsuarioSistemaResponse toResponse(Usuario u) {
        Map<String, String> permisos = permisoRepository.findByUsuario(u).stream()
                .collect(java.util.stream.Collectors.toMap(Permiso::getModulo, p -> p.getNivel().name()));
        return new UsuarioSistemaResponse(u.getId(), u.getUsername(), u.getNombre(),
                u.getRol().name(), u.isActivo(), permisos);
    }
```

Remove the imports `java.util.LinkedHashSet;` and `java.util.Set;` (no longer used) and add `import java.util.Map;`. The two call sites `setPermisos(u, request.getPermisos())` in `create`/`update` need no change — `request.getPermisos()` is now a `Map<String,String>`, matching the new signature.

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn test -Dtest=UsuarioSistemaServiceTest` (from `soportedesk-backend/`)
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 5: Update the existing integration test for the new map shape**

Replace the body of `UsuarioSistemaServiceIT.update_replacesExistingPermisosAndAllowsAddingAuditoria`:

```java
    @Test
    void update_replacesExistingPermisosAndAllowsAddingAuditoria() {
        UsuarioSistemaRequest create = new UsuarioSistemaRequest();
        create.setUsername("soporte01");
        create.setNombre("Soporte Uno");
        create.setPassword("secret123");
        create.setActivo(true);
        create.setPermisos(Map.of("vpn", "EDIT"));

        UsuarioSistemaResponse created = service.create(create);

        UsuarioSistemaRequest update = new UsuarioSistemaRequest();
        update.setUsername("soporte01");
        update.setNombre("Soporte Uno");
        update.setActivo(true);
        update.setPermisos(Map.of("vpn", "VIEW", "auditoria", "EDIT"));

        UsuarioSistemaResponse updated = service.update(created.getId(), update);

        assertThat(updated.getPermisos()).containsEntry("vpn", "VIEW");
        assertThat(updated.getPermisos()).containsEntry("auditoria", "VIEW");
        Usuario usuario = usuarioRepository.findByUsername("soporte01").orElseThrow();
        assertThat(permisoRepository.findByUsuario(usuario))
                .extracting(Permiso::getModulo)
                .containsExactlyInAnyOrder("vpn", "auditoria");
    }
```

(asserts `auditoria` is forced to `VIEW` even though the update requested `EDIT` — exercises the `SOLO_VISTA` enforcement against the real DB.) Change the `import java.util.List;` to `import java.util.Map;`.

This test needs the `nivel` column to exist in the real dev DB — it will fail with a SQL error until Task 19 (migration) is applied. **Do not run `mvn verify` for this file yet** — just save the change now; it will be exercised in Task 19's verification step.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioSistemaRequest.java soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioSistemaResponse.java soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioSistemaService.java soportedesk-backend/src/test/java/com/inia/soportedesk/auth/UsuarioSistemaServiceTest.java soportedesk-backend/src/test/java/com/inia/soportedesk/auth/UsuarioSistemaServiceIT.java
git commit -m "feat: UsuarioSistemaService validates and persists modulo->nivel permisos"
```

---

## Phase 3 — Proteger GET con `READ_<modulo>`

Each task below follows the same shape: add a failing `@WithMockUser` test asserting 403 without the `READ_<modulo>` authority, fix the now-broken "allows authenticated user" test to grant that authority, then add `@PreAuthorize`. All `*ControllerIT` tests run via `mvn verify` (Failsafe), not `mvn test`.

### Task 8: `LicenciaController`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaControllerIT.java`

- [ ] **Step 1: Update the existing GET test and add a forbidden case**

In `LicenciaControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleLicencia()));

        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion", is("Office 2024 Profesional Home and Business")))
                .andExpect(jsonPath("$[0].tipoLicencia.nombre", is("Ofimática")))
                .andExpect(jsonPath("$[0].tipoBien.nombre", is("Intangible")));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_licencias"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleLicencia()));

        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion", is("Office 2024 Profesional Home and Business")))
                .andExpect(jsonPath("$[0].tipoLicencia.nombre", is("Ofimática")))
                .andExpect(jsonPath("$[0].tipoBien.nombre", is("Intangible")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=LicenciaControllerIT` (from `soportedesk-backend/`)
Expected: `findAll_withoutReadAuthority_returnsForbidden` FAILS (currently returns 200, GET has no `@PreAuthorize`).

- [ ] **Step 3: Add the guard**

In `LicenciaController.java`, add `@PreAuthorize` to both GET methods:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_licencias')")
    public List<Licencia> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_licencias')")
    public Licencia findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=LicenciaControllerIT` (from `soportedesk-backend/`); check `target/failsafe-reports/com.inia.soportedesk.licencias.LicenciaControllerIT.txt`
Expected: `Tests run: 6, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaController.java soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaControllerIT.java
git commit -m "feat: require READ_licencias authority on licencias GET endpoints"
```

---

### Task 9: `WifiController`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/wifi/WifiController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/wifi/WifiControllerIT.java`

- [ ] **Step 1: Update the existing GET test and add a forbidden case**

In `WifiControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo")));

        mockMvc.perform(get("/api/wifi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ssid", is("INIA-CORP")));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_wifi"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo")));

        mockMvc.perform(get("/api/wifi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ssid", is("INIA-CORP")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/wifi"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=WifiControllerIT` (from `soportedesk-backend/`)
Expected: `findAll_withoutReadAuthority_returnsForbidden` FAILS (currently 200).

- [ ] **Step 3: Add the guard**

In `WifiController.java`:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_wifi')")
    public List<Wifi> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_wifi')")
    public Wifi findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=WifiControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/wifi/WifiController.java soportedesk-backend/src/test/java/com/inia/soportedesk/wifi/WifiControllerIT.java
git commit -m "feat: require READ_wifi authority on wifi GET endpoints"
```

---

### Task 10: `EquipoController`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoControllerIT.java`

- [ ] **Step 1: Update the existing GET test and add a forbidden case**

In `EquipoControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleEquipo()));

        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numeroSerie", is("SN-2024-001")));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_equipos"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleEquipo()));

        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numeroSerie", is("SN-2024-001")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=EquipoControllerIT` (from `soportedesk-backend/`)
Expected: `findAll_withoutReadAuthority_returnsForbidden` FAILS (currently 200).

- [ ] **Step 3: Add the guard**

In `EquipoController.java` — note this controller also has `/con-red`, used by the VPN dropdown; it gets the same guard:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<Equipo> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/con-red")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<Equipo> findConRed() {
        return service.findConRed();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public Equipo findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=EquipoControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoController.java soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoControllerIT.java
git commit -m "feat: require READ_equipos authority on equipos GET endpoints"
```

---

### Task 11: `CorreoController`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/correos/CorreoControllerIT.java`

- [ ] **Step 1: Update the existing GET test and add a forbidden case**

In `CorreoControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        Correo correo = sampleCorreo();
        when(service.findAll(null)).thenReturn(List.of(correo));

        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")))
                .andExpect(jsonPath("$[0].sede.nombre", is("Lima")));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        Correo correo = sampleCorreo();
        when(service.findAll(null)).thenReturn(List.of(correo));

        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")))
                .andExpect(jsonPath("$[0].sede.nombre", is("Lima")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=CorreoControllerIT` (from `soportedesk-backend/`)
Expected: `findAll_withoutReadAuthority_returnsForbidden` FAILS (currently 200).

- [ ] **Step 3: Add the guard**

In `CorreoController.java`:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<Correo> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public Correo findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=CorreoControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoController.java soportedesk-backend/src/test/java/com/inia/soportedesk/correos/CorreoControllerIT.java
git commit -m "feat: require READ_correos authority on correos GET endpoints"
```

---

### Task 12: `UsuarioRedController`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/usuariosred/UsuarioRedControllerIT.java`

- [ ] **Step 1: Update the existing GET test and add a forbidden case**

In `UsuarioRedControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        UsuarioRed usuario = sampleUsuarioRed();
        when(service.findAll(null)).thenReturn(List.of(usuario));

        mockMvc.perform(get("/api/usuarios-red"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_usuarios-red"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        UsuarioRed usuario = sampleUsuarioRed();
        when(service.findAll(null)).thenReturn(List.of(usuario));

        mockMvc.perform(get("/api/usuarios-red"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/usuarios-red"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=UsuarioRedControllerIT` (from `soportedesk-backend/`)
Expected: `findAll_withoutReadAuthority_returnsForbidden` FAILS (currently 200).

- [ ] **Step 3: Add the guard**

In `UsuarioRedController.java`:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<UsuarioRed> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public UsuarioRed findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=UsuarioRedControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedController.java soportedesk-backend/src/test/java/com/inia/soportedesk/usuariosred/UsuarioRedControllerIT.java
git commit -m "feat: require READ_usuarios-red authority on usuarios-red GET endpoints"
```

---

### Task 13: `ImpresoraController` (incl. driver download)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java`

- [ ] **Step 1: Update the existing GET tests and add forbidden cases**

In `ImpresoraControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleImpresora()));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].marca", is("HP")))
                .andExpect(jsonPath("$[0].modelo", is("M404dn")));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleImpresora()));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].marca", is("HP")))
                .andExpect(jsonPath("$[0].modelo", is("M404dn")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isForbidden());
    }
```

In `ImpresoraDriverControllerIT.java`, replace the `downloadDriver_returnsFileBytes` test:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void downloadDriver_returnsFileBytes() throws Exception {
        Path stored = fileStorageService.load(
                fileStorageService.store(2L, new MockMultipartFile("file", "driver-canon.zip", "application/zip", "contenido".getBytes())));

        when(service.findById(2L)).thenReturn(impresoraConDriver(2L, "2/driver-canon.zip"));

        mockMvc.perform(get("/api/impresoras/2/driver"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(Files.readAllBytes(stored)));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void downloadDriver_withReadAuthority_returnsFileBytes() throws Exception {
        Path stored = fileStorageService.load(
                fileStorageService.store(2L, new MockMultipartFile("file", "driver-canon.zip", "application/zip", "contenido".getBytes())));

        when(service.findById(2L)).thenReturn(impresoraConDriver(2L, "2/driver-canon.zip"));

        mockMvc.perform(get("/api/impresoras/2/driver"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(Files.readAllBytes(stored)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void downloadDriver_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/impresoras/2/driver"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=ImpresoraControllerIT,ImpresoraDriverControllerIT` (from `soportedesk-backend/`)
Expected: both new `withoutReadAuthority_returnsForbidden` tests FAIL (currently 200).

- [ ] **Step 3: Add the guard**

In `ImpresoraController.java`:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public List<Impresora> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public Impresora findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

and on the driver download method:

```java
    @GetMapping("/{id}/driver")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public ResponseEntity<Resource> downloadDriver(@PathVariable Long id) {
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=ImpresoraControllerIT,ImpresoraDriverControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 4` (Impresora) and `Tests run: 4` (Driver), `Failures: 0, Errors: 0` for both.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java
git commit -m "feat: require READ_impresoras authority on impresoras GET endpoints"
```

---

### Task 14: `VpnController` (general `READ_vpn` only — credenciales masking is Task 18)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java`

- [ ] **Step 1: Update the existing GET test and add a forbidden case**

In `VpnControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleVpn()));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estado", is("Activo")));
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleVpn()));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estado", is("Activo")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isForbidden());
    }
```

The existing `patchAntivirus_withSoporteRole_returnsOk` test (no `READ_vpn`/`WRITE_vpn` authority required today) is untouched — `/antivirus` stays open to any authenticated soporte user, unrelated to general VPN visibility.

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=VpnControllerIT` (from `soportedesk-backend/`)
Expected: `findAll_withoutReadAuthority_returnsForbidden` FAILS (currently 200).

- [ ] **Step 3: Add the guard**

In `VpnController.java`:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public List<Vpn> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public Vpn findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=VpnControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 5, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java
git commit -m "feat: require READ_vpn authority on vpn GET endpoints"
```

---

### Task 15: `MovimientoAuditoriaController` — rename `WRITE_auditoria` to `READ_auditoria`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/MovimientoAuditoriaController.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/MovimientoAuditoriaControllerIT.java`

No IT exists today for this controller. Create one that pins down current+new behavior.

**Interfaces:**
- Consumes: `MovimientoAuditoriaService.buscar(String, String, String, LocalDate, LocalDate, Integer): List<MovimientoAuditoriaResponse>`.

- [ ] **Step 1: Write the failing test**

```java
package com.inia.soportedesk.auditoria;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MovimientoAuditoriaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MovimientoAuditoriaService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_auditoria"})
    void buscar_withReadAuthority_returnsOk() throws Exception {
        when(service.buscar(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/movimientos"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void buscar_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/auditoria/movimientos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void buscar_withAdminRole_returnsOk() throws Exception {
        when(service.buscar(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/movimientos"))
                .andExpect(status().isOk());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=MovimientoAuditoriaControllerIT` (from `soportedesk-backend/`)
Expected: `buscar_withReadAuthority_returnsOk` FAILS with 403 (class-level guard currently requires `WRITE_auditoria`, not `READ_auditoria`); `buscar_withoutReadAuthority_returnsForbidden` already passes coincidentally (no authority either way).

- [ ] **Step 3: Rename the authority**

In `MovimientoAuditoriaController.java`, change:

```java
@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_auditoria')")
```

to:

```java
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_auditoria')")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=MovimientoAuditoriaControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 3, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/MovimientoAuditoriaController.java soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/MovimientoAuditoriaControllerIT.java
git commit -m "fix: MovimientoAuditoriaController requires READ_auditoria, not WRITE_auditoria"
```

---

### Task 16: `HerramientasController` — add `READ_herramientas` (previously unprotected)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/herramientas/HerramientasControllerIT.java`

This controller currently has **no** `@PreAuthorize` at all — any authenticated user can hit `/api/herramientas/ping` even without the `herramientas` permiso. This closes that gap.

- [ ] **Step 1: Update the existing test and add a forbidden case**

In `HerramientasControllerIT.java`, replace:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_allowsAuthenticatedUser() throws Exception {
        PingRequest request = new PingRequest();
        request.setHost("127.0.0.1");
        when(service.ping("127.0.0.1")).thenReturn(PingResult.builder()
                .host("127.0.0.1")
                .reachable(true)
                .status("Responde")
                .output(List.of("ok"))
                .build());

        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.host", is("127.0.0.1")))
                .andExpect(jsonPath("$.reachable", is(true)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_rejectsUnsafeHost() throws Exception {
        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content("{\"host\":\"127.0.0.1 & whoami\"}"))
                .andExpect(status().isBadRequest());
    }
```

with:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void ping_withReadAuthority_allowsUser() throws Exception {
        PingRequest request = new PingRequest();
        request.setHost("127.0.0.1");
        when(service.ping("127.0.0.1")).thenReturn(PingResult.builder()
                .host("127.0.0.1")
                .reachable(true)
                .status("Responde")
                .output(List.of("ok"))
                .build());

        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.host", is("127.0.0.1")))
                .andExpect(jsonPath("$.reachable", is(true)));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void ping_rejectsUnsafeHost() throws Exception {
        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content("{\"host\":\"127.0.0.1 & whoami\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_withoutReadAuthority_returnsForbidden() throws Exception {
        PingRequest request = new PingRequest();
        request.setHost("127.0.0.1");

        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=HerramientasControllerIT` (from `soportedesk-backend/`)
Expected: `ping_withoutReadAuthority_returnsForbidden` FAILS (currently 200/400, never 403 — no guard exists).

- [ ] **Step 3: Add the guard**

In `HerramientasController.java`, add the import and class-level annotation:

```java
import org.springframework.security.access.prepost.PreAuthorize;
```

```java
@RestController
@RequestMapping("/api/herramientas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_herramientas')")
public class HerramientasController {
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=HerramientasControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 3, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasController.java soportedesk-backend/src/test/java/com/inia/soportedesk/herramientas/HerramientasControllerIT.java
git commit -m "fix: require READ_herramientas authority (was completely unprotected)"
```

---

### Task 17: `InventarioEquipoController` — add `READ_inventario-equipos` (previously unprotected)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/inventario/InventarioEquipoController.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/inventario/InventarioEquipoControllerIT.java`

This controller currently has **no** `@PreAuthorize` — `getAll`, `getById`, and the `rematch`/`manualMatch`/`rematchAll` mutation endpoints are all reachable by any authenticated user. All of them get the same `READ_inventario-equipos` guard (this module has no separate edit concept — see spec).

**Interfaces:**
- Consumes: `InventarioEquipoService.getAll(String): List<InventarioEquipoResponse>`.

- [ ] **Step 1: Write the failing test**

```java
package com.inia.soportedesk.inventario;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InventarioEquipoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InventarioEquipoService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_inventario-equipos"})
    void getAll_withReadAuthority_returnsOk() throws Exception {
        when(service.getAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void getAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAll_withAdminRole_returnsOk() throws Exception {
        when(service.getAll(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isOk());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=InventarioEquipoControllerIT` (from `soportedesk-backend/`)
Expected: `getAll_withoutReadAuthority_returnsForbidden` FAILS (currently 200 — no guard exists).

- [ ] **Step 3: Add the guard**

In `InventarioEquipoController.java`, add the import and class-level annotation:

```java
import org.springframework.security.access.prepost.PreAuthorize;
```

```java
@RestController
@RequestMapping("/api/inventario-equipos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_inventario-equipos')")
public class InventarioEquipoController {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=InventarioEquipoControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 3, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/inventario/InventarioEquipoController.java soportedesk-backend/src/test/java/com/inia/soportedesk/inventario/InventarioEquipoControllerIT.java
git commit -m "fix: require READ_inventario-equipos authority (was completely unprotected)"
```

---

## Phase 4 — Enmascarar credenciales VPN

### Task 18: `VpnService.maskCredencialesIfNeeded` + wiring in `VpnController`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java`

**Interfaces:**
- Produces: `VpnService.maskCredencialesIfNeeded(Vpn, Authentication): void`; overload `maskCredencialesIfNeeded(List<Vpn>, Authentication): void`. Mirrors the existing `canEditCredenciales(Authentication)` private helper, checking `READ_credenciales-vpn` instead of `WRITE_credenciales-vpn`.

- [ ] **Step 1: Write the failing unit tests**

Add to `VpnServiceTest.java` (new imports: `org.springframework.security.core.authority.SimpleGrantedAuthority`, `java.util.List` already imported):

```java
    @Test
    void maskCredencialesIfNeeded_withoutReadAuthority_nullsOutCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SOPORTE")));

        service.maskCredencialesIfNeeded(vpn, auth);

        assertThat(vpn.getUsuarioVpn()).isNull();
        assertThat(vpn.getCredencialVpn()).isNull();
    }

    @Test
    void maskCredencialesIfNeeded_withReadAuthority_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SOPORTE"),
                new org.springframework.security.core.authority.SimpleGrantedAuthority("READ_credenciales-vpn")));

        service.maskCredencialesIfNeeded(vpn, auth);

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
        assertThat(vpn.getCredencialVpn()).isEqualTo("supersecret");
    }

    @Test
    void maskCredencialesIfNeeded_withAdminRole_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN")));

        service.maskCredencialesIfNeeded(vpn, auth);

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn test -Dtest=VpnServiceTest` (from `soportedesk-backend/`)
Expected: compile error — `maskCredencialesIfNeeded` does not exist on `VpnService`.

- [ ] **Step 3: Write minimal implementation**

In `VpnService.java`, add after `canEditCredenciales`:

```java
    public void maskCredencialesIfNeeded(Vpn vpn, Authentication auth) {
        if (!canViewCredenciales(auth)) {
            vpn.setUsuarioVpn(null);
            vpn.setCredencialVpn(null);
        }
    }

    public void maskCredencialesIfNeeded(List<Vpn> vpns, Authentication auth) {
        vpns.forEach(vpn -> maskCredencialesIfNeeded(vpn, auth));
    }

    private boolean canViewCredenciales(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("READ_credenciales-vpn"));
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn test -Dtest=VpnServiceTest` (from `soportedesk-backend/`)
Expected: `Tests run: 7, Failures: 0, Errors: 0`

- [ ] **Step 5: Wire masking into the controller — write the failing IT first**

Add to `VpnControllerIT.java`:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void findAll_withoutCredencialesAuthority_masksCredentials() throws Exception {
        Vpn vpn = sampleVpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        when(service.findAll(null)).thenReturn(List.of(vpn));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuarioVpn").doesNotExist())
                .andExpect(jsonPath("$[0].credencialVpn").doesNotExist());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn", "READ_credenciales-vpn"})
    void findAll_withCredencialesAuthority_keepsCredentials() throws Exception {
        Vpn vpn = sampleVpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        when(service.findAll(null)).thenReturn(List.of(vpn));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuarioVpn", is("vpnuser1")));
    }
```

(`jsonPath(...).doesNotExist()` is correct here because Jackson omits `null` Boolean/String fields only if configured to — by default Jackson **includes** `null` fields as `"usuarioVpn": null`, which `doesNotExist()` would fail on. Use `jsonPath("$[0].usuarioVpn").value(org.hamcrest.Matchers.nullValue()))` instead to be safe with default Jackson config:)

Replace both `doesNotExist()` lines with:

```java
                .andExpect(jsonPath("$[0].usuarioVpn", org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$[0].credencialVpn", org.hamcrest.Matchers.nullValue()));
```

- [ ] **Step 6: Run test to verify it fails**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=VpnControllerIT` (from `soportedesk-backend/`)
Expected: `findAll_withoutCredencialesAuthority_masksCredentials` FAILS — `usuarioVpn` is still `"vpnuser1"` (controller doesn't call masking yet).

- [ ] **Step 7: Wire the call in `VpnController`**

In `VpnController.java`, add `import org.springframework.security.core.Authentication;` (already imported for `create`/`update`), then change:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public List<Vpn> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public Vpn findById(@PathVariable Long id) {
        return service.findById(id);
    }
```

to:

```java
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public List<Vpn> findAll(@RequestParam(required = false) String search, Authentication auth) {
        List<Vpn> result = service.findAll(search);
        service.maskCredencialesIfNeeded(result, auth);
        return result;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn')")
    public Vpn findById(@PathVariable Long id, Authentication auth) {
        Vpn vpn = service.findById(id);
        service.maskCredencialesIfNeeded(vpn, auth);
        return vpn;
    }
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=VpnControllerIT` (from `soportedesk-backend/`)
Expected: `Tests run: 7, Failures: 0, Errors: 0`

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java
git commit -m "feat: mask VPN credentials in GET responses without READ_credenciales-vpn"
```

---

## Phase 5 — Migración SQL

### Task 19: `schema.sql` update + manual migration script + apply to dev DB

**Files:**
- Modify: `soportedesk-backend/src/main/resources/schema.sql`
- Create: `docs/superpowers/migrations/2026-06-27-permisos-nivel.sql`

**This task requires running SQL against the shared dev database (`172.16.26.16/ssti`). Confirm with the user before executing Step 3.**

- [ ] **Step 1: Update `schema.sql` for fresh installs**

In `schema.sql`, replace the `permisos` table definition:

```sql
IF OBJECT_ID(N'dbo.permisos', N'U') IS NULL
CREATE TABLE dbo.permisos (
    id         BIGINT       NOT NULL IDENTITY(1,1),
    usuario_id BIGINT       NOT NULL,
    modulo     NVARCHAR(50) NOT NULL,
    CONSTRAINT PK_permisos                PRIMARY KEY (id),
    CONSTRAINT UQ_permisos_usuario_modulo UNIQUE      (usuario_id, modulo),
    CONSTRAINT FK_permisos_usuario        FOREIGN KEY (usuario_id)
        REFERENCES dbo.usuarios (id) ON DELETE CASCADE
);
GO
```

with:

```sql
IF OBJECT_ID(N'dbo.permisos', N'U') IS NULL
CREATE TABLE dbo.permisos (
    id         BIGINT       NOT NULL IDENTITY(1,1),
    usuario_id BIGINT       NOT NULL,
    modulo     NVARCHAR(50) NOT NULL,
    nivel      NVARCHAR(10) NOT NULL DEFAULT 'EDIT',
    CONSTRAINT PK_permisos                PRIMARY KEY (id),
    CONSTRAINT UQ_permisos_usuario_modulo UNIQUE      (usuario_id, modulo),
    CONSTRAINT FK_permisos_usuario        FOREIGN KEY (usuario_id)
        REFERENCES dbo.usuarios (id) ON DELETE CASCADE,
    CONSTRAINT CHK_permisos_nivel         CHECK       (nivel IN (N'VIEW', N'EDIT'))
);
GO
```

- [ ] **Step 2: Write the migration script for the existing dev DB**

Create `docs/superpowers/migrations/2026-06-27-permisos-nivel.sql`:

```sql
-- Migración: nivel de permiso (VIEW/EDIT) por modulo
-- Fecha: 2026-06-27
-- Ejecutar en la base de datos: ssti (172.16.26.16)

-- 1. Nueva columna; todo lo existente se interpreta como EDIT (preserva el
--    comportamiento actual: hoy un permiso = puede editar).
ALTER TABLE dbo.permisos
  ADD nivel NVARCHAR(10) NOT NULL CONSTRAINT DF_permisos_nivel DEFAULT 'EDIT' WITH VALUES;
GO

ALTER TABLE dbo.permisos
  ADD CONSTRAINT CHK_permisos_nivel CHECK (nivel IN (N'VIEW', N'EDIT'));
GO

-- 2. Los 3 modulos solo-vista nunca tuvieron edicion: corregir su nivel.
UPDATE dbo.permisos
   SET nivel = 'VIEW'
 WHERE modulo IN (N'auditoria', N'herramientas', N'inventario-equipos');
GO

-- 3. Backfill: todo usuario SOPORTE que hoy ve un modulo de edicion sin
--    permiso explicito (porque el GET estaba abierto) recibe VIEW, para no
--    perder acceso al activar la nueva restriccion.
INSERT INTO dbo.permisos (usuario_id, modulo, nivel)
SELECT u.id, m.modulo, 'VIEW'
FROM dbo.usuarios u
CROSS JOIN (VALUES (N'usuarios-red'), (N'correos'), (N'equipos'), (N'vpn'),
                    (N'credenciales-vpn'), (N'impresoras'), (N'wifi'), (N'licencias')) AS m(modulo)
WHERE u.rol = N'SOPORTE'
  AND NOT EXISTS (
    SELECT 1 FROM dbo.permisos p
    WHERE p.usuario_id = u.id AND p.modulo = m.modulo
  );
GO
```

- [ ] **Step 3: Apply the migration to the dev DB (requires explicit user confirmation)**

Ask the user to confirm before running. If confirmed, run via `sqlcmd` (adjust path/auth if SSMS is preferred instead):

```bash
sqlcmd -S 172.16.26.16 -U sa -P '$Lipknot86' -d ssti -i "docs/superpowers/migrations/2026-06-27-permisos-nivel.sql"
```

Expected: no errors; `SELECT TOP 5 * FROM dbo.permisos;` afterwards shows a populated `nivel` column with only `VIEW`/`EDIT` values.

- [ ] **Step 4: Verify the previously-blocked integration tests now pass**

Run: `mvn verify -Dmaven.test.failure.ignore=true -Dit.test=UsuarioSistemaServiceIT,AuthControllerIT` (from `soportedesk-backend/`)
Expected: `UsuarioSistemaServiceIT` passes (Task 7's updated test asserting `auditoria` forced to `VIEW`); `AuthControllerIT` passes unchanged.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/resources/schema.sql docs/superpowers/migrations/2026-06-27-permisos-nivel.sql
git commit -m "feat: add nivel column to permisos table (schema + dev DB migration script)"
```

---

## Phase 6 — Frontend: `AuthService`

### Task 20: `auth.model.ts` — `permisos` becomes a `modulo -> nivel` map

**Files:**
- Modify: `soportedesk-frontend/src/app/core/models/auth.model.ts`
- Modify: `soportedesk-frontend/src/app/core/auth/auth.service.spec.ts`

**Interfaces:**
- Produces: `export type NivelPermiso = 'VIEW' | 'EDIT';` `AuthResponse.permisos: Record<string, NivelPermiso>` (was `string[]`).

- [ ] **Step 1: Update the model**

```typescript
export type Rol = 'ADMIN' | 'SOPORTE';

export type NivelPermiso = 'VIEW' | 'EDIT';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  nombre: string;
  rol: Rol;
  permisos: Record<string, NivelPermiso>;
}
```

- [ ] **Step 2: Fix the now-broken existing spec fixture**

In `auth.service.spec.ts`, change:

```typescript
  const response: AuthResponse = {
    token: 'fake-jwt-token',
    username: 'admin',
    nombre: 'Administrador',
    rol: 'ADMIN',
    permisos: [],
  };
```

to:

```typescript
  const response: AuthResponse = {
    token: 'fake-jwt-token',
    username: 'admin',
    nombre: 'Administrador',
    rol: 'ADMIN',
    permisos: {},
  };
```

- [ ] **Step 3: Run existing tests to verify they still pass**

Run: `ng test --watch=false --include='**/auth.service.spec.ts'` (from `soportedesk-frontend/`)
Expected: `3 specs, 0 failures` (no behavioral change yet, just the type/fixture).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/core/models/auth.model.ts soportedesk-frontend/src/app/core/auth/auth.service.spec.ts
git commit -m "feat: AuthResponse.permisos is a modulo->nivel map"
```

---

### Task 21: `AuthService.canRead` / `canWrite` read the nivel map

**Files:**
- Modify: `soportedesk-frontend/src/app/core/auth/auth.service.ts`
- Modify: `soportedesk-frontend/src/app/core/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `NivelPermiso` (Task 20).
- Produces: `AuthService.canRead(modulo: string): boolean` (new); `AuthService.canWrite(modulo: string): boolean` (same name, new semantics — now requires `nivel === 'EDIT'` instead of mere presence in a flat list); `AuthService.getPermisos(): Record<string, NivelPermiso>` (was `string[]`).

- [ ] **Step 1: Write the failing tests**

Add to `auth.service.spec.ts` (new import: `, NivelPermiso` not needed in spec):

```typescript
  it('canRead returns true when the module has any nivel assigned', () => {
    localStorage.setItem('rol', 'SOPORTE');
    localStorage.setItem('permisos', JSON.stringify({ licencias: 'VIEW' }));

    expect(service.canRead('licencias')).toBe(true);
    expect(service.canRead('vpn')).toBe(false);
  });

  it('canWrite returns true only when nivel is EDIT', () => {
    localStorage.setItem('rol', 'SOPORTE');
    localStorage.setItem('permisos', JSON.stringify({ licencias: 'VIEW', vpn: 'EDIT' }));

    expect(service.canWrite('licencias')).toBe(false);
    expect(service.canWrite('vpn')).toBe(true);
  });

  it('canRead and canWrite return true for admin regardless of permisos', () => {
    localStorage.setItem('rol', 'ADMIN');

    expect(service.canRead('licencias')).toBe(true);
    expect(service.canWrite('licencias')).toBe(true);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `ng test --watch=false --include='**/auth.service.spec.ts'` (from `soportedesk-frontend/`)
Expected: FAIL — `canRead` does not exist on `AuthService`; `canWrite('licencias')` currently returns `true` (flat list membership), not `false`.

- [ ] **Step 3: Write minimal implementation**

In `auth.service.ts`, add the import and replace `getPermisos`/`canWrite`, adding `canRead`:

```typescript
import { AuthResponse, LoginRequest, NivelPermiso, Rol } from '../models/auth.model';
```

```typescript
  getPermisos(): Record<string, NivelPermiso> {
    try {
      return JSON.parse(localStorage.getItem('permisos') ?? '{}');
    } catch {
      return {};
    }
  }

  canRead(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return modulo in this.getPermisos();
  }

  canWrite(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return this.getPermisos()[modulo] === 'EDIT';
  }
```

(`login()`'s `localStorage.setItem('permisos', JSON.stringify(response.permisos ?? []))` needs the empty-list fallback changed to an empty object — change to `JSON.stringify(response.permisos ?? {})`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `ng test --watch=false --include='**/auth.service.spec.ts'` (from `soportedesk-frontend/`)
Expected: `6 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/core/auth/auth.service.ts soportedesk-frontend/src/app/core/auth/auth.service.spec.ts
git commit -m "feat: AuthService.canRead checks any nivel, canWrite requires EDIT"
```

---

## Phase 7 — Frontend: Sidebar y guards

### Task 22: Sidebar gates the 7 previously-always-visible items by `canRead`

**Files:**
- Modify: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts`
- Create: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.spec.ts`

**Interfaces:**
- Consumes: `AuthService.isAdmin()`, `AuthService.canRead(modulo)` (Task 21).

No spec exists today for `SidebarComponent` — this task creates the first one, covering `canShow()`.

- [ ] **Step 1: Write the failing test**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/auth/auth.service';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'canRead']);

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('hides a module item when the user lacks read access', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(false);

    const licencias = component.navItems.find((item) => item.path === '/licencias')!;

    expect(component.canShow(licencias)).toBe(false);
    expect(authService.canRead).toHaveBeenCalledWith('licencias');
  });

  it('shows a module item when the user has read access', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(true);

    const licencias = component.navItems.find((item) => item.path === '/licencias')!;

    expect(component.canShow(licencias)).toBe(true);
  });

  it('shows every item to an admin regardless of canRead', () => {
    authService.isAdmin.and.returnValue(true);
    authService.canRead.and.returnValue(false);

    const licencias = component.navItems.find((item) => item.path === '/licencias')!;
    const usuariosSistema = component.navItems.find((item) => item.path === '/usuarios-sistema')!;

    expect(component.canShow(licencias)).toBe(true);
    expect(component.canShow(usuariosSistema)).toBe(true);
  });

  it('always shows the dashboard item (no permission gate)', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(false);

    const dashboard = component.navItems.find((item) => item.path === '/dashboard')!;

    expect(component.canShow(dashboard)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `ng test --watch=false --include='**/sidebar.component.spec.ts'` (from `soportedesk-frontend/`)
Expected: FAIL — `licencias` nav item has no `permission` field yet, so `canShow` returns `true` unconditionally and `authService.canRead` is never called.

- [ ] **Step 3: Add `permission` to the 7 previously-ungated items and switch `canShow` to `canRead`**

In `sidebar.component.ts`, change the `navItems` array entries for the 7 modules that today have no `permission`:

```typescript
      { path: '/usuarios-red', label: 'Usuarios de Red/AD', icon: s.bypassSecurityTrustHtml(SVG_ICONS['users']), permission: 'usuarios-red' },
      { path: '/correos', label: 'Correos Institucionales', icon: s.bypassSecurityTrustHtml(SVG_ICONS['mail']), permission: 'correos' },
      { path: '/equipos', label: 'Equipos Asignados', icon: s.bypassSecurityTrustHtml(SVG_ICONS['monitor']), permission: 'equipos' },
      { path: '/vpn', label: 'VPN', icon: s.bypassSecurityTrustHtml(SVG_ICONS['lock']), permission: 'vpn' },
      { path: '/impresoras', label: 'Impresoras', icon: s.bypassSecurityTrustHtml(SVG_ICONS['printer']), permission: 'impresoras' },
      { path: '/wifi', label: 'Claves WiFi', icon: s.bypassSecurityTrustHtml(SVG_ICONS['wifi']), permission: 'wifi' },
      { path: '/licencias', label: 'Licencias', icon: s.bypassSecurityTrustHtml(SVG_ICONS['key']), permission: 'licencias' },
```

(`/dashboard`, `/usuarios-sistema`, `/catalogos` keep their current shape — dashboard has no gate, the other two are `adminOnly`.)

Change `canShow`:

```typescript
  canShow(item: NavItem): boolean {
    if (item.adminOnly) {
      return this.authService.isAdmin();
    }
    if (item.permission) {
      return this.authService.isAdmin() || this.authService.canRead(item.permission);
    }
    return true;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `ng test --watch=false --include='**/sidebar.component.spec.ts'` (from `soportedesk-frontend/`)
Expected: `4 specs, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts soportedesk-frontend/src/app/layout/sidebar/sidebar.component.spec.ts
git commit -m "feat: gate all 10 module sidebar items by canRead, not just 3"
```

---

### Task 23: Generic `moduloGuard` factory replaces the 3 near-identical guards

**Files:**
- Create: `soportedesk-frontend/src/app/core/auth/modulo.guard.ts`
- Create: `soportedesk-frontend/src/app/core/auth/modulo.guard.spec.ts`
- Delete: `soportedesk-frontend/src/app/features/auditoria/auditoria.guard.ts`
- Delete: `soportedesk-frontend/src/app/features/herramientas/herramientas.guard.ts`
- Delete: `soportedesk-frontend/src/app/features/inventario-equipos/inventario-equipos.guard.ts`

**Interfaces:**
- Consumes: `AuthService.isAdmin()`, `AuthService.canRead(modulo)` (Task 21).
- Produces: `moduloGuard(modulo: string): CanActivateFn`.

These three guard files have no existing spec files and are only imported from `app.routes.ts` (verified via repo-wide search) — safe to delete once `app.routes.ts` (Task 24) stops importing them.

- [ ] **Step 1: Write the failing test**

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { moduloGuard } from './modulo.guard';

describe('moduloGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'canRead']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows access when the user can read the module', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => moduloGuard('licencias')({} as any, {} as any));

    expect(result).toBe(true);
    expect(authService.canRead).toHaveBeenCalledWith('licencias');
  });

  it('allows access for admins regardless of canRead', () => {
    authService.isAdmin.and.returnValue(true);
    authService.canRead.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => moduloGuard('licencias')({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('redirects to dashboard and denies access without read permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => moduloGuard('licencias')({} as any, {} as any));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `ng test --watch=false --include='**/modulo.guard.spec.ts'` (from `soportedesk-frontend/`)
Expected: compile error — `modulo.guard.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const moduloGuard = (modulo: string): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin() || authService.canRead(modulo)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `ng test --watch=false --include='**/modulo.guard.spec.ts'` (from `soportedesk-frontend/`)
Expected: `3 specs, 0 failures`

- [ ] **Step 5: Commit (deletion of the 3 old guards happens together with Task 24, once `app.routes.ts` no longer imports them)**

```bash
git add soportedesk-frontend/src/app/core/auth/modulo.guard.ts soportedesk-frontend/src/app/core/auth/modulo.guard.spec.ts
git commit -m "feat: add generic moduloGuard factory"
```

---

### Task 24: Wire `moduloGuard` into `app.routes.ts` for all 10 module routes

**Files:**
- Modify: `soportedesk-frontend/src/app/app.routes.ts`
- Delete: `soportedesk-frontend/src/app/features/auditoria/auditoria.guard.ts`
- Delete: `soportedesk-frontend/src/app/features/herramientas/herramientas.guard.ts`
- Delete: `soportedesk-frontend/src/app/features/inventario-equipos/inventario-equipos.guard.ts`

**Interfaces:**
- Consumes: `moduloGuard(modulo: string): CanActivateFn` (Task 23).

This task is route wiring, not new logic — `moduloGuard` is already unit-tested (Task 23). Verification here is a manual route-activation check (Step 3), consistent with how the existing `auditoriaGuard`/`herramientasGuard`/`inventarioEquiposGuard` had no dedicated routing-level spec either.

- [ ] **Step 1: Update imports and route definitions**

In `app.routes.ts`, replace:

```typescript
import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { auditoriaGuard } from './features/auditoria/auditoria.guard';
import { herramientasGuard } from './features/herramientas/herramientas.guard';
import { inventarioEquiposGuard } from './features/inventario-equipos/inventario-equipos.guard';
import { ShellComponent } from './layout/shell/shell.component';
```

with:

```typescript
import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { moduloGuard } from './core/auth/modulo.guard';
import { ShellComponent } from './layout/shell/shell.component';
```

Then add `canActivate: [moduloGuard('<modulo>')]` to the 7 previously-unguarded module routes:

```typescript
      {
        path: 'licencias',
        canActivate: [moduloGuard('licencias')],
        loadComponent: () =>
          import('./features/licencias/licencias-list.component').then((m) => m.LicenciasListComponent),
      },
      {
        path: 'wifi',
        canActivate: [moduloGuard('wifi')],
        loadComponent: () =>
          import('./features/wifi/wifi-list.component').then((m) => m.WifiListComponent),
      },
      {
        path: 'equipos',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('./features/equipos/equipos-list.component').then((m) => m.EquiposListComponent),
      },
      {
        path: 'vpn',
        canActivate: [moduloGuard('vpn')],
        loadComponent: () =>
          import('./features/vpn/vpn-list.component').then((m) => m.VpnListComponent),
      },
      {
        path: 'correos',
        canActivate: [moduloGuard('correos')],
        loadComponent: () =>
          import('./features/correos/correos-list.component').then((m) => m.CorreosListComponent),
      },
      {
        path: 'usuarios-red',
        canActivate: [moduloGuard('usuarios-red')],
        loadComponent: () =>
          import('./features/usuarios-red/usuarios-red-list.component').then(
            (m) => m.UsuariosRedListComponent,
          ),
      },
      {
        path: 'impresoras',
        canActivate: [moduloGuard('impresoras')],
        loadComponent: () =>
          import('./features/impresoras/impresoras-list.component').then(
            (m) => m.ImpresorasListComponent,
          ),
      },
```

and replace the 3 existing module-specific guards on the routes that already had one:

```typescript
      {
        path: 'auditoria',
        canActivate: [moduloGuard('auditoria')],
        loadComponent: () =>
          import('./features/auditoria/auditoria.component').then((m) => m.AuditoriaComponent),
      },
      {
        path: 'herramientas',
        canActivate: [moduloGuard('herramientas')],
        loadComponent: () =>
          import('./features/herramientas/herramientas.component').then(
            (m) => m.HerramientasComponent,
          ),
      },
      {
        path: 'inventario-equipos',
        canActivate: [moduloGuard('inventario-equipos')],
        loadComponent: () =>
          import('./features/inventario-equipos/inventario-equipos.component').then(
            (m) => m.InventarioEquiposComponent,
          ),
      },
```

- [ ] **Step 2: Delete the 3 now-unused guard files**

```bash
git rm soportedesk-frontend/src/app/features/auditoria/auditoria.guard.ts soportedesk-frontend/src/app/features/herramientas/herramientas.guard.ts soportedesk-frontend/src/app/features/inventario-equipos/inventario-equipos.guard.ts
```

- [ ] **Step 3: Build to verify no dangling imports**

Run: `ng build --configuration development` (from `soportedesk-frontend/`)
Expected: `BUILD SUCCESS` with no "cannot find module" errors for the deleted guard files.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: gate all 10 module routes with moduloGuard, remove duplicated guards"
```

---

## Phase 8 — Frontend: formulario "Usuarios del Sistema"

### Task 25: `usuario-sistema.model.ts` — `permisos` becomes a `modulo -> nivel` map

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts`

**Interfaces:**
- Produces: `NivelPermiso = 'VIEW' | 'EDIT'`; `UsuarioSistema.permisos: Record<string, NivelPermiso>`; `UsuarioSistemaRequest.permisos: Record<string, NivelPermiso>`. `MODULOS`/`ModuloPermiso`/`PermisoKind` are unchanged — `kind: 'write'` modules support both nivel values, `kind: 'view'` modules only ever get `VIEW`.

No isolated test — this is a pure type change exercised by Task 26's component spec.

- [ ] **Step 1: Update the model**

```typescript
export interface UsuarioSistema {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  activo: boolean;
  permisos: Record<string, NivelPermiso>;
}

export interface UsuarioSistemaRequest {
  username: string;
  nombre: string;
  password?: string;
  activo: boolean;
  permisos: Record<string, NivelPermiso>;
}

export type NivelPermiso = 'VIEW' | 'EDIT';

export type PermisoKind = 'write' | 'view';

export interface ModuloPermiso {
  key: string;
  label: string;
  kind: PermisoKind;
  description?: string;
}

export const MODULOS: ModuloPermiso[] = [
  { key: 'usuarios-red', label: 'Usuarios de Red/AD', kind: 'write' },
  { key: 'correos', label: 'Correos Institucionales', kind: 'write' },
  { key: 'equipos', label: 'Equipos Asignados', kind: 'write' },
  { key: 'vpn', label: 'VPN', kind: 'write' },
  { key: 'credenciales-vpn', label: 'Credenciales VPN', kind: 'write' },
  { key: 'impresoras', label: 'Impresoras', kind: 'write' },
  { key: 'wifi', label: 'Claves WiFi', kind: 'write' },
  { key: 'licencias', label: 'Licencias', kind: 'write' },
  {
    key: 'auditoria',
    label: 'Vista de Movimientos',
    kind: 'view',
    description: 'Permite entrar al modulo Movimientos y revisar la auditoria del sistema.',
  },
  {
    key: 'herramientas',
    label: 'Herramientas',
    kind: 'view',
    description: 'Permite usar ping, inventario, GPU, RAM, teclado y mouse.',
  },
  {
    key: 'inventario-equipos',
    label: 'Inventario AD',
    kind: 'view',
    description: 'Permite revisar los equipos reportados por el agente y su estado de enlace.',
  },
];
```

(Only the two interfaces and the new `NivelPermiso` type changed; `PermisoKind`, `ModuloPermiso`, and `MODULOS` are unchanged from today — shown here in full per the plan's no-placeholder rule.)

- [ ] **Step 2: Commit together with Task 26**

This file alone won't compile against the still-unmodified component (Task 26) — proceed directly; the commit at the end of Task 26 covers both.

---

### Task 26: 3-state selector (Sin acceso / Vista / Edición) in the form

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-sistema/usuarios-sistema.component.ts`
- Modify: `soportedesk-frontend/src/app/features/usuarios-sistema/usuarios-sistema.component.html`
- Modify: `soportedesk-frontend/src/app/features/usuarios-sistema/usuarios-sistema.component.spec.ts`

**Interfaces:**
- Consumes: `NivelPermiso`, `MODULOS` (Task 25).
- Produces: `UsuariosSistemaComponent.nivelDe(key): NivelPermiso | null`; `.setNivel(key, nivel: NivelPermiso | null): void`; `.hasVista(key): boolean`; `.toggleVista(key): void`; `.permisoKeys(permisos): string[]`.

- [ ] **Step 1: Write the failing tests**

Replace `usuarios-sistema.component.spec.ts` entirely:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UsuariosSistemaComponent } from './usuarios-sistema.component';
import { UsuarioSistemaService } from './usuario-sistema.service';
import { UsuarioSistema, UsuarioSistemaRequest } from './usuario-sistema.model';

describe('UsuariosSistemaComponent', () => {
  let fixture: ComponentFixture<UsuariosSistemaComponent>;
  let service: jasmine.SpyObj<UsuarioSistemaService>;

  const usuario: UsuarioSistema = {
    id: 7,
    username: 'soporte01',
    nombre: 'Soporte Uno',
    rol: 'SOPORTE',
    activo: true,
    permisos: { vpn: 'EDIT' },
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<UsuarioSistemaService>('UsuarioSistemaService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    service.getAll.and.returnValue(of([usuario]));
    service.update.and.returnValue(of({ ...usuario, permisos: { vpn: 'EDIT', auditoria: 'VIEW' } }));

    TestBed.configureTestingModule({
      imports: [UsuariosSistemaComponent],
      providers: [{ provide: UsuarioSistemaService, useValue: service }],
    });

    fixture = TestBed.createComponent(UsuariosSistemaComponent);
    fixture.detectChanges();
  });

  it('permite agregar Vista de Movimientos al actualizar permisos de un usuario', () => {
    const editButton = fixture.debugElement.query(By.css('.edit-btn'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const auditCheckbox = fixture.debugElement
      .queryAll(By.css('.permiso-check'))
      .find((el) => el.nativeElement.textContent.includes('Vista de Movimientos'))
      ?.query(By.css('input'));

    expect(auditCheckbox).toBeTruthy();
    auditCheckbox!.nativeElement.checked = true;
    auditCheckbox!.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    const request = service.update.calls.mostRecent().args[1] as UsuarioSistemaRequest;
    expect(service.update).toHaveBeenCalledWith(
      7,
      jasmine.objectContaining({ permisos: jasmine.objectContaining({ vpn: 'EDIT', auditoria: 'VIEW' }) }),
    );
    expect(request.permisos['auditoria']).toBe('VIEW');
  });

  it('permite asignar nivel de edicion a un modulo mediante el selector de 3 opciones', () => {
    const editButton = fixture.debugElement.query(By.css('.edit-btn'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const editRadio = fixture.debugElement.query(By.css('input[data-modulo="licencias"][data-nivel="EDIT"]'));
    expect(editRadio).toBeTruthy();
    editRadio.nativeElement.checked = true;
    editRadio.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    expect(service.update).toHaveBeenCalledWith(
      7,
      jasmine.objectContaining({ permisos: jasmine.objectContaining({ licencias: 'EDIT' }) }),
    );
  });

  it('quitar el nivel de un modulo de edicion elimina la clave del mapa de permisos', () => {
    const editButton = fixture.debugElement.query(By.css('.edit-btn'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const sinAccesoRadio = fixture.debugElement.query(By.css('input[data-modulo="vpn"][data-nivel="NONE"]'));
    expect(sinAccesoRadio).toBeTruthy();
    sinAccesoRadio.nativeElement.checked = true;
    sinAccesoRadio.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    const request = service.update.calls.mostRecent().args[1] as UsuarioSistemaRequest;
    expect(request.permisos['vpn']).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `ng test --watch=false --include='**/usuarios-sistema.component.spec.ts'` (from `soportedesk-frontend/`)
Expected: compile error or failures — `data-modulo`/`data-nivel` attributes don't exist on the current single-checkbox template, and `form.permisos` is still a `string[]`.

- [ ] **Step 3: Update the component**

In `usuarios-sistema.component.ts`, replace `togglePermiso`/`hasPermiso` and `emptyForm`/`openEdit`'s permisos handling:

```typescript
  nivelDe(key: string): NivelPermiso | null {
    return this.form.permisos[key] ?? null;
  }

  setNivel(key: string, nivel: NivelPermiso | null): void {
    if (nivel === null) {
      delete this.form.permisos[key];
    } else {
      this.form.permisos[key] = nivel;
    }
  }

  hasVista(key: string): boolean {
    return key in this.form.permisos;
  }

  toggleVista(key: string): void {
    if (this.hasVista(key)) {
      delete this.form.permisos[key];
    } else {
      this.form.permisos[key] = 'VIEW';
    }
  }

  permisoKeys(permisos: Record<string, NivelPermiso>): string[] {
    return Object.keys(permisos);
  }

  moduloLabel(key: string): string {
    return this.modulos.find((m) => m.key === key)?.label ?? key;
  }
```

Update the import line and `openEdit`/`emptyForm`:

```typescript
import { MODULOS, NivelPermiso, UsuarioSistema, UsuarioSistemaRequest } from './usuario-sistema.model';
```

```typescript
  openEdit(u: UsuarioSistema): void {
    this.editingId = u.id;
    this.form = {
      username: u.username,
      nombre: u.nombre,
      password: '',
      activo: u.activo,
      permisos: { ...u.permisos },
    };
    this.formOpen = true;
  }
```

```typescript
  private emptyForm(): UsuarioSistemaRequest {
    return { username: '', nombre: '', password: '', activo: true, permisos: {} };
  }
```

- [ ] **Step 4: Update the template**

In `usuarios-sistema.component.html`, replace the "Permisos de edicion" subsection:

```html
      <div class="permisos-subsection">
        <span class="permisos-subtitle">Permisos de edicion</span>
        <div class="permisos-grid">
          <label class="permiso-check" *ngFor="let m of modulosEdicion">
            <input type="checkbox" [checked]="hasPermiso(m.key)" (change)="togglePermiso(m.key)" />
            <span>{{ m.label }}</span>
          </label>
        </div>
      </div>
```

with:

```html
      <div class="permisos-subsection">
        <span class="permisos-subtitle">Permisos de edicion</span>
        <div class="permisos-rows">
          <div class="permiso-row" *ngFor="let m of modulosEdicion">
            <span class="permiso-label">{{ m.label }}</span>
            <div class="nivel-options">
              <label class="nivel-option">
                <input type="radio" [attr.data-modulo]="m.key" data-nivel="NONE"
                       [checked]="nivelDe(m.key) === null" (change)="setNivel(m.key, null)" />
                <span>Sin acceso</span>
              </label>
              <label class="nivel-option">
                <input type="radio" [attr.data-modulo]="m.key" data-nivel="VIEW"
                       [checked]="nivelDe(m.key) === 'VIEW'" (change)="setNivel(m.key, 'VIEW')" />
                <span>Vista</span>
              </label>
              <label class="nivel-option">
                <input type="radio" [attr.data-modulo]="m.key" data-nivel="EDIT"
                       [checked]="nivelDe(m.key) === 'EDIT'" (change)="setNivel(m.key, 'EDIT')" />
                <span>Edicion</span>
              </label>
            </div>
          </div>
        </div>
      </div>
```

Replace the "Permisos de vista" subsection's checkbox bindings (structure stays the same, only the binding target changes):

```html
          <label class="permiso-check permiso-check--featured" *ngFor="let m of modulosVista">
            <input type="checkbox" [checked]="hasPermiso(m.key)" (change)="togglePermiso(m.key)" />
```

with:

```html
          <label class="permiso-check permiso-check--featured" *ngFor="let m of modulosVista">
            <input type="checkbox" [checked]="hasVista(m.key)" (change)="toggleVista(m.key)" />
```

Replace the table's "Permisos asignados" column body:

```html
        <td>
          <div class="permisos-tags">
            <ng-container *ngIf="u.permisos.length > 0; else sinPermisos">
              <span class="tag" *ngFor="let p of u.permisos">{{ moduloLabel(p) }}</span>
            </ng-container>
            <ng-template #sinPermisos>
              <span class="sin-permisos">Solo lectura</span>
            </ng-template>
          </div>
        </td>
```

with:

```html
        <td>
          <div class="permisos-tags">
            <ng-container *ngIf="permisoKeys(u.permisos).length > 0; else sinPermisos">
              <span class="tag" *ngFor="let p of permisoKeys(u.permisos)" [class.tag--view]="u.permisos[p] === 'VIEW'">
                {{ moduloLabel(p) }} <small>{{ u.permisos[p] === 'EDIT' ? 'Edicion' : 'Vista' }}</small>
              </span>
            </ng-container>
            <ng-template #sinPermisos>
              <span class="sin-permisos">Sin modulos asignados</span>
            </ng-template>
          </div>
        </td>
```

(The "Solo lectura" copy was misleading after this change — with zero permisos a user now has zero module access, not read-only access to everything.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `ng test --watch=false --include='**/usuarios-sistema.component.spec.ts'` (from `soportedesk-frontend/`)
Expected: `3 specs, 0 failures`

- [ ] **Step 6: Commit (covers Task 25 + Task 26)**

```bash
git add soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts soportedesk-frontend/src/app/features/usuarios-sistema/usuarios-sistema.component.ts soportedesk-frontend/src/app/features/usuarios-sistema/usuarios-sistema.component.html soportedesk-frontend/src/app/features/usuarios-sistema/usuarios-sistema.component.spec.ts
git commit -m "feat: 3-state nivel selector (sin acceso/vista/edicion) in Usuarios del Sistema form"
```

---

## Phase 9 — Verificación manual

### Task 27: Build completo, suite de tests y smoke test manual

**Files:** none (verification only).

- [ ] **Step 1: Full backend test run**

Run (from `soportedesk-backend/`): `mvn verify -Dmaven.test.failure.ignore=true`
Expected: review `target/surefire-reports/` and `target/failsafe-reports/` — every `*Test`/`*ServiceTest`/`*ControllerIT`/`*ServiceIT` touched in this plan passes. The pre-existing `UsuarioRepositoryTest` Surefire failure (documented in project memory, unrelated to this work) is expected and does not block Failsafe from running.

- [ ] **Step 2: Full frontend test run**

Run (from `soportedesk-frontend/`): `ng test --watch=false`
Expected: all specs pass, including the new/updated ones from Tasks 20–26.

- [ ] **Step 3: Frontend production build**

Run (from `soportedesk-frontend/`): `ng build`
Expected: `BUILD SUCCESS`, no missing-import errors from the deleted guard files (Task 24).

- [ ] **Step 4: Restart the backend and manually verify the new behavior**

1. Restart `soportedesk-backend` (stop the running process on port 8080, start it again so the new JWT/authority logic is loaded).
2. Log in as `admin`, open **Usuarios del Sistema**, edit an existing soporte user: set one módulo to "Vista", one to "Edición", and one to "Sin acceso". Save.
3. Log out, log in as that soporte user.
4. Confirm in the sidebar: the "Sin acceso" módulo is **not** in the menu; the "Vista" módulo is visible but its edit/delete controls are inactive (existing `canWrite`-driven UI, unchanged); the "Edición" módulo allows full CRUD.
5. Try navigating directly to the "Sin acceso" módulo's URL — confirm the guard redirects to `/dashboard`.
6. If that soporte user has `vpn` access but not `credenciales-vpn`, open the VPN list and confirm `usuarioVpn`/`credencialVpn` show as empty/blank, not the real stored values.

- [ ] **Step 5: Report results to the user**

Summarize pass/fail for each step above before considering this plan complete — do not claim success without having actually run these checks.
