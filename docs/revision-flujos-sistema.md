# Revisión funcional y diagramas de flujo — Sistema de Soporte Técnico INIA

Fecha de revisión: 30 de julio de 2026

## Alcance y criterio

Esta revisión contrasta las rutas de Angular, los guardas de navegación, los
controladores REST, las reglas de autorización, los servicios de negocio y las
integraciones declaradas en el backend. Los diagramas describen el
comportamiento implementado, no un flujo teórico.

Convenciones:

- `READ_modulo`: permiso de consulta.
- `WRITE_modulo`: permiso de administración.
- `ADMIN`: acceso administrativo global.
- Todas las rutas, salvo el inicio de sesión, requieren un JWT válido.
- Las mutaciones relevantes pasan por el filtro de auditoría.

## Resultado general de la revisión

| Área | Consulta | Escritura | Persistencia o integración | Resultado |
|---|---|---|---|---|
| Autenticación | Sesión y perfil | Cambio de contraseña | Base local, BCrypt y JWT | Correcto |
| Dashboard | Indicadores según permisos | No aplica | Servicios de cada módulo | Correcto |
| Usuarios del sistema | Solo administrador | CRUD y permisos | Base local | Correcto |
| Usuarios de red | AD y contratos | Operaciones AD y CRUD de contratos | LDAP/AD y base local | Correcto, depende de AD |
| Correos | Consultas y estadísticas | Solo lectura | Vista/fuente GestionTI | Correcto |
| Equipos | Inventario, ficha y salud | Enriquecimiento y evidencias | GLPI, base local y archivos | Correcto |
| VPN | Registros y KPIs | Solicitud, revisión y antivirus | Base local y normalizada | Correcto |
| Impresoras | Lista, ficha e historial | CRUD, intervenciones y adjuntos | Base local y archivos | Corregido |
| WiFi | Lista y ficha | CRUD | Base local | Correcto |
| Licencias | Lista y ficha | CRUD | Base local y cifrado | Correcto |
| Herramientas | Ping, datos y órdenes | Gestión de órdenes | Red y base local | Correcto |
| Catálogos | Catálogos compartidos | CRUD y drivers | Base local y archivos | Correcto |
| Auditoría | Consulta con filtros | Automática | Base local | Correcto |
| Tiempo real | Suscripción SSE | Emisión interna | Memoria de aplicación | Correcto |

## Flujo general del sistema

```mermaid
flowchart TD
    U[Usuario] --> FE[Angular]
    FE --> A{¿Existe JWT válido?}
    A -->|No| L[Inicio de sesión]
    L --> AUTH[API de autenticación]
    AUTH --> LOCAL[(Base local)]
    AUTH --> JWT[Emitir JWT con rol y permisos]
    JWT --> FE
    A -->|Sí| G[Guardas por módulo]
    G --> API[API Spring Boot]
    API --> S{Servicio solicitado}

    S --> LOCAL
    S --> GLPI[(GLPI)]
    S --> GTI[(GestionTI INIA)]
    S --> AD[(Active Directory)]
    S --> FS[(Almacenamiento de archivos)]

    API --> AUD[Filtro de auditoría]
    AUD --> LOCAL
    API --> SSE[Eventos en tiempo real]
    SSE --> FE
    API --> FE
```

## 1. Autenticación y sesión

```mermaid
flowchart TD
    U[Usuario] --> L[Ingresar usuario y contraseña]
    L --> API[POST /api/auth/login]
    API --> V{Credenciales válidas y cuenta activa}
    V -->|No| E[401 sin revelar información sensible]
    V -->|Sí| P[Cargar rol y permisos]
    P --> J[Generar JWT]
    J --> S[Guardar sesión en frontend]
    S --> M[GET /api/auth/me]
    M --> APP[Acceso al sistema]
    APP --> CP[Cambiar contraseña]
    CP --> CV[Validar contraseña actual y nueva]
    CV --> HASH[Guardar hash BCrypt]
```

Uso: el usuario inicia sesión, el interceptor incorpora el JWT y los guardas
deciden qué módulos y acciones puede abrir.

## 2. Dashboard general

