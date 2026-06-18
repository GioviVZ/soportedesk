-- =============================================================
-- Fix: columnas faltantes en usuarios_red (fecha_creacion, numero_contrato)
-- Causa: se agregaron al código en una sesión anterior pero nunca se
-- migraron a la base de datos real. Ejecutar en SSMS contra la BD ssti.
-- =============================================================
USE ssti;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.usuarios_red') AND name = 'fecha_creacion'
)
    ALTER TABLE dbo.usuarios_red ADD fecha_creacion DATE NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.usuarios_red') AND name = 'numero_contrato'
)
    ALTER TABLE dbo.usuarios_red ADD numero_contrato NVARCHAR(100) NULL;
GO

-- =============================================================
-- Auditoría: compara TODAS las tablas/columnas esperadas (según
-- schema.sql actual) contra lo que existe realmente en la BD.
-- Si la lista de resultados sale vacía, no falta nada más.
-- =============================================================
;WITH esperado (tabla, columna) AS (
    SELECT * FROM (VALUES
        ('sedes','id'),('sedes','nombre'),
        ('dependencias','id'),('dependencias','nombre'),('dependencias','sede_id'),
        ('subdependencias','id'),('subdependencias','nombre'),('subdependencias','dependencia_id'),
        ('tipos_contrato','id'),('tipos_contrato','nombre'),
        ('usuarios','id'),('usuarios','username'),('usuarios','password_hash'),('usuarios','nombre'),('usuarios','rol'),('usuarios','activo'),
        ('permisos','id'),('permisos','usuario_id'),('permisos','modulo'),
        ('usuarios_red','id'),('usuarios_red','usuario'),('usuarios_red','nombre'),('usuarios_red','apellidos'),
        ('usuarios_red','grupo'),('usuarios_red','ultimo_login'),('usuarios_red','estado'),
        ('usuarios_red','sede_id'),('usuarios_red','dependencia_id'),('usuarios_red','subdependencia_id'),
        ('usuarios_red','tipo_contrato_id'),('usuarios_red','fecha_fin_contrato'),
        ('usuarios_red','fecha_creacion'),('usuarios_red','numero_contrato'),
        ('equipos','id'),('equipos','numero_serie'),('equipos','codigo_patrimonial'),('equipos','codigo_inventario'),
        ('equipos','tipo'),('equipos','marca'),('equipos','modelo'),('equipos','host'),('equipos','ip'),
        ('equipos','usuario_red_id'),('equipos','sede_id'),('equipos','dependencia_id'),('equipos','subdependencia_id'),
        ('equipos','asignado'),('equipos','estado'),
        ('impresoras','id'),('impresoras','nombre'),('impresoras','marca'),('impresoras','modelo'),('impresoras','ip'),
        ('impresoras','sede_id'),('impresoras','dependencia_id'),('impresoras','subdependencia_id'),('impresoras','estado'),
        ('impresoras','modelo_toner_negro'),('impresoras','modelo_toner_c'),('impresoras','modelo_toner_m'),('impresoras','modelo_toner_y'),
        ('impresoras','modelo_cartucho'),('impresoras','modelo_drum'),('impresoras','modelo_fusor'),
        ('impresoras','driver_nombre'),('impresoras','driver_version'),('impresoras','driver_so'),('impresoras','driver_archivo_path'),
        ('correos','id'),('correos','usuario'),('correos','nombre'),('correos','apellidos'),('correos','correo'),('correos','estado'),
        ('correos','sede_id'),('correos','dependencia_id'),('correos','subdependencia_id'),('correos','tipo_contrato_id'),
        ('correos','fecha_fin_contrato'),('correos','creado'),
        ('licencias','id'),('licencias','cantidad'),('licencias','licencia'),('licencias','correo'),('licencias','clave'),
        ('licencias','orden_compra'),('licencias','anio'),
        ('vpn','id'),('vpn','usuario_red_id'),('vpn','equipo_id'),('vpn','ip_asignada'),('vpn','vence'),('vpn','estado'),
        ('vpn','tiene_antivirus'),('vpn','vencimiento_antivirus'),('vpn','usuario_vpn'),('vpn','credencial_vpn'),
        ('wifi','id'),('wifi','ssid'),('wifi','clave'),('wifi','ubicacion'),('wifi','tipo'),('wifi','estado')
    ) AS t(tabla, columna)
)
SELECT e.tabla AS tabla_con_columna_faltante, e.columna AS columna_faltante
FROM esperado e
LEFT JOIN INFORMATION_SCHEMA.COLUMNS c
    ON c.TABLE_SCHEMA = 'dbo' AND c.TABLE_NAME = e.tabla AND c.COLUMN_NAME = e.columna
WHERE c.COLUMN_NAME IS NULL
ORDER BY e.tabla, e.columna;
GO
