# Acceso LAN por HTTPS — habilitar cámara/micrófono desde cualquier equipo

## Contexto

Las pruebas de "Micrófono" y "Cámara" del módulo Herramientas (`docs/superpowers/specs/2026-06-26-herramientas-mic-camara-design.md`) usan `navigator.mediaDevices.getUserMedia()`, que el navegador solo permite en un **contexto seguro** (HTTPS o `localhost`). El acceso LAN actual a SoporteDesk (`docs/superpowers/specs` — ver memoria "Acceso LAN vía nginx", 2026-06-19) sirve la SPA por **HTTP plano** en el puerto 80, vía un nginx portable instalado en `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\` (fuera del repo de SoporteDesk). Por eso esas dos pruebas solo funcionan en la máquina donde corre el backend (porque ahí se accede como `http://localhost:4200` o, sirviendo el build vía nginx, como `http://localhost/`) — desde cualquier otro equipo de la red (`http://172.16.41.214/`) el navegador bloquea `getUserMedia` antes de que el código de Angular llegue a ejecutarse.

Este servidor es de **test**, no de producción (confirmado por el usuario el 2026-06-25) — no hay dominio público ni CA interna disponible hoy.

## Objetivo

Servir el acceso LAN por HTTPS con un certificado autofirmado, y redirigir todo el tráfico HTTP a HTTPS, para que cámara/micrófono funcionen desde cualquier equipo de la red, no solo desde la máquina del backend.

## Alcance

**Dentro de alcance:**
- Generar un certificado autofirmado para la IP `172.16.41.214` (con `subjectAltName=IP:...`, válido 10 años).
- Modificar `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\nginx.conf`: el bloque `server { listen 80; }` pasa a redirigir todo a HTTPS; el contenido que hoy sirve (root del build de Angular + proxy de `/api/`) se mueve a un nuevo bloque `server { listen 443 ssl; }`.
- Un script de regeneración del certificado (para cuando expire en 10 años, o si la IP de esta máquina cambia), guardado junto al propio nginx — no en el repo de SoporteDesk.
- Verificación manual desde un segundo equipo de la red.

**Fuera de alcance (explícito):**
- Cualquier cambio de código en el repo de SoporteDesk (frontend o backend) — el código de cámara/micrófono ya funciona correctamente en contexto seguro, confirmado en `localhost`; solo faltaba que el acceso LAN también lo fuera.
- Certificado de una CA real o de una CA interna de INIA — no hay dominio público ni CA disponible hoy; queda para cuando se migre a producción (ver memoria del proyecto, sección de credenciales de BD de test vs producción, mismo patrón: "cuando me den el OK").
- Documentar este nginx en `docs/ARQUITECTURA.md` — ese documento describe el despliegue general de la aplicación (independiente de IP/servidor); este nginx con IP fija y certificado autofirmado es específico de este servidor de test, que va a cambiar en la migración a producción. Queda documentado como nota operativa (memoria del proyecto + el script de regeneración).
- Bloquear o eliminar el acceso por HTTP — se mantiene escuchando en el puerto 80, solo que ahora redirige a HTTPS en vez de servir contenido directamente.

## Diseño

### 1. Certificado autofirmado

Generado con OpenSSL (ya disponible en `PATH` vía Git Bash/MSYS2 en esta máquina — confirmado `openssl 3.5.5`), con SAN de tipo IP (los navegadores modernos ignoran el `CN` si no hay `subjectAltName`):

```bash
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout cert.key -out cert.pem \
  -subj "/CN=172.16.41.214" \
  -addext "subjectAltName=IP:172.16.41.214"
```