```mermaid
flowchart TD
    U[Usuario autenticado] --> D[Dashboard]
    D --> C[GET /api/dashboard/counts]
    D --> P{Permisos disponibles}
    P --> UR[Usuarios de red por ubicación]
    P --> LI[Licencias por tipo]
    P --> OS[Órdenes de servicio]
    P --> IM[Impresoras por estado]
    P --> VP[VPN por estado]
    P --> WF[WiFi por estado]
    P --> CO[Correos por estado]
    P --> EQ[Equipos por tipo]
    UR --> UI[Tarjetas y gráficos]
    LI --> UI
    OS --> UI
    IM --> UI
    VP --> UI
    WF --> UI
    CO --> UI
    EQ --> UI
```

Uso: se consultan solamente los desgloses autorizados para el usuario. La
ausencia de un permiso no debe impedir que carguen los demás indicadores.

## 3. Usuarios del sistema y permisos

```mermaid
flowchart TD
    A[Administrador] --> L[Listar usuarios]
    L --> C[Crear usuario]
    L --> E[Editar usuario]
    L --> X[Eliminar usuario]
    C --> V[Validar username y contraseña]
    E --> P[Asignar rol, estado y permisos]
    P --> M[Validar módulos permitidos]
    V --> DB[(Usuarios y permisos)]
    P --> DB
    X --> R{¿Es el propio usuario?}
    R -->|Sí| B[Bloquear operación]
    R -->|No| DB
```

Uso: este módulo está protegido por rol `ADMIN`. Los permisos emitidos en el
JWT controlan lectura y escritura en los demás módulos.

## 4. Usuarios de red y Active Directory

```mermaid
flowchart TD
    U[Soporte autorizado] --> Q[Buscar usuarios]
    Q --> CACHE[(Caché local AD)]
    Q --> AD[(Active Directory)]
    U --> S[Sincronización AD]
    S --> AD
    S --> CACHE
    U --> O{Operación administrativa}
    O --> C[Crear usuario]
    O --> H[Habilitar o deshabilitar]
    O --> D[Desbloquear]
    O --> R[Restablecer contraseña]
    O --> G[Agregar o quitar grupos]
    O --> OU[Mover de unidad organizativa]
    C --> AD
    H --> AD
    D --> AD
    R --> AD
    G --> AD
    OU --> AD
    AD --> RES[Respuesta normalizada]
    RES --> CACHE
    RES --> UI[Actualizar interfaz]
```

Uso: consultas requieren `READ_usuarios-red`; mutaciones requieren
`WRITE_usuarios-red`. La disponibilidad operativa depende de LDAP/AD.

### Contratos de usuarios de red

```mermaid
flowchart TD
    U[Soporte] --> B[Buscar usuario o contrato]
    B --> L[Listar contratos]
    L --> C[Crear]
    L --> E[Editar]
    L --> X[Eliminar]
    C --> V[Validar persona, usuario, fechas y tipo]
    E --> V
    V --> DB[(Contratos y tipos de contrato)]
    DB --> Q[Consultas consolidadas]
```

## 5. Correos

```mermaid
flowchart TD
    U[Usuario con lectura] --> F[Filtros]
    F --> Q[Consultar correos]
    Q --> GTI[(Fuente GestionTI)]
    GTI --> R[Resultados]
    U --> K[KPIs]
    U --> D[Dashboard completo]
    U --> S[Sedes]
    U --> DP[Dependencias]
    DP --> SD[Subdependencias]
    K --> GTI
    D --> GTI
    S --> GTI
    SD --> GTI
```

Uso: es un módulo de consulta. Los filtros de sede, dependencia y
subdependencia se obtienen de la misma fuente para mantener consistencia.

## 6. Equipos e inventario

```mermaid
flowchart TD
    U[Usuario con lectura] --> I[Inventario]
    I --> F[Filtrar y buscar]
    F --> GLPI[(Vista GLPI)]
    GLPI --> L[Listado]
    L --> D[Ficha del equipo]
    D --> SW[Software]
    D --> H[Historial]
    D --> EV[Evidencias]
    U --> SA[Salud del inventario]
    U --> DA[Dashboard]

    W[Usuario con escritura] --> EN[Editar enriquecimiento]
    EN --> V[Validar catálogos y datos]
    V --> DB[(Enriquecimiento local)]
    DB --> SYNC[Sincronizar asignación normalizada]

    W --> UP[Subir evidencia]
    UP --> VF[Validar tamaño y tipo]
    VF --> FS[(Archivo)]
    VF --> DB
```

