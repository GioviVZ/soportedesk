# Acceso LAN por HTTPS — habilitar cámara/micrófono desde cualquier equipo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Servir el acceso LAN de SoporteDesk por HTTPS (certificado autofirmado) con redirección automática desde HTTP, para que `getUserMedia` (las pruebas de Micrófono/Cámara de Herramientas) funcione desde cualquier equipo de la red, no solo desde la máquina del backend.

**Architecture:** Cambio puramente de infraestructura, fuera del repo de SoporteDesk — un certificado autofirmado para la IP LAN y dos bloques `server` en el `nginx.conf` portable que ya sirve el acceso LAN (uno HTTP que redirige, uno HTTPS que sirve el contenido real). Cero cambios de código en el repo.

**Tech Stack:** OpenSSL (vía Git Bash/MSYS2, ya instalado), nginx 1.30.3 portable (ya tiene `--with-http_ssl_module` compilado).

## Global Constraints

- Ningún archivo del repo de SoporteDesk se modifica — todo el trabajo es sobre `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\`.
- El certificado y la clave (`cert.pem`/`cert.key`) no se versionan en ningún repositorio — son material local.
- El acceso por HTTP (puerto 80) se mantiene disponible, pero pasa a redirigir a HTTPS (no se elimina ni se bloquea).
- IP del servidor: `172.16.41.214` (confirmar con `ipconfig` o `Get-NetIPAddress` si esto cambió desde que se escribió el plan).
- nginx ya está corriendo (4 procesos `nginx.exe` confirmados) — usar `-s reload`, no relanzarlo desde cero.

---

### Task 1: Certificado autofirmado + HTTPS en nginx

**Files:**
- Create: `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\generate-cert.sh`
- Create: `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\cert.pem` (generado por el script, no se escribe a mano)
- Create: `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\cert.key` (generado por el script, no se escribe a mano)
- Modify: `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\nginx.conf`

**Interfaces:**
- Consumes: nada (primera y única tarea del plan).
- Produces: nada que otra tarea consuma.

- [ ] **Step 1: Crear el script de generación del certificado**

Crear `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\generate-cert.sh`:

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

- [ ] **Step 2: Ejecutar el script para generar el certificado**

Run:
```bash
cd "/c/Users/gvivanco/Downloads/nginx-1.30.3/nginx-1.30.3/conf" && bash generate-cert.sh
```
Expected: termina con `Certificado generado para IP 172.16.41.214. Recargar nginx con: ../nginx.exe -s reload`, y existen los archivos `cert.pem` y `cert.key` en esa misma carpeta (verificar con `ls -la cert.*`).

- [ ] **Step 3: Reemplazar el bloque `server` de `nginx.conf`**

En `C:\Users\gvivanco\Downloads\nginx-1.30.3\nginx-1.30.3\conf\nginx.conf`, buscar el bloque completo que va desde `server {` (el que tiene `listen 80;`) hasta el `}` que lo cierra, **antes** del comentario `# another virtual host using mix of IP-, name-, and port-based configuration`:

```nginx
    server {
        listen       80;
        server_name  localhost;

        #access_log  logs/host.access.log  main;

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

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }
```

Reemplazar por estos dos bloques:

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

- [ ] **Step 4: Quitar el bloque comentado de ejemplo "HTTPS server"**

En el mismo archivo, buscar y eliminar (ya queda redundante, hay un bloque HTTPS real desde el Step 3):

```nginx
    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}
```

- [ ] **Step 5: Validar la sintaxis del config**

Run:
```bash
cd "/c/Users/gvivanco/Downloads/nginx-1.30.3/nginx-1.30.3" && ./nginx.exe -t
```
Expected: dos líneas terminando en `... syntax is ok` y `... test is successful`. Si falla, **no continuar al Step 6** — revisar el Step 3/4 (probablemente una llave `{`/`}` desbalanceada).

- [ ] **Step 6: Recargar nginx**

Run:
```bash
./nginx.exe -s reload
```
Expected: sin salida (o sin error) — nginx ya estaba corriendo, esto le hace recargar el config sin caída de servicio.

- [ ] **Step 7: Verificación manual desde un segundo equipo**

No automatizable — requiere otro equipo real conectado a la misma red, con cámara y/o micrófono.

Desde ese segundo equipo:
1. Abrir `http://172.16.41.214/` en el navegador → debe redirigir solo a `https://172.16.41.214/`.
2. El navegador muestra una advertencia de certificado no confiable (es esperado, es autofirmado) → click en "Avanzado" → "Continuar a 172.16.41.214 (no seguro)" (el texto exacto varía por navegador).
3. Confirmar que el sitio carga igual que antes (login, dashboard, módulos).
4. Entrar a Herramientas → tab "Micrófono" → "Iniciar prueba" → el navegador debe pedir permiso de micrófono (antes del cambio, no pedía nada porque la API estaba bloqueada por contexto inseguro).
5. Repetir con el tab "Cámara".

- [ ] **Step 8: Guardar referencia en memoria del proyecto**

No es un commit de git (nada de esto vive en el repo) — pero sí registrar en la memoria del proyecto (`project_soportedesk_inia.md` o el archivo de memoria correspondiente) que el acceso LAN ahora es HTTPS-only (con redirección desde HTTP), la ubicación del cert/script, y la fecha de expiración del certificado (10 años desde la fecha de generación), para que una sesión futura no se sorprenda con la advertencia del navegador ni necesite re-descubrir esta configuración.
