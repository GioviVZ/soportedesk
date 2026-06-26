# Cambiar contraseña (self-service)

## Problema

No existe ninguna forma para que un usuario del sistema (ADMIN o SOPORTE) cambie su propia contraseña desde la UI. El módulo "Usuarios de Sistema" (`UsuarioSistemaController`/`Service`) solo permite que un ADMIN resetee la clave de usuarios con rol SOPORTE — el ADMIN no tiene ninguna vía para cambiar la suya (hoy se hace por SQL directo).

## Alcance

Self-service: cualquier usuario autenticado (ADMIN o SOPORTE) puede cambiar **su propia** contraseña desde el header de la aplicación, confirmando su contraseña actual.

Fuera de alcance: no se modifica `UsuarioSistemaController`/`Service` (sigue siendo "admin resetea password de otro usuario SOPORTE"). Esta es una vía nueva e independiente.

## Backend

### Nuevo endpoint

`POST /api/auth/cambiar-password` en `AuthController` — sin `@PreAuthorize`, solo requiere estar autenticado (aplica el filtro JWT estándar; cualquier rol puede llamarlo para sí mismo).

### DTO: `CambiarPasswordRequest`

```java
@NotBlank
private String passwordActual;

@NotBlank
@Size(min = 6)
private String passwordNueva;
```

### Lógica

1. Obtener el usuario autenticado vía `SecurityContextHolder.getContext().getAuthentication().getName()` (mismo patrón que `/me`), buscarlo con `usuarioRepository.findByUsername(...)`.
2. Verificar `passwordEncoder.matches(request.getPasswordActual(), usuario.getPasswordHash())`.
   - Si no coincide → `400 Bad Request` con `{ "message": "La contraseña actual es incorrecta" }`.
3. Si coincide: `usuario.setPasswordHash(passwordEncoder.encode(request.getPasswordNueva()))`, guardar.
4. Responder `200 OK` sin body (o `{ "message": "Contraseña actualizada" }`).

No se crea un servicio nuevo: la lógica vive directamente en `AuthController`, inyectando `PasswordEncoder` (igual de simple que `/login` y `/me`, que ya están inline ahí).

## Frontend

### `AuthService`

Nuevo método:

```typescript
cambiarPassword(passwordActual: string, passwordNueva: string): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/cambiar-password`, { passwordActual, passwordNueva });
}
```

### `CambiarPasswordModalComponent` (nuevo, en `layout/header/`)

Standalone, reactive form, reutiliza `<app-modal>` compartido (mismo patrón que `VpnAntivirusFormComponent` + `vpn-list`'s `antivirusOpen`).

Campos: contraseña actual, nueva contraseña, confirmar nueva contraseña.

Validación cliente:
- Los tres campos requeridos.
- `passwordNueva` con `Validators.minLength(6)`.
- `confirmarPassword` debe coincidir con `passwordNueva` (validador del form, error inline si no coincide).

Al enviar: llama a `AuthService.cambiarPassword(...)`.
- Éxito → emite evento `saved`, el padre cierra el modal y muestra un mensaje breve de confirmación.
- Error (400 del backend, clave actual incorrecta) → muestra `errorMessage` inline en el propio modal (mismo patrón que `LoginComponent.errorMessage`), sin cerrar el modal.

### `HeaderComponent`

- El `user-chip` se vuelve clickeable (`(click)="toggleMenu()"`) y despliega un pequeño dropdown con una opción: "Cambiar contraseña". El botón "Salir" existente no se toca.
- Nuevo estado: `menuOpen = false`, `cambiarPasswordOpen = false`.
- Clic en "Cambiar contraseña" cierra el dropdown y abre `<app-cambiar-password-modal [open]="cambiarPasswordOpen" ...>`.

## Testing

- `AuthServiceTest`/`AuthControllerIT` no se modifican (los `*ControllerIT` ya están rotos por infraestructura H2 vs SQL Server, ver memoria de proyecto — no se intenta arreglar eso aquí). Se agrega un test unitario nuevo si aplica, pero el válido es probar manualmente vía `ng serve` + backend corriendo.
- Frontend: smoke test manual (login → abrir dropdown → cambiar contraseña → re-login con la nueva clave).