Uso: GLPI es la fuente del inventario; la información revisada, las
asignaciones y las evidencias se guardan localmente sin alterar la fuente
externa.

## 7. VPN

```mermaid
stateDiagram-v2
    [*] --> Registrada: crear solicitud
    Registrada --> Observada: observar
    Observada --> Registrada: corregir/editar
    Registrada --> Aprobada: aprobar
    Registrada --> Rechazada: rechazar
    Observada --> Aprobada: aprobar
    Observada --> Rechazada: rechazar
    Aprobada --> Aprobada: actualizar antivirus
    Rechazada --> [*]
```

```mermaid
flowchart TD
    U[Usuario VPN] --> L[Consultar registros y KPIs]
    S[Solicitante autorizado] --> C[Crear o editar solicitud]
    C --> V[Validar usuario, fechas y datos]
    V --> DB[(VPN)]
    A[Aprobador autorizado] --> R[Revisar]
    R --> AP[Aprobar]
    R --> OB[Observar]
    R --> RE[Rechazar]
    AP --> DB
    OB --> DB
    RE --> DB
    A --> CFG[Configuración institucional]
    CFG --> DB
    DB --> N[Sincronización normalizada]
```

Uso: `WRITE_solicitar-vpn` y `WRITE_aprobar-vpn` separan responsabilidades.
La eliminación definitiva queda reservada al administrador.

## 8. Impresoras

```mermaid
flowchart TD
    U[Usuario con lectura] --> L[Listar y buscar]
    L --> F[Ficha técnica]
    F --> T[Tóner y consumibles]
    F --> D[Driver del modelo]
    F --> H[Intervenciones]

    W[Usuario con escritura] --> C[Crear o editar]
    C --> V1[Validar serie, inventario, patrimonio e IP]
    V1 --> V2[Validar sede, dependencia y subdependencia]
    V2 --> DB[(Impresoras y catálogos)]

    W --> I[Registrar intervención]
    I --> A[Adjuntar evidencias]
    A --> FS[(Archivos)]
    I --> DB

    W --> X[Eliminar impresora]
    X --> TX[Transacción]
    TX --> FS
    TX --> DB
```

Uso: el listado ya evita ciclos de serialización en dependencias importadas.
Las ubicaciones se validan jerárquicamente antes de guardar.

## 9. WiFi

```mermaid
flowchart TD
    U[Usuario con lectura] --> L[Listar redes o registros WiFi]
    L --> B[Buscar y filtrar]
    B --> F[Ver ficha]
    W[Usuario con escritura] --> C[Crear]
    W --> E[Editar]
    W --> X[Eliminar]
    C --> V[Validar solicitud]
    E --> V
    V --> DB[(WiFi)]
    X --> DB
```

Uso: las consultas requieren lectura y las mutaciones escritura. El dashboard
general consume el desglose WiFi cuando el usuario tiene permiso.

## 10. Licencias

```mermaid
flowchart TD
    U[Usuario con lectura] --> L[Listar y buscar]
    L --> F[Ver licencia y activaciones]
    W[Usuario con escritura] --> C[Crear]
    W --> E[Editar]
    W --> X[Eliminar]
    C --> V[Validar tipo, fechas, cantidad y activaciones]
    E --> V
    V --> ENC[Cifrar secretos de activación]
    ENC --> DB[(Licencias)]
    X --> DB
    DB --> D[Dashboard por tipo]
```

Uso: las credenciales sensibles se convierten mediante el componente de
cifrado antes de persistirse; no deben aparecer en logs ni respuestas de error.

## 11. Herramientas y órdenes de servicio

```mermaid
flowchart TD
    U[Usuario autorizado] --> P[Ping]
    P --> VP[Validar host]
    VP --> NET[Ejecutar diagnóstico de red]
    NET --> R[Resultado limitado]

    U --> DE[Consultar datos de equipo]
    DE --> GLPI[(GLPI o fuente técnica)]

    U --> OS[Órdenes de servicio]
    OS --> C[Crear]
    OS --> A[Iniciar, completar o cancelar]
    OS --> X[Eliminar]
    C --> DB[(Órdenes)]
    A --> ST[Validar transición de estado]
    ST --> DB
    X --> DB
```

