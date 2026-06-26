# SoporteDesk INIA Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Spring Boot REST API backend for SoporteDesk INIA: JWT auth, catalogs (sedes/dependencias/subdependencias/tipos de contrato), and the 8 functional modules (licencias, correos, usuarios_red, vpn, wifi, equipos, impresoras, dashboard), backed by MySQL.

**Architecture:** Layered Spring Boot app (Controller → Service → Repository with Spring Data JPA), Spring Security + JWT for stateless auth, role-based authorization (`ADMIN` / `SOPORTE`) via `@PreAuthorize`. Each functional module follows the same CRUD pattern: Entity, Repository (with a `search` query), Request DTO, Service, Controller, plus unit/integration tests.

**Tech Stack:** Java 17, Spring Boot 3.2.x (Web, Data JPA, Security, Validation), MySQL (dev), H2 (test), Lombok, JJWT 0.11.5, JUnit 5 + Mockito + spring-security-test.

---

## Reference: project location

All backend code lives in `soportedesk-backend/` at the repository root
(`c:\SistemadeSoporteTecnicoINIA\soportedesk-backend`). Base package:
`com.inia.soportedesk`.

## Reference: common conventions used across modules

- Every module entity has a Lombok `@Getter @Setter @NoArgsConstructor
  @AllArgsConstructor` and `@Entity`/`@Table`.
- Every module has a `XxxRequest` DTO with Bean Validation annotations, used
  for create/update.
- Every repository extends `JpaRepository<Entity, Long>` and adds a
  `search(String search)` JPQL query over its relevant text fields
  (case-insensitive `LIKE`).
- Every service: `findAll(String search)`, `findById(Long id)`,
  `create(XxxRequest)`, `update(Long id, XxxRequest)`, `delete(Long id)`.
  `findById` throws `ResourceNotFoundException` (Task 6) if not found.
- Every controller: `GET /api/{modulo}` (any authenticated user, optional
  `?search=`), `GET /api/{modulo}/{id}`, `POST` / `PUT` / `DELETE` restricted
  to `ADMIN` via `@PreAuthorize("hasRole('ADMIN')")`.

---

## Task 1: Project setup (Maven, config, main class)

**Files:**
- Create: `soportedesk-backend/pom.xml`
- Create: `soportedesk-backend/src/main/resources/application.yml`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/SoportedeskApplication.java`
- Create: `soportedesk-backend/src/test/resources/application.yml`

- [ ] **Step 1: Create `pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
    <relativePath/>
  </parent>

  <groupId>com.inia</groupId>
  <artifactId>soportedesk-backend</artifactId>
  <version>0.1.0</version>
  <packaging>jar</packaging>

  <properties>
    <java.version>17</java.version>
    <jjwt.version>0.11.5</jjwt.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-api</artifactId>
      <version>${jjwt.version}</version>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-impl</artifactId>
      <version>${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-jackson</artifactId>
      <version>${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.security</groupId>
      <artifactId>spring-security-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <excludes>
            <exclude>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
            </exclude>
          </excludes>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

- [ ] **Step 2: Create `src/main/resources/application.yml`**

```yaml
spring:
  application:
    name: soportedesk-backend
  profiles:
    active: dev
  jpa:
    open-in-view: false
    defer-datasource-initialization: true
    hibernate:
      ddl-auto: update
    show-sql: false

server:
  port: 8080

jwt:
  secret: c29wb3J0ZWRlc2staW5pYS1zZWNyZXQta2V5LWNoYW5nZS1pbi1wcm9kdWNjaW9uLTEyMzQ1Ng==
  expiration-ms: 86400000

uploads:
  drivers-dir: uploads/drivers

---
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:mysql://localhost:3306/soportedesk_inia?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
```

- [ ] **Step 3: Create `src/test/resources/application.yml`**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
    username: sa
    password: ""
  jpa:
    hibernate:
      ddl-auto: create-drop
    defer-datasource-initialization: true

jwt:
  secret: c29wb3J0ZWRlc2staW5pYS1zZWNyZXQta2V5LWNoYW5nZS1pbi1wcm9kdWNjaW9uLTEyMzQ1Ng==
  expiration-ms: 86400000

uploads:
  drivers-dir: build/test-uploads/drivers
```

- [ ] **Step 4: Create main application class**

`soportedesk-backend/src/main/java/com/inia/soportedesk/SoportedeskApplication.java`

```java
package com.inia.soportedesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SoportedeskApplication {
    public static void main(String[] args) {
        SpringApplication.run(SoportedeskApplication.class, args);
    }
}
```

- [ ] **Step 5: Verify the project builds**

Run: `cd soportedesk-backend && mvn -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend
git commit -m "chore: scaffold Spring Boot backend project"
```

---

## Task 2: Usuario entity, Rol enum, repository, seed admin user

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Rol.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Usuario.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioRepository.java`
- Create: `soportedesk-backend/src/main/resources/data.sql`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/UsuarioRepositoryTest.java`

- [ ] **Step 1: Create `Rol` enum**

```java
package com.inia.soportedesk.auth;

public enum Rol {
    ADMIN,
    SOPORTE
}
```

- [ ] **Step 2: Create `Usuario` entity**

```java
package com.inia.soportedesk.auth;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;

    @Column(nullable = false)
    private boolean activo = true;
}
```

- [ ] **Step 3: Create `UsuarioRepository`**

```java
package com.inia.soportedesk.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
}
```

- [ ] **Step 4: Create `data.sql` to seed the admin user**

The password hash below is the BCrypt hash of `admin123`.

```sql
INSERT INTO usuarios (username, password_hash, nombre, rol, activo)
SELECT 'admin', '$2a$10$Wb1iIJ3F3vd9bsZIc0KQfu4nctcPGwl9hzKkfsZbttRXAEbCpUPYi', 'Administrador TI', 'ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin');

INSERT INTO usuarios (username, password_hash, nombre, rol, activo)
SELECT 'soporte', '$2a$10$Wb1iIJ3F3vd9bsZIc0KQfu4nctcPGwl9hzKkfsZbttRXAEbCpUPYi', 'Mesa de Soporte', 'SOPORTE', true
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'soporte');
```

Both seed users have password `admin123` — to be changed after first login.

- [ ] **Step 5: Write repository test**

```java
package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UsuarioRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private UsuarioRepository repository;

    @Test
    void findByUsername_returnsSeededAdmin() {
        var found = repository.findByUsername("admin");

        assertThat(found).isPresent();
        assertThat(found.get().getRol()).isEqualTo(Rol.ADMIN);
        assertThat(found.get().isActivo()).isTrue();
    }

    @Test
    void findByUsername_returnsEmptyForUnknownUser() {
        assertThat(repository.findByUsername("nope")).isEmpty();
    }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=UsuarioRepositoryTest test`
Expected: `BUILD SUCCESS`, both tests pass (the `data.sql` seed runs against the H2
test database thanks to `defer-datasource-initialization: true`).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auth soportedesk-backend/src/main/resources/data.sql soportedesk-backend/src/test/java/com/inia/soportedesk/auth
git commit -m "feat: add Usuario entity, repository and seed admin/soporte users"
```

---

## Task 3: JwtService (generate/validate tokens)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/security/JwtService.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/security/JwtServiceTest.java`

- [ ] **Step 1: Write failing test**

```java
package com.inia.soportedesk.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

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
        String token = jwtService.generateToken("jperez", "ADMIN");

        assertThat(jwtService.extractUsername(token)).isEqualTo("jperez");
        assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN");
        assertThat(jwtService.isTokenValid(token, "jperez")).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForDifferentUsername() {
        String token = jwtService.generateToken("jperez", "ADMIN");

        assertThat(jwtService.isTokenValid(token, "otro")).isFalse();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=JwtServiceTest test`
Expected: FAIL — `JwtService` class does not exist.

- [ ] **Step 3: Implement `JwtService`**

```java
package com.inia.soportedesk.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);

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

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public boolean isTokenValid(String token, String username) {
        return extractUsername(token).equals(username) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return resolver.apply(claims);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=JwtServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/security/JwtService.java soportedesk-backend/src/test/java/com/inia/soportedesk/security/JwtServiceTest.java
git commit -m "feat: add JwtService for generating and validating JWTs"
```

---

## Task 4: Security configuration (UserDetailsService, JwtAuthFilter, SecurityConfig)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/security/CustomUserDetailsService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/security/JwtAuthFilter.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/security/SecurityConfig.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/security/CustomUserDetailsServiceTest.java`

- [ ] **Step 1: Write failing test for `CustomUserDetailsService`**

```java
package com.inia.soportedesk.security;

import com.inia.soportedesk.auth.Rol;
import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    @Test
    void loadUserByUsername_returnsUserDetailsWithRole() {
        Usuario usuario = new Usuario(1L, "jperez", "hashed", "Juan Perez", Rol.ADMIN, true);
        when(usuarioRepository.findByUsername("jperez")).thenReturn(Optional.of(usuario));

        UserDetails userDetails = userDetailsService.loadUserByUsername("jperez");

        assertThat(userDetails.getUsername()).isEqualTo("jperez");
        assertThat(userDetails.getPassword()).isEqualTo("hashed");
        assertThat(userDetails.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void loadUserByUsername_throwsWhenNotFound() {
        when(usuarioRepository.findByUsername("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("nope"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=CustomUserDetailsServiceTest test`
Expected: FAIL — `CustomUserDetailsService` does not exist.

- [ ] **Step 3: Implement `CustomUserDetailsService`**

```java
package com.inia.soportedesk.security;

import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        return new User(
                usuario.getUsername(),
                usuario.getPasswordHash(),
                usuario.isActivo(),
                true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()))
        );
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=CustomUserDetailsServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Implement `JwtAuthFilter`**

```java
package com.inia.soportedesk.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 6: Implement `SecurityConfig`**