Ejecutado dentro de `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\`, genera `cert.pem` y `cert.key` ahí mismo — exactamente los nombres que ya espera el bloque HTTPS de ejemplo que trae nginx por defecto (comentado en el `nginx.conf` actual).

### 2. `nginx.conf`

El bloque `server { listen 80; ... }` actual (líneas 35-85 del archivo de hoy) — que sirve el `root` del build de Angular y proxea `/api/` — se reemplaza por dos bloques:

```nginx
    server {
        listen       80;
        server_name  localhost;

        return 301 https://$host$request_uri;
    }

    server {
        listen       443 ssl;
        server_name  localhost;

        ssl_certificate      cert.pem;
        ssl_certificate_key  cert.key;

        root   "C:/SistemadeSoporteTecnicoINIA/soportedesk-frontend/dist/soportedesk-frontend/browser";
        index  index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:8080/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
```

El antiguo bloque comentado de ejemplo "HTTPS server" (líneas 102-121 del archivo de hoy) se elimina — queda redundante una vez que existe un bloque HTTPS real. Los bloques de ejemplo de PHP/FastCGI/`.htaccess` (comentados, nunca usados, boilerplate de instalación por defecto) también se eliminan al mover el contenido al nuevo bloque, para no arrastrar ruido sin usar.

`server_name` se mantiene en `localhost` en ambos bloques. El certificado solo cubre la IP por SAN (no `localhost`), así que entrar a `https://localhost/` vía nginx mostraría una advertencia adicional de "nombre no coincide" — fuera de alcance resolverlo, porque en esta máquina ya existe una vía de acceso a `getUserMedia` en contexto seguro sin pasar por nginx en absoluto: `ng serve` sirviendo en `http://localhost:4200`, que es el flujo que ya se usó para verificar cámara/micrófono hasta ahora.

### 3. Script de regeneración

`C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\generate-cert.sh`:

```bash
#!/usr/bin/env bash
# Regenera el certificado autofirmado de nginx para el acceso LAN de SoporteDesk.
# Correr desde Git Bash, parado en esta misma carpeta (conf/).
# Usar de nuevo si: el certificado expira (valido 10 anios desde que se genero),
# o si la IP LAN de esta maquina cambia (verificar con: ipconfig).

set -euo pipefail

IP="${1:-172.16.41.214}"

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout cert.key -out cert.pem \
  -subj "/CN=${IP}" \
  -addext "subjectAltName=IP:${IP}"

echo "Certificado generado para IP ${IP}. Recargar nginx con: ../nginx.exe -s reload"
```

### 4. Aplicar y verificar

```bash
cd "C:/Users/gvivanco/Downloads/nginx-1.30.3/nginx-1.30.3"
./nginx.exe -t          # valida sintaxis antes de recargar
./nginx.exe -s reload   # aplica sin caída de servicio (nginx ya está corriendo)
```

Verificación manual (no automatizable — requiere un segundo equipo real en la red con cámara/micrófono):
1. Desde otro equipo de la red, abrir `http://172.16.41.214/` — debe redirigir solo a `https://172.16.41.214/`.
2. El navegador muestra la advertencia de certificado no confiable — aceptar ("Avanzado" → "Continuar/Proceder de todas formas").
3. Entrar a Herramientas → Micrófono, presionar "Iniciar prueba" — debe pedir permiso de micrófono (antes no pedía nada, porque el navegador bloqueaba la API entera).
4. Repetir con Cámara.
5. Confirmar que el resto del sitio (login, dashboard, otros módulos) sigue funcionando igual por HTTPS.

## Testing

No aplica testing automatizado — no hay código del repo de SoporteDesk involucrado, y la verificación de `getUserMedia` en un contexto de red real con hardware real no es automatizable en este entorno (misma limitación documentada en el plan de cámara/micrófono original).

## Resumen de archivos

**Fuera del repo de SoporteDesk** (todos dentro de `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\`):
- Crear: `cert.pem`, `cert.key` (generados por OpenSSL, no versionados en ningún repo — son secretos/material criptográfico local)
- Crear: `generate-cert.sh`
- Modificar: `nginx.conf`

**Dentro del repo:** ningún archivo — este spec queda como registro de la decisión, sin plan de implementación con tareas de código.