Uso: los parámetros de diagnóstico se validan antes de invocar procesos o
recursos de red. Las órdenes usan acciones explícitas para cambiar de estado.

## 12. Catálogos

```mermaid
flowchart TD
    U[Usuario autenticado] --> R[Leer catálogos compartidos]
    R --> S[Sedes]
    S --> D[Dependencias]
    D --> SD[Subdependencias]
    R --> TC[Tipos de contrato, licencia y bien]
    R --> TI[Tipos de impresora]
    R --> MI[Marcas y modelos]
    R --> TE[Tipos normalizados de equipo]

    W[Administrador de catálogos] --> CRUD[Crear, editar o eliminar]
    CRUD --> V[Validar unicidad y relaciones]
    V --> DB[(Catálogos)]
    W --> DR[Subir driver de modelo]
    DR --> VF[Validar archivo]
    VF --> FS[(Drivers)]
    VF --> DB
```

Uso: la lectura de catálogos se comparte con formularios de otros módulos. La
escritura requiere `WRITE_catalogos`.

## 13. Auditoría

```mermaid
flowchart TD
    U[Solicitud autenticada] --> JWT[Filtro JWT]
    JWT --> A[Filtro de auditoría]
    A --> API[Controlador y servicio]
    API --> R[Respuesta HTTP]
    R --> EX[Extraer usuario, ruta, método, estado e identificador]
    EX --> DB[(Movimientos de auditoría)]
    Q[Usuario con READ_auditoria] --> F[Filtrar movimientos]
    F --> DB
```

Uso: la auditoría se ejecuta después de autenticar y registra las mutaciones
sin almacenar contraseñas, tokens ni cuerpos sensibles.

## 14. Eventos en tiempo real

```mermaid
sequenceDiagram
    participant UI as Angular
    participant SSE as API /realtime/events
    participant MOD as Módulo de negocio
    UI->>SSE: Abrir conexión autenticada
    SSE-->>UI: Conexión SSE activa
    MOD->>SSE: Publicar cambio
    SSE-->>UI: Evento de actualización
    UI->>UI: Recargar datos afectados
    UI->>SSE: Reconectar si se pierde la conexión
```

Uso: cualquier usuario autenticado puede mantener la suscripción; los datos
posteriores siguen protegidos por los permisos de sus respectivos endpoints.

## Validaciones transversales revisadas

1. El frontend protege navegación mediante guardas, pero la autorización
   efectiva está también en el backend.
2. Las operaciones administrativas usan `@PreAuthorize` con rol o autoridad.
3. Las credenciales se mantienen fuera de la documentación y los mensajes de
   error se normalizan.
4. Los archivos de equipos, impresoras y drivers se validan y se relacionan con
   una entidad antes de descargarse o eliminarse.
5. Los cambios se auditan después de validar el JWT.
6. Las fuentes externas (AD, GLPI y GestionTI) están separadas de los datos
   locales de enriquecimiento.
7. La lista de impresoras ya no serializa `dependenciaPadre`, evitando la
   referencia circular observada con los datos importados.

## Riesgos operativos y mantenimiento recomendado

- Active Directory, GLPI y GestionTI pueden dejar consultas parciales o no
  disponibles aunque la aplicación local continúe levantada.
- Los archivos y la base de datos no constituyen una única transacción física;
  se debe respaldar ambos repositorios.
- Algunos catálogos se encuentran referenciados por datos operativos; su
  eliminación puede ser rechazada por integridad referencial.
- El módulo de impresoras contiene registros heredados incompletos. Deben
  depurarse con información oficial, sin inventar IP, serie o patrimonio.
- Los eventos SSE son efímeros; después de una reconexión la interfaz debe
  volver a consultar el endpoint correspondiente.

## Lista de comprobación de aceptación

- Iniciar sesión y comprobar que el menú coincida con los permisos.
- Probar lectura y escritura con un usuario limitado y con un administrador.
- Abrir cada listado, ficha y dashboard.
- Comprobar una validación fallida y una operación exitosa por módulo.
- Verificar que las mutaciones aparezcan en Auditoría.
- Confirmar carga, descarga y eliminación de un archivo de prueba.
- Simular indisponibilidad de AD/GLPI en un ambiente de pruebas.
- Comprobar reconexión SSE y actualización de pantallas.
- Respaldar base de datos y almacenamiento antes de depurar datos heredados.