```java
package com.inia.soportedesk.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

- [ ] **Step 7: Verify the project still builds**

Run: `cd soportedesk-backend && mvn -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/security soportedesk-backend/src/test/java/com/inia/soportedesk/security
git commit -m "feat: configure Spring Security with JWT authentication"
```

---

## Task 5: AuthController (login, /me)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/LoginRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/AuthResponse.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/AuthController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/AuthControllerIT.java`

- [ ] **Step 1: Create `LoginRequest` DTO**

```java
package com.inia.soportedesk.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;
}
```

- [ ] **Step 2: Create `AuthResponse` DTO**

```java
package com.inia.soportedesk.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String nombre;
    private String rol;
}
```

- [ ] **Step 3: Write failing integration test**

```java
package com.inia.soportedesk.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void login_withValidCredentials_returnsToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("admin123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username", is("admin")))
                .andExpect(jsonPath("$.rol", is("ADMIN")));
    }

    @Test
    void login_withInvalidCredentials_returns401() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=AuthControllerIT test`
Expected: FAIL — `AuthController` does not exist (404 on `/api/auth/login`).

- [ ] **Step 5: Implement `AuthController`**

```java
package com.inia.soportedesk.auth;

import com.inia.soportedesk.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuario o contraseña incorrectos"));
        }

        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado en BD"));

        String token = jwtService.generateToken(usuario.getUsername(), usuario.getRol().name());

        return ResponseEntity.ok(new AuthResponse(token, usuario.getUsername(), usuario.getNombre(), usuario.getRol().name()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado en BD"));

        return ResponseEntity.ok(new AuthResponse(null, usuario.getUsername(), usuario.getNombre(), usuario.getRol().name()));
    }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=AuthControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auth soportedesk-backend/src/test/java/com/inia/soportedesk/auth
git commit -m "feat: add login and /me endpoints returning JWT"
```

---

## Task 6: Global exception handling

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/exception/ResourceNotFoundException.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/exception/ApiError.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/exception/GlobalExceptionHandler.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/exception/GlobalExceptionHandlerTest.java`

- [ ] **Step 1: Create `ResourceNotFoundException`**

```java
package com.inia.soportedesk.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

- [ ] **Step 2: Create `ApiError` DTO**

```java
package com.inia.soportedesk.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@AllArgsConstructor
public class ApiError {
    private LocalDateTime timestamp;
    private int status;
    private String message;
    private Map<String, String> errors;
}
```

- [ ] **Step 3: Write failing test for `GlobalExceptionHandler`**

```java
package com.inia.soportedesk.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFound_returns404WithMessage() {
        ResponseEntity<ApiError> response =
                handler.handleNotFound(new ResourceNotFoundException("Licencia no encontrada: 99"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getMessage()).isEqualTo("Licencia no encontrada: 99");
    }

    @Test
    void handleBadCredentials_returns401() {
        ResponseEntity<ApiError> response =
                handler.handleBadCredentials(new BadCredentialsException("Usuario o contraseña incorrectos"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().getMessage()).isEqualTo("Usuario o contraseña incorrectos");
    }
}
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=GlobalExceptionHandlerTest test`
Expected: FAIL — `GlobalExceptionHandler` does not exist.

- [ ] **Step 5: Implement `GlobalExceptionHandler`**

```java
package com.inia.soportedesk.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        ApiError error = new ApiError(LocalDateTime.now(), HttpStatus.NOT_FOUND.value(), ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> errors.put(fe.getField(), fe.getDefaultMessage()));

        ApiError error = new ApiError(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "Error de validación", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
        ApiError error = new ApiError(LocalDateTime.now(), HttpStatus.UNAUTHORIZED.value(), ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=GlobalExceptionHandlerTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/exception soportedesk-backend/src/test/java/com/inia/soportedesk/exception
git commit -m "feat: add global exception handler with ApiError response"
```

---

## Task 7: Catálogo — Sedes

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/Sede.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SedeRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SedeRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SedeService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SedeController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/SedeServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/SedeControllerIT.java`

- [ ] **Step 1: Create `Sede` entity**

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sedes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Sede {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;
}
```

- [ ] **Step 2: Create `SedeRequest` DTO**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SedeRequest {

    @NotBlank
    private String nombre;
}
```

- [ ] **Step 3: Create `SedeRepository`**

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SedeRepository extends JpaRepository<Sede, Long> {

    @Query("SELECT s FROM Sede s WHERE LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Sede> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `SedeService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SedeServiceTest {

    @Mock
    private SedeRepository repository;

    @InjectMocks
    private SedeService service;

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Sede(1L, "Lima")));

        List<Sede> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withSearch_usesSearchQuery() {
        when(repository.search("lima")).thenReturn(List.of(new Sede(1L, "Lima")));

        List<Sede> result = service.findAll("lima");

        assertThat(result).hasSize(1);
        verify(repository).search("lima");
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesSedeFromRequest() {
        SedeRequest request = new SedeRequest();
        request.setNombre("Lima");
        when(repository.save(any(Sede.class))).thenAnswer(inv -> inv.getArgument(0));

        Sede result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Lima");
    }

    @Test
    void delete_removesExistingSede() {
        Sede sede = new Sede(1L, "Lima");
        when(repository.findById(1L)).thenReturn(Optional.of(sede));

        service.delete(1L);

        verify(repository).delete(sede);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=SedeServiceTest test`
Expected: FAIL — `SedeService` does not exist.

- [ ] **Step 6: Implement `SedeService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SedeService {

    private final SedeRepository repository;

    public List<Sede> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Sede findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + id));
    }

    public Sede create(SedeRequest request) {
        Sede sede = new Sede();
        sede.setNombre(request.getNombre());
        return repository.save(sede);
    }

    public Sede update(Long id, SedeRequest request) {
        Sede sede = findById(id);
        sede.setNombre(request.getNombre());
        return repository.save(sede);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=SedeServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SedeControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SedeService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Sede(1L, "Lima")));

        mockMvc.perform(get("/api/catalogos/sedes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("Lima")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        SedeRequest request = new SedeRequest();
        request.setNombre("Lima");

        mockMvc.perform(post("/api/catalogos/sedes")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        SedeRequest request = new SedeRequest();
        request.setNombre("Lima");
        when(service.create(any())).thenReturn(new Sede(1L, "Lima"));

        mockMvc.perform(post("/api/catalogos/sedes")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("Lima")));
    }

    @Test
    void findAll_withoutAuthentication_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/catalogos/sedes"))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=SedeControllerIT test`
Expected: FAIL — `SedeController` does not exist (404s on `/api/catalogos/sedes`).

- [ ] **Step 10: Implement `SedeController`**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/sedes")
@RequiredArgsConstructor
public class SedeController {

    private final SedeService service;

    @GetMapping
    public List<Sede> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Sede findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Sede> create(@Valid @RequestBody SedeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Sede update(@PathVariable Long id, @Valid @RequestBody SedeRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=SedeControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo
git commit -m "feat: add Sedes catalog CRUD endpoints"
```

---

## Task 8: Catálogo — Dependencias (FK a Sede)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/Dependencia.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/DependenciaRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/DependenciaRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/DependenciaService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/DependenciaController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/DependenciaServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/DependenciaControllerIT.java`

- [ ] **Step 1: Create `Dependencia` entity**

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dependencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Dependencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id", nullable = false)
    private Sede sede;
}
```

- [ ] **Step 2: Create `DependenciaRequest` DTO**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DependenciaRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private Long sedeId;
}
```

- [ ] **Step 3: Create `DependenciaRepository`**

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DependenciaRepository extends JpaRepository<Dependencia, Long> {

    List<Dependencia> findBySedeId(Long sedeId);

    @Query("SELECT d FROM Dependencia d WHERE LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Dependencia> search(@Param("search") String search);

    @Query("SELECT d FROM Dependencia d WHERE d.sede.id = :sedeId AND LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Dependencia> searchBySedeId(@Param("sedeId") Long sedeId, @Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `DependenciaService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DependenciaServiceTest {

    @Mock
    private DependenciaRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @InjectMocks
    private DependenciaService service;

    @Test
    void findAll_withSedeIdOnly_usesFindBySedeId() {
        when(repository.findBySedeId(1L)).thenReturn(List.of(new Dependencia(1L, "TI", new Sede(1L, "Lima"))));

        List<Dependencia> result = service.findAll(1L, null);

        assertThat(result).hasSize(1);
        verify(repository).findBySedeId(1L);
    }

    @Test
    void findAll_withoutFilters_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Dependencia(1L, "TI", new Sede(1L, "Lima"))));

        List<Dependencia> result = service.findAll(null, null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void create_resolvesSedeAndSaves() {
        Sede sede = new Sede(1L, "Lima");
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sede));
        when(repository.save(any(Dependencia.class))).thenAnswer(inv -> inv.getArgument(0));

        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(1L);

        Dependencia result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("TI");
        assertThat(result.getSede()).isEqualTo(sede);
    }

    @Test
    void create_withUnknownSedeId_throwsResourceNotFoundException() {
        when(sedeRepository.findById(99L)).thenReturn(Optional.empty());

        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=DependenciaServiceTest test`
Expected: FAIL — `DependenciaService` does not exist.

- [ ] **Step 6: Implement `DependenciaService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DependenciaService {

    private final DependenciaRepository repository;
    private final SedeRepository sedeRepository;

    public List<Dependencia> findAll(Long sedeId, String search) {
        boolean hasSearch = search != null && !search.isBlank();

        if (sedeId != null && hasSearch) {
            return repository.searchBySedeId(sedeId, search);
        }
        if (sedeId != null) {
            return repository.findBySedeId(sedeId);
        }
        if (hasSearch) {
            return repository.search(search);
        }
        return repository.findAll();
    }

    public Dependencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + id));
    }

    public Dependencia create(DependenciaRequest request) {
        Dependencia dependencia = new Dependencia();
        dependencia.setNombre(request.getNombre());
        dependencia.setSede(resolveSede(request.getSedeId()));
        return repository.save(dependencia);
    }

    public Dependencia update(Long id, DependenciaRequest request) {
        Dependencia dependencia = findById(id);
        dependencia.setNombre(request.getNombre());
        dependencia.setSede(resolveSede(request.getSedeId()));
        return repository.save(dependencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private Sede resolveSede(Long sedeId) {
        return sedeRepository.findById(sedeId)
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + sedeId));
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=DependenciaServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class DependenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DependenciaService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_filtersBySedeId() throws Exception {
        when(service.findAll(1L, null)).thenReturn(List.of(new Dependencia(1L, "TI", new Sede(1L, "Lima"))));

        mockMvc.perform(get("/api/catalogos/dependencias").param("sedeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("TI")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(1L);

        mockMvc.perform(post("/api/catalogos/dependencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        DependenciaRequest request = new DependenciaRequest();
        request.setNombre("TI");
        request.setSedeId(1L);
        when(service.create(any())).thenReturn(new Dependencia(1L, "TI", new Sede(1L, "Lima")));

        mockMvc.perform(post("/api/catalogos/dependencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("TI")));
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=DependenciaControllerIT test`
Expected: FAIL — `DependenciaController` does not exist.

- [ ] **Step 10: Implement `DependenciaController`**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/dependencias")
@RequiredArgsConstructor
public class DependenciaController {

    private final DependenciaService service;

    @GetMapping
    public List<Dependencia> findAll(@RequestParam(required = false) Long sedeId,
                                      @RequestParam(required = false) String search) {
        return service.findAll(sedeId, search);
    }

    @GetMapping("/{id}")
    public Dependencia findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Dependencia> create(@Valid @RequestBody DependenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Dependencia update(@PathVariable Long id, @Valid @RequestBody DependenciaRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=DependenciaControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo
git commit -m "feat: add Dependencias catalog CRUD endpoints"
```

---

## Task 9: Catálogo — Subdependencias (FK a Dependencia)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/Subdependencia.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SubdependenciaRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SubdependenciaRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SubdependenciaService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/SubdependenciaController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/SubdependenciaServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/SubdependenciaControllerIT.java`

This module mirrors Task 8 exactly, but `Subdependencia` belongs to a
`Dependencia` instead of a `Sede`.

- [ ] **Step 1: Create `Subdependencia` entity**

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "subdependencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Subdependencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id", nullable = false)
    private Dependencia dependencia;
}
```

- [ ] **Step 2: Create `SubdependenciaRequest` DTO**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubdependenciaRequest {

    @NotBlank
    private String nombre;

    @NotNull
    private Long dependenciaId;
}
```

- [ ] **Step 3: Create `SubdependenciaRepository`**

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubdependenciaRepository extends JpaRepository<Subdependencia, Long> {

    List<Subdependencia> findByDependenciaId(Long dependenciaId);

    @Query("SELECT s FROM Subdependencia s WHERE LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Subdependencia> search(@Param("search") String search);

    @Query("SELECT s FROM Subdependencia s WHERE s.dependencia.id = :dependenciaId AND LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Subdependencia> searchByDependenciaId(@Param("dependenciaId") Long dependenciaId, @Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `SubdependenciaService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubdependenciaServiceTest {

    @Mock
    private SubdependenciaRepository repository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @InjectMocks
    private SubdependenciaService service;

    @Test
    void findAll_withDependenciaIdOnly_usesFindByDependenciaId() {
        Dependencia dependencia = new Dependencia(1L, "TI", new Sede(1L, "Lima"));
        when(repository.findByDependenciaId(1L)).thenReturn(List.of(new Subdependencia(1L, "Soporte", dependencia)));

        List<Subdependencia> result = service.findAll(1L, null);

        assertThat(result).hasSize(1);
        verify(repository).findByDependenciaId(1L);
    }

    @Test
    void create_resolvesDependenciaAndSaves() {
        Dependencia dependencia = new Dependencia(1L, "TI", new Sede(1L, "Lima"));
        when(dependenciaRepository.findById(1L)).thenReturn(Optional.of(dependencia));
        when(repository.save(any(Subdependencia.class))).thenAnswer(inv -> inv.getArgument(0));

        SubdependenciaRequest request = new SubdependenciaRequest();
        request.setNombre("Soporte");
        request.setDependenciaId(1L);

        Subdependencia result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Soporte");
        assertThat(result.getDependencia()).isEqualTo(dependencia);
    }

    @Test
    void create_withUnknownDependenciaId_throwsResourceNotFoundException() {
        when(dependenciaRepository.findById(99L)).thenReturn(Optional.empty());

        SubdependenciaRequest request = new SubdependenciaRequest();
        request.setNombre("Soporte");
        request.setDependenciaId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=SubdependenciaServiceTest test`
Expected: FAIL — `SubdependenciaService` does not exist.

- [ ] **Step 6: Implement `SubdependenciaService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubdependenciaService {

    private final SubdependenciaRepository repository;
    private final DependenciaRepository dependenciaRepository;

    public List<Subdependencia> findAll(Long dependenciaId, String search) {
        boolean hasSearch = search != null && !search.isBlank();

        if (dependenciaId != null && hasSearch) {
            return repository.searchByDependenciaId(dependenciaId, search);
        }
        if (dependenciaId != null) {
            return repository.findByDependenciaId(dependenciaId);
        }
        if (hasSearch) {
            return repository.search(search);
        }
        return repository.findAll();
    }

    public Subdependencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + id));
    }

    public Subdependencia create(SubdependenciaRequest request) {
        Subdependencia subdependencia = new Subdependencia();
        subdependencia.setNombre(request.getNombre());
        subdependencia.setDependencia(resolveDependencia(request.getDependenciaId()));
        return repository.save(subdependencia);
    }

    public Subdependencia update(Long id, SubdependenciaRequest request) {
        Subdependencia subdependencia = findById(id);
        subdependencia.setNombre(request.getNombre());
        subdependencia.setDependencia(resolveDependencia(request.getDependenciaId()));
        return repository.save(subdependencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private Dependencia resolveDependencia(Long dependenciaId) {
        return dependenciaRepository.findById(dependenciaId)
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + dependenciaId));
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=SubdependenciaServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SubdependenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SubdependenciaService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_filtersByDependenciaId() throws Exception {
        Dependencia dependencia = new Dependencia(1L, "TI", new Sede(1L, "Lima"));
        when(service.findAll(1L, null)).thenReturn(List.of(new Subdependencia(1L, "Soporte", dependencia)));

        mockMvc.perform(get("/api/catalogos/subdependencias").param("dependenciaId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("Soporte")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        Dependencia dependencia = new Dependencia(1L, "TI", new Sede(1L, "Lima"));
        SubdependenciaRequest request = new SubdependenciaRequest();
        request.setNombre("Soporte");
        request.setDependenciaId(1L);
        when(service.create(any())).thenReturn(new Subdependencia(1L, "Soporte", dependencia));

        mockMvc.perform(post("/api/catalogos/subdependencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("Soporte")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        SubdependenciaRequest request = new SubdependenciaRequest();
        request.setNombre("Soporte");
        request.setDependenciaId(1L);

        mockMvc.perform(post("/api/catalogos/subdependencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=SubdependenciaControllerIT test`
Expected: FAIL — `SubdependenciaController` does not exist.

- [ ] **Step 10: Implement `SubdependenciaController`**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/subdependencias")
@RequiredArgsConstructor
public class SubdependenciaController {

    private final SubdependenciaService service;

    @GetMapping
    public List<Subdependencia> findAll(@RequestParam(required = false) Long dependenciaId,
                                         @RequestParam(required = false) String search) {
        return service.findAll(dependenciaId, search);
    }

    @GetMapping("/{id}")
    public Subdependencia findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Subdependencia> create(@Valid @RequestBody SubdependenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Subdependencia update(@PathVariable Long id, @Valid @RequestBody SubdependenciaRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=SubdependenciaControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo
git commit -m "feat: add Subdependencias catalog CRUD endpoints"
```

---

## Task 10: Catálogo — Tipos de Contrato

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoContrato.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoContratoRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoContratoRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoContratoService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoContratoController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoContratoServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoContratoControllerIT.java`

This module mirrors Task 7 (`Sede`) exactly — a flat catalog with just `id`
and `nombre`.

- [ ] **Step 1: Create `TipoContrato` entity**

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipos_contrato")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TipoContrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;
}
```

- [ ] **Step 2: Create `TipoContratoRequest` DTO**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoContratoRequest {

    @NotBlank
    private String nombre;
}
```

- [ ] **Step 3: Create `TipoContratoRepository`**

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoContratoRepository extends JpaRepository<TipoContrato, Long> {

    @Query("SELECT t FROM TipoContrato t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoContrato> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `TipoContratoService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TipoContratoServiceTest {

    @Mock
    private TipoContratoRepository repository;

    @InjectMocks
    private TipoContratoService service;

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new TipoContrato(1L, "CAS")));

        List<TipoContrato> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesTipoContratoFromRequest() {
        TipoContratoRequest request = new TipoContratoRequest();
        request.setNombre("CAS");
        when(repository.save(any(TipoContrato.class))).thenAnswer(inv -> inv.getArgument(0));

        TipoContrato result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("CAS");
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=TipoContratoServiceTest test`
Expected: FAIL — `TipoContratoService` does not exist.

- [ ] **Step 6: Implement `TipoContratoService`**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoContratoService {

    private final TipoContratoRepository repository;

    public List<TipoContrato> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoContrato findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + id));
    }

    public TipoContrato create(TipoContratoRequest request) {
        TipoContrato tipo = new TipoContrato();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoContrato update(Long id, TipoContratoRequest request) {
        TipoContrato tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=TipoContratoServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TipoContratoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TipoContratoService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new TipoContrato(1L, "CAS")));

        mockMvc.perform(get("/api/catalogos/tipos-contrato"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("CAS")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        TipoContratoRequest request = new TipoContratoRequest();
        request.setNombre("CAS");
        when(service.create(any())).thenReturn(new TipoContrato(1L, "CAS"));

        mockMvc.perform(post("/api/catalogos/tipos-contrato")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("CAS")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        TipoContratoRequest request = new TipoContratoRequest();
        request.setNombre("CAS");

        mockMvc.perform(post("/api/catalogos/tipos-contrato")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=TipoContratoControllerIT test`
Expected: FAIL — `TipoContratoController` does not exist.

- [ ] **Step 10: Implement `TipoContratoController`**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/tipos-contrato")
@RequiredArgsConstructor
public class TipoContratoController {

    private final TipoContratoService service;

    @GetMapping
    public List<TipoContrato> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public TipoContrato findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TipoContrato> create(@Valid @RequestBody TipoContratoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TipoContrato update(@PathVariable Long id, @Valid @RequestBody TipoContratoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=TipoContratoControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo
git commit -m "feat: add Tipos de Contrato catalog CRUD endpoints"
```

---

## Task 11: Módulo Licencias Office

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaControllerIT.java`

- [ ] **Step 1: Create `Licencia` entity**

```java
package com.inia.soportedesk.licencias;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "licencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Licencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
    private String licencia;

    @Column(nullable = false)
    private String correo;

    @Column(nullable = false)
    private String clave;

    @Column(name = "orden_compra", nullable = false)
    private String ordenCompra;

    @Column(nullable = false)
    private String anio;
}
```

- [ ] **Step 2: Create `LicenciaRequest` DTO**

```java
package com.inia.soportedesk.licencias;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LicenciaRequest {

    @NotNull
    @Min(1)
    private Integer cantidad;

    @NotBlank
    private String licencia;

    @NotBlank
    @Email
    private String correo;

    @NotBlank
    private String clave;

    @NotBlank
    private String ordenCompra;

    @NotBlank
    private String anio;
}
```

- [ ] **Step 3: Create `LicenciaRepository`**

```java
package com.inia.soportedesk.licencias;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LicenciaRepository extends JpaRepository<Licencia, Long> {

    @Query("SELECT l FROM Licencia l WHERE " +
           "LOWER(l.licencia) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.correo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.clave) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.ordenCompra) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.anio) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Licencia> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `LicenciaService`**

```java
package com.inia.soportedesk.licencias;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LicenciaServiceTest {

    @Mock
    private LicenciaRepository repository;

    @InjectMocks
    private LicenciaService service;

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setCantidad(5);
        request.setLicencia("Office 365 E3");
        request.setCorreo("j.perez@inia.gob.pe");
        request.setClave("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024")));

        List<Licencia> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withSearch_usesSearchQuery() {
        when(repository.search("office")).thenReturn(List.of(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024")));

        List<Licencia> result = service.findAll("office");

        assertThat(result).hasSize(1);
        verify(repository).search("office");
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesLicenciaFromRequest() {
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        Licencia result = service.create(sampleRequest());

        assertThat(result.getLicencia()).isEqualTo("Office 365 E3");
        assertThat(result.getCantidad()).isEqualTo(5);
    }

    @Test
    void update_modifiesExistingLicencia() {
        Licencia existing = new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenciaRequest request = sampleRequest();
        request.setCantidad(10);

        Licencia result = service.update(1L, request);

        assertThat(result.getCantidad()).isEqualTo(10);
    }

    @Test
    void delete_removesExistingLicencia() {
        Licencia existing = new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=LicenciaServiceTest test`
Expected: FAIL — `LicenciaService` does not exist.

- [ ] **Step 6: Implement `LicenciaService`**

```java
package com.inia.soportedesk.licencias;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LicenciaService {

    private final LicenciaRepository repository;

    public List<Licencia> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Licencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada: " + id));
    }

    public Licencia create(LicenciaRequest request) {
        Licencia licencia = new Licencia();
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    public Licencia update(Long id, LicenciaRequest request) {
        Licencia licencia = findById(id);
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Licencia licencia, LicenciaRequest request) {
        licencia.setCantidad(request.getCantidad());
        licencia.setLicencia(request.getLicencia());
        licencia.setCorreo(request.getCorreo());
        licencia.setClave(request.getClave());
        licencia.setOrdenCompra(request.getOrdenCompra());
        licencia.setAnio(request.getAnio());
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=LicenciaServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.licencias;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LicenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LicenciaService service;

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setCantidad(5);
        request.setLicencia("Office 365 E3");
        request.setCorreo("j.perez@inia.gob.pe");
        request.setClave("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024")));

        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].licencia", is("Office 365 E3")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024"));

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.licencia", is("Office 365 E3")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withInvalidRequest_returns400() throws Exception {
        LicenciaRequest request = sampleRequest();
        request.setCorreo("not-an-email");

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_withAdminRole_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/licencias/1"))
                .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=LicenciaControllerIT test`
Expected: FAIL — `LicenciaController` does not exist.

- [ ] **Step 10: Implement `LicenciaController`**

```java
package com.inia.soportedesk.licencias;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/licencias")
@RequiredArgsConstructor
public class LicenciaController {

    private final LicenciaService service;

    @GetMapping
    public List<Licencia> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Licencia findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Licencia> create(@Valid @RequestBody LicenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Licencia update(@PathVariable Long id, @Valid @RequestBody LicenciaRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=LicenciaControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/licencias soportedesk-backend/src/test/java/com/inia/soportedesk/licencias
git commit -m "feat: add Licencias Office CRUD endpoints"
```

---

## Task 12: Módulo Claves WiFi

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/wifi/Wifi.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/wifi/WifiRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/wifi/WifiRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/wifi/WifiService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/wifi/WifiController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/wifi/WifiServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/wifi/WifiControllerIT.java`

- [ ] **Step 1: Create `Wifi` entity**

```java
package com.inia.soportedesk.wifi;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wifi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Wifi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ssid;

    @Column(nullable = false)
    private String clave;

    @Column(nullable = false)
    private String ubicacion;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String estado;
}
```

- [ ] **Step 2: Create `WifiRequest` DTO**

```java
package com.inia.soportedesk.wifi;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WifiRequest {

    @NotBlank
    private String ssid;

    @NotBlank
    private String clave;

    @NotBlank
    private String ubicacion;

    @NotBlank
    private String tipo;

    @NotBlank
    private String estado;
}
```

- [ ] **Step 3: Create `WifiRepository`**

```java
package com.inia.soportedesk.wifi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WifiRepository extends JpaRepository<Wifi, Long> {

    @Query("SELECT w FROM Wifi w WHERE " +
           "LOWER(w.ssid) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(w.ubicacion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(w.tipo) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Wifi> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `WifiService`**

```java
package com.inia.soportedesk.wifi;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WifiServiceTest {

    @Mock
    private WifiRepository repository;

    @InjectMocks
    private WifiService service;

    private WifiRequest sampleRequest() {
        WifiRequest request = new WifiRequest();
        request.setSsid("INIA-CORP");
        request.setClave("clave-secreta");
        request.setUbicacion("Edificio Principal - Todos los pisos");
        request.setTipo("WPA2-Enterprise");
        request.setEstado("Activo");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo")));

        List<Wifi> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesWifiFromRequest() {
        when(repository.save(any(Wifi.class))).thenAnswer(inv -> inv.getArgument(0));

        Wifi result = service.create(sampleRequest());

        assertThat(result.getSsid()).isEqualTo("INIA-CORP");
    }

    @Test
    void delete_removesExistingWifi() {
        Wifi existing = new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=WifiServiceTest test`
Expected: FAIL — `WifiService` does not exist.

- [ ] **Step 6: Implement `WifiService`**

```java
package com.inia.soportedesk.wifi;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WifiService {

    private final WifiRepository repository;

    public List<Wifi> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Wifi findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Red WiFi no encontrada: " + id));
    }

    public Wifi create(WifiRequest request) {
        Wifi wifi = new Wifi();
        copyFields(wifi, request);
        return repository.save(wifi);
    }

    public Wifi update(Long id, WifiRequest request) {
        Wifi wifi = findById(id);
        copyFields(wifi, request);
        return repository.save(wifi);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Wifi wifi, WifiRequest request) {
        wifi.setSsid(request.getSsid());
        wifi.setClave(request.getClave());
        wifi.setUbicacion(request.getUbicacion());
        wifi.setTipo(request.getTipo());
        wifi.setEstado(request.getEstado());
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=WifiServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.wifi;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WifiControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WifiService service;

    private WifiRequest sampleRequest() {
        WifiRequest request = new WifiRequest();
        request.setSsid("INIA-CORP");
        request.setClave("clave-secreta");
        request.setUbicacion("Edificio Principal - Todos los pisos");
        request.setTipo("WPA2-Enterprise");
        request.setEstado("Activo");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo")));

        mockMvc.perform(get("/api/wifi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ssid", is("INIA-CORP")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo"));

        mockMvc.perform(post("/api/wifi")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ssid", is("INIA-CORP")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/wifi")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=WifiControllerIT test`
Expected: FAIL — `WifiController` does not exist.

- [ ] **Step 10: Implement `WifiController`**

```java
package com.inia.soportedesk.wifi;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wifi")
@RequiredArgsConstructor
public class WifiController {

    private final WifiService service;

    @GetMapping
    public List<Wifi> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Wifi findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Wifi> create(@Valid @RequestBody WifiRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Wifi update(@PathVariable Long id, @Valid @RequestBody WifiRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=WifiControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/wifi soportedesk-backend/src/test/java/com/inia/soportedesk/wifi
git commit -m "feat: add Claves WiFi CRUD endpoints"
```

---

## Task 13: Módulo Equipos Asignados

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/Equipo.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoControllerIT.java`

- [ ] **Step 1: Create `Equipo` entity**

```java
package com.inia.soportedesk.equipos;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "equipos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String area;

    private LocalDate asignado;

    @Column(nullable = false)
    private String estado;
}
```

- [ ] **Step 2: Create `EquipoRequest` DTO**

```java
package com.inia.soportedesk.equipos;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EquipoRequest {

    @NotBlank
    private String codigo;

    @NotBlank
    private String tipo;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    @NotBlank
    private String usuario;

    @NotBlank
    private String area;

    private LocalDate asignado;

    @NotBlank
    private String estado;
}
```

- [ ] **Step 3: Create `EquipoRepository`**

```java
package com.inia.soportedesk.equipos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    @Query("SELECT e FROM Equipo e WHERE " +
           "LOWER(e.codigo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.area) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Equipo> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `EquipoService`**

```java
package com.inia.soportedesk.equipos;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoServiceTest {

    @Mock
    private EquipoRepository repository;

    @InjectMocks
    private EquipoService service;

    private EquipoRequest sampleRequest() {
        EquipoRequest request = new EquipoRequest();
        request.setCodigo("EQ-2024-001");
        request.setTipo("Laptop");
        request.setMarca("Dell");
        request.setModelo("Latitude 5540");
        request.setUsuario("jperez");
        request.setArea("TI");
        request.setAsignado(LocalDate.of(2024, 1, 10));
        request.setEstado("En uso");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso")));

        List<Equipo> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesEquipoFromRequest() {
        when(repository.save(any(Equipo.class))).thenAnswer(inv -> inv.getArgument(0));

        Equipo result = service.create(sampleRequest());

        assertThat(result.getCodigo()).isEqualTo("EQ-2024-001");
    }

    @Test
    void delete_removesExistingEquipo() {
        Equipo existing = new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=EquipoServiceTest test`
Expected: FAIL — `EquipoService` does not exist.

- [ ] **Step 6: Implement `EquipoService`**

```java
package com.inia.soportedesk.equipos;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private final EquipoRepository repository;

    public List<Equipo> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Equipo findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + id));
    }

    public Equipo create(EquipoRequest request) {
        Equipo equipo = new Equipo();
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    public Equipo update(Long id, EquipoRequest request) {
        Equipo equipo = findById(id);
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Equipo equipo, EquipoRequest request) {
        equipo.setCodigo(request.getCodigo());
        equipo.setTipo(request.getTipo());
        equipo.setMarca(request.getMarca());
        equipo.setModelo(request.getModelo());
        equipo.setUsuario(request.getUsuario());
        equipo.setArea(request.getArea());
        equipo.setAsignado(request.getAsignado());
        equipo.setEstado(request.getEstado());
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=EquipoServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.equipos;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EquipoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipoService service;

    private EquipoRequest sampleRequest() {
        EquipoRequest request = new EquipoRequest();
        request.setCodigo("EQ-2024-001");
        request.setTipo("Laptop");
        request.setMarca("Dell");
        request.setModelo("Latitude 5540");
        request.setUsuario("jperez");
        request.setArea("TI");
        request.setAsignado(LocalDate.of(2024, 1, 10));
        request.setEstado("En uso");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso")));

        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo", is("EQ-2024-001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso"));

        mockMvc.perform(post("/api/equipos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo", is("EQ-2024-001")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/equipos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=EquipoControllerIT test`
Expected: FAIL — `EquipoController` does not exist.

- [ ] **Step 10: Implement `EquipoController`**

```java
package com.inia.soportedesk.equipos;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService service;

    @GetMapping
    public List<Equipo> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Equipo findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Equipo> create(@Valid @RequestBody EquipoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Equipo update(@PathVariable Long id, @Valid @RequestBody EquipoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=EquipoControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos soportedesk-backend/src/test/java/com/inia/soportedesk/equipos
git commit -m "feat: add Equipos Asignados CRUD endpoints"
```

---

## Task 14: Módulo VPN

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java`

The `vence` field doubles as VPN/antivirus license expiration and contract
end date; the frontend applies the "Vencido"/"Por vencer" badge logic to it
(see Frontend plan).

- [ ] **Step 1: Create `Vpn` entity**

```java
package com.inia.soportedesk.vpn;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "vpn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vpn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String tipo;

    @Column(name = "ip_asignada", nullable = false)
    private String ipAsignada;

    @Column(nullable = false)
    private LocalDate vence;

    @Column(nullable = false)
    private String estado;
}
```

- [ ] **Step 2: Create `VpnRequest` DTO**

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnRequest {

    @NotBlank
    private String usuario;

    @NotBlank
    private String nombre;

    @NotBlank
    private String tipo;

    @NotBlank
    private String ipAsignada;

    @NotNull
    private LocalDate vence;

    @NotBlank
    private String estado;
}
```

- [ ] **Step 3: Create `VpnRepository`**

```java
package com.inia.soportedesk.vpn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VpnRepository extends JpaRepository<Vpn, Long> {

    @Query("SELECT v FROM Vpn v WHERE " +
           "LOWER(v.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.tipo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.ipAsignada) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Vpn> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `VpnService`**

```java
package com.inia.soportedesk.vpn;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VpnServiceTest {

    @Mock
    private VpnRepository repository;

    @InjectMocks
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setTipo("OpenVPN");
        request.setIpAsignada("10.8.0.2");
        request.setVence(LocalDate.of(2025, 12, 31));
        request.setEstado("Activo");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo")));

        List<Vpn> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesVpnFromRequest() {
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        Vpn result = service.create(sampleRequest());

        assertThat(result.getUsuario()).isEqualTo("jperez");
        assertThat(result.getVence()).isEqualTo(LocalDate.of(2025, 12, 31));
    }

    @Test
    void delete_removesExistingVpn() {
        Vpn existing = new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=VpnServiceTest test`
Expected: FAIL — `VpnService` does not exist.

- [ ] **Step 6: Implement `VpnService`**

```java
package com.inia.soportedesk.vpn;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VpnService {

    private final VpnRepository repository;

    public List<Vpn> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Vpn findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acceso VPN no encontrado: " + id));
    }

    public Vpn create(VpnRequest request) {
        Vpn vpn = new Vpn();
        copyFields(vpn, request);
        return repository.save(vpn);
    }

    public Vpn update(Long id, VpnRequest request) {
        Vpn vpn = findById(id);
        copyFields(vpn, request);
        return repository.save(vpn);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Vpn vpn, VpnRequest request) {
        vpn.setUsuario(request.getUsuario());
        vpn.setNombre(request.getNombre());
        vpn.setTipo(request.getTipo());
        vpn.setIpAsignada(request.getIpAsignada());
        vpn.setVence(request.getVence());
        vpn.setEstado(request.getEstado());
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=VpnServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.vpn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VpnControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setTipo("OpenVPN");
        request.setIpAsignada("10.8.0.2");
        request.setVence(LocalDate.of(2025, 12, 31));
        request.setEstado("Activo");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo")));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo"));

        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=VpnControllerIT test`
Expected: FAIL — `VpnController` does not exist.

- [ ] **Step 10: Implement `VpnController`**

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vpn")
@RequiredArgsConstructor
public class VpnController {

    private final VpnService service;

    @GetMapping
    public List<Vpn> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Vpn findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Vpn> create(@Valid @RequestBody VpnRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Vpn update(@PathVariable Long id, @Valid @RequestBody VpnRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=VpnControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn soportedesk-backend/src/test/java/com/inia/soportedesk/vpn
git commit -m "feat: add VPN CRUD endpoints"
```

---

## Task 15: Módulo Correos Institucionales

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/Correo.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/correos/CorreoServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/correos/CorreoControllerIT.java`

`Correo` references the catalogs created in Tasks 7–10: `Sede`,
`Dependencia`, `Subdependencia`, `TipoContrato`. `fechaFinContrato` is
nullable (some accounts have no contract end date) and is used by the
frontend to show "Vencido"/"Por vencer" badges.

- [ ] **Step 1: Create `Correo` entity**

```java
package com.inia.soportedesk.correos;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.TipoContrato;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "correos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Correo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String correo;

    @Column(nullable = false)
    private String estado;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id", nullable = false)
    private Sede sede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id", nullable = false)
    private Dependencia dependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subdependencia_id", nullable = false)
    private Subdependencia subdependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_contrato_id", nullable = false)
    private TipoContrato tipoContrato;

    @Column(name = "fecha_fin_contrato")
    private LocalDate fechaFinContrato;

    @Column(nullable = false)
    private LocalDate creado;
}
```

- [ ] **Step 2: Create `CorreoRequest` DTO**

```java
package com.inia.soportedesk.correos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CorreoRequest {

    @NotBlank
    private String usuario;

    @NotBlank
    private String nombre;

    @NotBlank
    @Email
    private String correo;

    @NotBlank
    private String estado;

    @NotNull
    private Long sedeId;

    @NotNull
    private Long dependenciaId;

    @NotNull
    private Long subdependenciaId;

    @NotNull
    private Long tipoContratoId;

    private LocalDate fechaFinContrato;

    @NotNull
    private LocalDate creado;
}
```

- [ ] **Step 3: Create `CorreoRepository`**

```java
package com.inia.soportedesk.correos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CorreoRepository extends JpaRepository<Correo, Long> {

    @Query("SELECT c FROM Correo c WHERE " +
           "LOWER(c.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.correo) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Correo> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `CorreoService`**

```java
package com.inia.soportedesk.correos;

import com.inia.soportedesk.catalogo.*;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CorreoServiceTest {

    @Mock
    private CorreoRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @Mock
    private TipoContratoRepository tipoContratoRepository;

    @InjectMocks
    private CorreoService service;

    private final Sede sede = new Sede(1L, "Lima");
    private final Dependencia dependencia = new Dependencia(1L, "TI", sede);
    private final Subdependencia subdependencia = new Subdependencia(1L, "Soporte", dependencia);
    private final TipoContrato tipoContrato = new TipoContrato(1L, "CAS");

    private CorreoRequest sampleRequest() {
        CorreoRequest request = new CorreoRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setCorreo("j.perez@inia.gob.pe");
        request.setEstado("Activo");
        request.setSedeId(1L);
        request.setDependenciaId(1L);
        request.setSubdependenciaId(1L);
        request.setTipoContratoId(1L);
        request.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        request.setCreado(LocalDate.of(2023, 1, 10));
        return request;
    }

    private void stubCatalogLookups() {
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sede));
        when(dependenciaRepository.findById(1L)).thenReturn(Optional.of(dependencia));
        when(subdependenciaRepository.findById(1L)).thenReturn(Optional.of(subdependencia));
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.of(tipoContrato));
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        Correo correo = new Correo(1L, "jperez", "Juan Pérez", "j.perez@inia.gob.pe", "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31), LocalDate.of(2023, 1, 10));
        when(repository.findAll()).thenReturn(List.of(correo));

        List<Correo> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_resolvesCatalogsAndSaves() {
        stubCatalogLookups();
        when(repository.save(any(Correo.class))).thenAnswer(inv -> inv.getArgument(0));

        Correo result = service.create(sampleRequest());

        assertThat(result.getUsuario()).isEqualTo("jperez");
        assertThat(result.getSede()).isEqualTo(sede);
        assertThat(result.getDependencia()).isEqualTo(dependencia);
        assertThat(result.getSubdependencia()).isEqualTo(subdependencia);
        assertThat(result.getTipoContrato()).isEqualTo(tipoContrato);
        assertThat(result.getFechaFinContrato()).isEqualTo(LocalDate.of(2026, 12, 31));
    }

    @Test
    void create_withUnknownSedeId_throwsResourceNotFoundException() {
        when(sedeRepository.findById(99L)).thenReturn(Optional.empty());

        CorreoRequest request = sampleRequest();
        request.setSedeId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_removesExistingCorreo() {
        Correo correo = new Correo(1L, "jperez", "Juan Pérez", "j.perez@inia.gob.pe", "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31), LocalDate.of(2023, 1, 10));
        when(repository.findById(1L)).thenReturn(Optional.of(correo));

        service.delete(1L);

        verify(repository).delete(correo);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=CorreoServiceTest test`
Expected: FAIL — `CorreoService` does not exist.

- [ ] **Step 6: Implement `CorreoService`**

```java
package com.inia.soportedesk.correos;

import com.inia.soportedesk.catalogo.*;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CorreoService {

    private final CorreoRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final TipoContratoRepository tipoContratoRepository;

    public List<Correo> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Correo findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Correo no encontrado: " + id));
    }

    public Correo create(CorreoRequest request) {
        Correo correo = new Correo();
        copyFields(correo, request);
        return repository.save(correo);
    }

    public Correo update(Long id, CorreoRequest request) {
        Correo correo = findById(id);
        copyFields(correo, request);
        return repository.save(correo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Correo correo, CorreoRequest request) {
        correo.setUsuario(request.getUsuario());
        correo.setNombre(request.getNombre());
        correo.setCorreo(request.getCorreo());
        correo.setEstado(request.getEstado());
        correo.setFechaFinContrato(request.getFechaFinContrato());
        correo.setCreado(request.getCreado());
        correo.setSede(sedeRepository.findById(request.getSedeId())
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId())));
        correo.setDependencia(dependenciaRepository.findById(request.getDependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId())));
        correo.setSubdependencia(subdependenciaRepository.findById(request.getSubdependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId())));
        correo.setTipoContrato(tipoContratoRepository.findById(request.getTipoContratoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + request.getTipoContratoId())));
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=CorreoServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.correos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CorreoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CorreoService service;

    private final Sede sede = new Sede(1L, "Lima");
    private final Dependencia dependencia = new Dependencia(1L, "TI", sede);
    private final Subdependencia subdependencia = new Subdependencia(1L, "Soporte", dependencia);
    private final TipoContrato tipoContrato = new TipoContrato(1L, "CAS");

    private CorreoRequest sampleRequest() {
        CorreoRequest request = new CorreoRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setCorreo("j.perez@inia.gob.pe");
        request.setEstado("Activo");
        request.setSedeId(1L);
        request.setDependenciaId(1L);
        request.setSubdependenciaId(1L);
        request.setTipoContratoId(1L);
        request.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        request.setCreado(LocalDate.of(2023, 1, 10));
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        Correo correo = new Correo(1L, "jperez", "Juan Pérez", "j.perez@inia.gob.pe", "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31), LocalDate.of(2023, 1, 10));
        when(service.findAll(null)).thenReturn(List.of(correo));

        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")))
                .andExpect(jsonPath("$[0].sede.nombre", is("Lima")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        Correo correo = new Correo(1L, "jperez", "Juan Pérez", "j.perez@inia.gob.pe", "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31), LocalDate.of(2023, 1, 10));
        when(service.create(any())).thenReturn(correo);

        mockMvc.perform(post("/api/correos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/correos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=CorreoControllerIT test`
Expected: FAIL — `CorreoController` does not exist.

- [ ] **Step 10: Implement `CorreoController`**

```java
package com.inia.soportedesk.correos;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/correos")
@RequiredArgsConstructor
public class CorreoController {

    private final CorreoService service;

    @GetMapping
    public List<Correo> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Correo findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Correo> create(@Valid @RequestBody CorreoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Correo update(@PathVariable Long id, @Valid @RequestBody CorreoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=CorreoControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/correos soportedesk-backend/src/test/java/com/inia/soportedesk/correos
git commit -m "feat: add Correos institucionales CRUD endpoints with catalog FKs"
```

---

## Task 16: Módulo Usuarios de Red / AD

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRed.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/usuariosred/UsuarioRedServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/usuariosred/UsuarioRedControllerIT.java`

This module mirrors Task 15 (`Correo`): it has the same catalog FKs
(`Sede`, `Dependencia`, `Subdependencia`, `TipoContrato`) and
`fechaFinContrato`, but tracks AD group membership and last login instead of
an email address.

- [ ] **Step 1: Create `UsuarioRed` entity**

```java
package com.inia.soportedesk.usuariosred;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.TipoContrato;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios_red")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String grupo;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    @Column(nullable = false)
    private String estado;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id", nullable = false)
    private Sede sede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id", nullable = false)
    private Dependencia dependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subdependencia_id", nullable = false)
    private Subdependencia subdependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_contrato_id", nullable = false)
    private TipoContrato tipoContrato;

    @Column(name = "fecha_fin_contrato")
    private LocalDate fechaFinContrato;
}
```

- [ ] **Step 2: Create `UsuarioRedRequest` DTO**

```java
package com.inia.soportedesk.usuariosred;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class UsuarioRedRequest {

    @NotBlank
    private String usuario;

    @NotBlank
    private String nombre;

    @NotBlank
    private String grupo;

    private LocalDateTime ultimoLogin;

    @NotBlank
    private String estado;

    @NotNull
    private Long sedeId;

    @NotNull
    private Long dependenciaId;

    @NotNull
    private Long subdependenciaId;

    @NotNull
    private Long tipoContratoId;

    private LocalDate fechaFinContrato;
}
```

- [ ] **Step 3: Create `UsuarioRedRepository`**

```java
package com.inia.soportedesk.usuariosred;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UsuarioRedRepository extends JpaRepository<UsuarioRed, Long> {

    @Query("SELECT u FROM UsuarioRed u WHERE " +
           "LOWER(u.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.grupo) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<UsuarioRed> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `UsuarioRedService`**

```java
package com.inia.soportedesk.usuariosred;

import com.inia.soportedesk.catalogo.*;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioRedServiceTest {

    @Mock
    private UsuarioRedRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @Mock
    private TipoContratoRepository tipoContratoRepository;

    @InjectMocks
    private UsuarioRedService service;

    private final Sede sede = new Sede(1L, "Lima");
    private final Dependencia dependencia = new Dependencia(1L, "TI", sede);
    private final Subdependencia subdependencia = new Subdependencia(1L, "Soporte", dependencia);
    private final TipoContrato tipoContrato = new TipoContrato(1L, "CAS");

    private UsuarioRedRequest sampleRequest() {
        UsuarioRedRequest request = new UsuarioRedRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setGrupo("IT-Admins");
        request.setUltimoLogin(LocalDateTime.of(2025, 6, 13, 8, 42));
        request.setEstado("Activo");
        request.setSedeId(1L);
        request.setDependenciaId(1L);
        request.setSubdependenciaId(1L);
        request.setTipoContratoId(1L);
        request.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        return request;
    }

    private void stubCatalogLookups() {
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sede));
        when(dependenciaRepository.findById(1L)).thenReturn(Optional.of(dependencia));
        when(subdependenciaRepository.findById(1L)).thenReturn(Optional.of(subdependencia));
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.of(tipoContrato));
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(repository.findAll()).thenReturn(List.of(usuario));

        List<UsuarioRed> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_resolvesCatalogsAndSaves() {
        stubCatalogLookups();
        when(repository.save(any(UsuarioRed.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioRed result = service.create(sampleRequest());

        assertThat(result.getUsuario()).isEqualTo("jperez");
        assertThat(result.getSede()).isEqualTo(sede);
        assertThat(result.getDependencia()).isEqualTo(dependencia);
        assertThat(result.getSubdependencia()).isEqualTo(subdependencia);
        assertThat(result.getTipoContrato()).isEqualTo(tipoContrato);
    }

    @Test
    void delete_removesExistingUsuarioRed() {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(repository.findById(1L)).thenReturn(Optional.of(usuario));

        service.delete(1L);

        verify(repository).delete(usuario);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=UsuarioRedServiceTest test`
Expected: FAIL — `UsuarioRedService` does not exist.

- [ ] **Step 6: Implement `UsuarioRedService`**

```java
package com.inia.soportedesk.usuariosred;

import com.inia.soportedesk.catalogo.*;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioRedService {

    private final UsuarioRedRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final TipoContratoRepository tipoContratoRepository;

    public List<UsuarioRed> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public UsuarioRed findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + id));
    }

    public UsuarioRed create(UsuarioRedRequest request) {
        UsuarioRed usuario = new UsuarioRed();
        copyFields(usuario, request);
        return repository.save(usuario);
    }

    public UsuarioRed update(Long id, UsuarioRedRequest request) {
        UsuarioRed usuario = findById(id);
        copyFields(usuario, request);
        return repository.save(usuario);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(UsuarioRed usuario, UsuarioRedRequest request) {
        usuario.setUsuario(request.getUsuario());
        usuario.setNombre(request.getNombre());
        usuario.setGrupo(request.getGrupo());
        usuario.setUltimoLogin(request.getUltimoLogin());
        usuario.setEstado(request.getEstado());
        usuario.setFechaFinContrato(request.getFechaFinContrato());
        usuario.setSede(sedeRepository.findById(request.getSedeId())
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId())));
        usuario.setDependencia(dependenciaRepository.findById(request.getDependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId())));
        usuario.setSubdependencia(subdependenciaRepository.findById(request.getSubdependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId())));
        usuario.setTipoContrato(tipoContratoRepository.findById(request.getTipoContratoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + request.getTipoContratoId())));
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=UsuarioRedServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.usuariosred;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UsuarioRedControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UsuarioRedService service;

    private final Sede sede = new Sede(1L, "Lima");
    private final Dependencia dependencia = new Dependencia(1L, "TI", sede);
    private final Subdependencia subdependencia = new Subdependencia(1L, "Soporte", dependencia);
    private final TipoContrato tipoContrato = new TipoContrato(1L, "CAS");

    private UsuarioRedRequest sampleRequest() {
        UsuarioRedRequest request = new UsuarioRedRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setGrupo("IT-Admins");
        request.setUltimoLogin(LocalDateTime.of(2025, 6, 13, 8, 42));
        request.setEstado("Activo");
        request.setSedeId(1L);
        request.setDependenciaId(1L);
        request.setSubdependenciaId(1L);
        request.setTipoContratoId(1L);
        request.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(service.findAll(null)).thenReturn(List.of(usuario));

        mockMvc.perform(get("/api/usuarios-red"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(service.create(any())).thenReturn(usuario);

        mockMvc.perform(post("/api/usuarios-red")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/usuarios-red")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=UsuarioRedControllerIT test`
Expected: FAIL — `UsuarioRedController` does not exist.

- [ ] **Step 10: Implement `UsuarioRedController`**

```java
package com.inia.soportedesk.usuariosred;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-red")
@RequiredArgsConstructor
public class UsuarioRedController {

    private final UsuarioRedService service;

    @GetMapping
    public List<UsuarioRed> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public UsuarioRed findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioRed> create(@Valid @RequestBody UsuarioRedRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioRed update(@PathVariable Long id, @Valid @RequestBody UsuarioRedRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=UsuarioRedControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred soportedesk-backend/src/test/java/com/inia/soportedesk/usuariosred
git commit -m "feat: add Usuarios de Red CRUD endpoints with catalog FKs"
```

---

## Task 17: Módulo Impresoras (datos + ficha técnica)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`

This task covers the printer's basic data and consumable levels. Driver
upload/download endpoints are added separately in Task 18 on top of this
same entity/controller.

- [ ] **Step 1: Create `Impresora` entity**

```java
package com.inia.soportedesk.impresoras;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "impresoras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Impresora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    private String ip;

    private String piso;

    private String area;

    @Column(nullable = false)
    private String estado;

    @Column(name = "toner_negro")
    private Integer tonerNegro;

    @Column(name = "toner_c")
    private Integer tonerC;

    @Column(name = "toner_m")
    private Integer tonerM;

    @Column(name = "toner_y")
    private Integer tonerY;

    private Integer cartucho;

    private Integer drum;

    private Integer fusor;

    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
}
```

- [ ] **Step 2: Create `ImpresoraRequest` DTO**

```java
package com.inia.soportedesk.impresoras;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImpresoraRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    private String ip;

    private String piso;

    private String area;

    @NotBlank
    private String estado;

    @Min(0) @Max(100)
    private Integer tonerNegro;

    @Min(0) @Max(100)
    private Integer tonerC;

    @Min(0) @Max(100)
    private Integer tonerM;

    @Min(0) @Max(100)
    private Integer tonerY;

    @Min(0) @Max(100)
    private Integer cartucho;

    @Min(0) @Max(100)
    private Integer drum;

    @Min(0) @Max(100)
    private Integer fusor;
}
```

- [ ] **Step 3: Create `ImpresoraRepository`**

```java
package com.inia.soportedesk.impresoras;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImpresoraRepository extends JpaRepository<Impresora, Long> {

    @Query("SELECT i FROM Impresora i WHERE " +
           "LOWER(i.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.area) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Impresora> search(@Param("search") String search);
}
```

- [ ] **Step 4: Write failing test for `ImpresoraService`**

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImpresoraServiceTest {

    @Mock
    private ImpresoraRepository repository;

    @InjectMocks
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setNombre("HP LaserJet 4ta planta");
        request.setMarca("HP");
        request.setModelo("M404dn");
        request.setIp("10.0.0.50");
        request.setPiso("4");
        request.setArea("Administración");
        request.setEstado("Activa");
        request.setTonerNegro(80);
        request.setTonerC(60);
        request.setTonerM(60);
        request.setTonerY(60);
        request.setCartucho(90);
        request.setDrum(70);
        request.setFusor(85);
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(repository.findAll()).thenReturn(List.of(impresora));

        List<Impresora> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesImpresora() {
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getNombre()).isEqualTo("HP LaserJet 4ta planta");
        assertThat(result.getTonerNegro()).isEqualTo(80);
    }

    @Test
    void update_preservesDriverFields() {
        Impresora existing = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, "driver-hp.zip", "1.2", "Windows 10", "drivers/1/driver-hp.zip");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ImpresoraRequest request = sampleRequest();
        request.setTonerNegro(40);

        Impresora result = service.update(1L, request);

        assertThat(result.getTonerNegro()).isEqualTo(40);
        assertThat(result.getDriverArchivoPath()).isEqualTo("drivers/1/driver-hp.zip");
    }

    @Test
    void delete_removesExistingImpresora() {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(repository.findById(1L)).thenReturn(Optional.of(impresora));

        service.delete(1L);

        verify(repository).delete(impresora);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=ImpresoraServiceTest test`
Expected: FAIL — `ImpresoraService` does not exist.

- [ ] **Step 6: Implement `ImpresoraService`**

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImpresoraService {

    private final ImpresoraRepository repository;

    public List<Impresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Impresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Impresora no encontrada: " + id));
    }

    public Impresora create(ImpresoraRequest request) {
        Impresora impresora = new Impresora();
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    public Impresora update(Long id, ImpresoraRequest request) {
        Impresora impresora = findById(id);
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Impresora impresora, ImpresoraRequest request) {
        impresora.setNombre(request.getNombre());
        impresora.setMarca(request.getMarca());
        impresora.setModelo(request.getModelo());
        impresora.setIp(request.getIp());
        impresora.setPiso(request.getPiso());
        impresora.setArea(request.getArea());
        impresora.setEstado(request.getEstado());
        impresora.setTonerNegro(request.getTonerNegro());
        impresora.setTonerC(request.getTonerC());
        impresora.setTonerM(request.getTonerM());
        impresora.setTonerY(request.getTonerY());
        impresora.setCartucho(request.getCartucho());
        impresora.setDrum(request.getDrum());
        impresora.setFusor(request.getFusor());
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=ImpresoraServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Write failing controller test**

```java
package com.inia.soportedesk.impresoras;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setNombre("HP LaserJet 4ta planta");
        request.setMarca("HP");
        request.setModelo("M404dn");
        request.setIp("10.0.0.50");
        request.setPiso("4");
        request.setArea("Administración");
        request.setEstado("Activa");
        request.setTonerNegro(80);
        request.setTonerC(60);
        request.setTonerM(60);
        request.setTonerY(60);
        request.setCartucho(90);
        request.setDrum(70);
        request.setFusor(85);
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(service.findAll(null)).thenReturn(List.of(impresora));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("HP LaserJet 4ta planta")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(service.create(any())).thenReturn(impresora);

        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("HP LaserJet 4ta planta")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=ImpresoraControllerIT test`
Expected: FAIL — `ImpresoraController` does not exist.

- [ ] **Step 10: Implement `ImpresoraController`**

```java
package com.inia.soportedesk.impresoras;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/impresoras")
@RequiredArgsConstructor
public class ImpresoraController {

    private final ImpresoraService service;

    @GetMapping
    public List<Impresora> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Impresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Impresora> create(@Valid @RequestBody ImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Impresora update(@PathVariable Long id, @Valid @RequestBody ImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=ImpresoraControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras
git commit -m "feat: add Impresoras CRUD endpoints with consumibles data"
```

---

## Task 18: Subida y descarga de drivers de impresoras

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/common/FileStorageException.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/common/FileStorageService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/exception/GlobalExceptionHandler.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/common/FileStorageServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java`

`FileStorageService` reads the storage root from the
`uploads.drivers-dir` property (already configured in Task 1:
`uploads/drivers` for dev, `build/test-uploads/drivers` for test). Files are
stored under `<root>/<impresoraId>/<originalFilename>`.

- [ ] **Step 1: Create `FileStorageException`**

```java
package com.inia.soportedesk.common;

public class FileStorageException extends RuntimeException {

    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public FileStorageException(String message) {
        super(message);
    }
}
```

- [ ] **Step 2: Write failing test for `FileStorageService`**

```java
package com.inia.soportedesk.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(tempDir.toString());
    }

    @Test
    void store_savesFileUnderEntitySubfolder() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        String relativePath = service.store(1L, file);

        assertThat(relativePath).isEqualTo("1/driver-hp.zip");
        Path stored = tempDir.resolve(relativePath);
        assertThat(Files.exists(stored)).isTrue();
        assertThat(Files.readString(stored)).isEqualTo("contenido");
    }

    @Test
    void load_returnsPathToStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());
        String relativePath = service.store(1L, file);

        Path loaded = service.load(relativePath);

        assertThat(Files.exists(loaded)).isTrue();
        assertThat(Files.readString(loaded)).isEqualTo("contenido");
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=FileStorageServiceTest test`
Expected: FAIL — `FileStorageService` does not exist.

- [ ] **Step 4: Implement `FileStorageService`**

```java
package com.inia.soportedesk.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageService {

    private final Path rootDir;

    public FileStorageService(@Value("${uploads.drivers-dir}") String driversDir) {
        this.rootDir = Paths.get(driversDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new FileStorageException("No se pudo crear el directorio de almacenamiento: " + rootDir, e);
        }
    }

    public String store(Long entityId, MultipartFile file) {
        String originalName = Paths.get(file.getOriginalFilename()).getFileName().toString();
        Path targetDir = rootDir.resolve(String.valueOf(entityId));
        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(originalName);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return entityId + "/" + originalName;
        } catch (IOException e) {
            throw new FileStorageException("No se pudo guardar el archivo: " + originalName, e);
        }
    }

    public Path load(String relativePath) {
        Path file = rootDir.resolve(relativePath).normalize();
        if (!file.startsWith(rootDir)) {
            throw new FileStorageException("Ruta de archivo inválida: " + relativePath);
        }
        if (!Files.exists(file)) {
            throw new FileStorageException("Archivo no encontrado: " + relativePath);
        }
        return file;
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=FileStorageServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 6: Add `FileStorageException` handler to `GlobalExceptionHandler`**

Add this method to the existing `GlobalExceptionHandler` class created in
Task 6 (alongside `handleNotFound`, `handleValidation`,
`handleBadCredentials`):

```java
    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ApiError> handleFileStorage(FileStorageException ex) {
        ApiError error = new ApiError(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
```

Add the import `import com.inia.soportedesk.common.FileStorageException;` at
the top of `GlobalExceptionHandler.java`.

- [ ] **Step 7: Add `driverPath` update method to `ImpresoraService`**

Add this method to `ImpresoraService` (created in Task 17), after `update`:

```java
    public Impresora updateDriver(Long id, String driverNombre, String driverVersion, String driverSo, String driverArchivoPath) {
        Impresora impresora = findById(id);
        impresora.setDriverNombre(driverNombre);
        impresora.setDriverVersion(driverVersion);
        impresora.setDriverSo(driverSo);
        impresora.setDriverArchivoPath(driverArchivoPath);
        return repository.save(impresora);
    }
```

- [ ] **Step 8: Write failing test for driver upload/download endpoints**

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.common.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraDriverControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImpresoraService service;

    @Autowired
    private FileStorageService fileStorageService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadDriver_withAdminRole_storesFileAndReturnsImpresora() throws Exception {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, "driver-hp.zip", "1.2", "Windows 10", "1/driver-hp.zip");
        when(service.updateDriver(eq(1L), any(), any(), any(), any())).thenReturn(impresora);

        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        mockMvc.perform(multipart("/api/impresoras/1/driver")
                        .file(file)
                        .param("version", "1.2")
                        .param("so", "Windows 10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.driverArchivoPath", is("1/driver-hp.zip")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void uploadDriver_withSoporteRole_returnsForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        mockMvc.perform(multipart("/api/impresoras/1/driver")
                        .file(file)
                        .param("version", "1.2")
                        .param("so", "Windows 10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void downloadDriver_returnsFileBytes() throws Exception {
        Path stored = fileStorageService.load(fileStorageService.store(2L, new MockMultipartFile("file", "driver-canon.zip", "application/zip", "contenido".getBytes())));

        Impresora impresora = new Impresora(2L, "Canon 2da planta", "Canon", "LBP226dw", "10.0.0.60", "2", "Mesa de Partes", "Activa", 70, 50, 50, 50, 80, 60, 75, "driver-canon.zip", "2.0", "Windows 11", "2/driver-canon.zip");
        when(service.findById(2L)).thenReturn(impresora);

        mockMvc.perform(get("/api/impresoras/2/driver"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(Files.readAllBytes(stored)));
    }
}
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=ImpresoraDriverControllerIT test`
Expected: FAIL — no `/driver` endpoints on `ImpresoraController`.

- [ ] **Step 10: Add driver endpoints to `ImpresoraController`**

Add the following to `ImpresoraController` (created in Task 17): a
constructor field for `FileStorageService`, and the two new endpoints. Since
the class uses `@RequiredArgsConstructor`, simply add the new `final` field
and Lombok will include it in the generated constructor.

```java
    private final FileStorageService fileStorageService;

    @PostMapping("/{id}/driver")
    @PreAuthorize("hasRole('ADMIN')")
    public Impresora uploadDriver(@PathVariable Long id,
                                   @RequestParam("file") MultipartFile file,
                                   @RequestParam("version") String version,
                                   @RequestParam("so") String so) {
        String relativePath = fileStorageService.store(id, file);
        return service.updateDriver(id, file.getOriginalFilename(), version, so, relativePath);
    }

    @GetMapping("/{id}/driver")
    public ResponseEntity<Resource> downloadDriver(@PathVariable Long id) {
        Impresora impresora = service.findById(id);
        Path filePath = fileStorageService.load(impresora.getDriverArchivoPath());
        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + impresora.getDriverNombre() + "\"")
                .body(resource);
    }
```

Add these imports to `ImpresoraController.java`:

```java
import com.inia.soportedesk.common.FileStorageService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=ImpresoraDriverControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Run full test suite**

Run: `cd soportedesk-backend && mvn -q test`
Expected: `BUILD SUCCESS`

- [ ] **Step 13: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/common soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras soportedesk-backend/src/main/java/com/inia/soportedesk/exception soportedesk-backend/src/test/java/com/inia/soportedesk/common soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras
git commit -m "feat: add printer driver upload/download via FileStorageService"
```

---

## Task 19: Dashboard — conteo de registros por módulo

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardCounts.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardControllerIT.java`

`DashboardService` injects the repositories from every functional module
(Tasks 11-17) and exposes a single `DashboardCounts` record with one field
per module, used by the dashboard cards in the frontend.

- [ ] **Step 1: Create `DashboardCounts` DTO**

```java
package com.inia.soportedesk.dashboard;

public record DashboardCounts(
        long licencias,
        long correos,
        long usuariosRed,
        long vpn,
        long wifi,
        long impresoras,
        long equipos
) {
}
```

- [ ] **Step 2: Write failing test for `DashboardService`**

```java
package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.correos.CorreoRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private LicenciaRepository licenciaRepository;

    @Mock
    private CorreoRepository correoRepository;

    @Mock
    private UsuarioRedRepository usuarioRedRepository;

    @Mock
    private VpnRepository vpnRepository;

    @Mock
    private WifiRepository wifiRepository;

    @Mock
    private ImpresoraRepository impresoraRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @InjectMocks
    private DashboardService service;

    @Test
    void getCounts_returnsCountForEachModule() {
        when(licenciaRepository.count()).thenReturn(5L);
        when(correoRepository.count()).thenReturn(12L);
        when(usuarioRedRepository.count()).thenReturn(20L);
        when(vpnRepository.count()).thenReturn(3L);
        when(wifiRepository.count()).thenReturn(4L);
        when(impresoraRepository.count()).thenReturn(7L);
        when(equipoRepository.count()).thenReturn(15L);

        DashboardCounts counts = service.getCounts();

        assertThat(counts.licencias()).isEqualTo(5L);
        assertThat(counts.correos()).isEqualTo(12L);
        assertThat(counts.usuariosRed()).isEqualTo(20L);
        assertThat(counts.vpn()).isEqualTo(3L);
        assertThat(counts.wifi()).isEqualTo(4L);
        assertThat(counts.impresoras()).isEqualTo(7L);
        assertThat(counts.equipos()).isEqualTo(15L);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=DashboardServiceTest test`
Expected: FAIL — `DashboardService` does not exist.

- [ ] **Step 4: Implement `DashboardService`**

```java
package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.correos.CorreoRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final LicenciaRepository licenciaRepository;
    private final CorreoRepository correoRepository;
    private final UsuarioRedRepository usuarioRedRepository;
    private final VpnRepository vpnRepository;
    private final WifiRepository wifiRepository;
    private final ImpresoraRepository impresoraRepository;
    private final EquipoRepository equipoRepository;

    public DashboardCounts getCounts() {
        return new DashboardCounts(
                licenciaRepository.count(),
                correoRepository.count(),
                usuarioRedRepository.count(),
                vpnRepository.count(),
                wifiRepository.count(),
                impresoraRepository.count(),
                equipoRepository.count()
        );
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=DashboardServiceTest test`
Expected: `BUILD SUCCESS`

- [ ] **Step 6: Write failing controller test**

```java
package com.inia.soportedesk.dashboard;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void getCounts_allowsAuthenticatedUser() throws Exception {
        when(service.getCounts()).thenReturn(new DashboardCounts(5, 12, 20, 3, 4, 7, 15));

        mockMvc.perform(get("/api/dashboard/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licencias", is(5)))
                .andExpect(jsonPath("$.usuariosRed", is(20)));
    }

    @Test
    void getCounts_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard/counts"))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 7: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q -Dtest=DashboardControllerIT test`
Expected: FAIL — `DashboardController` does not exist.

- [ ] **Step 8: Implement `DashboardController`**

```java
package com.inia.soportedesk.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/counts")
    public DashboardCounts getCounts() {
        return service.getCounts();
    }
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q -Dtest=DashboardControllerIT test`
Expected: `BUILD SUCCESS`

- [ ] **Step 10: Run full backend test suite**

Run: `cd soportedesk-backend && mvn -q test`
Expected: `BUILD SUCCESS` — all tests from Tasks 1-19 pass.

- [ ] **Step 11: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard
git commit -m "feat: add dashboard counts endpoint"
```

---
