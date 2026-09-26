-- =====================================================================
-- migration_equipo_glpi_cache.sql
--
-- Cache local (ssti) del inventario de equipos de GLPI, para evitar
-- consultas en vivo repetidas contra el MySQL de GLPI en cada request.
-- Se mantiene fresca via: resync completo cada 5 min (@Scheduled),
-- refresco puntual al abrir el detalle de un equipo, refresco puntual
-- tras guardar teclado / dar de baja, y un boton manual "sincronizar
-- ahora". GLPI sigue siendo de solo lectura para este cache (excepto
-- las 2 excepciones ya existentes: teclado y dar de baja, que no
-- cambian con esta migracion).
--
-- Excluye a proposito los campos *_override / codigo_patrimonial de
-- enriquecimiento: esos siguen viviendo solo en dbo.equipos_enrichment.
--
-- Idempotente. No se ejecuta automaticamente
-- (spring.jpa.hibernate.ddl-auto=none, spring.sql.init.mode=never).
-- =====================================================================

IF OBJECT_ID('dbo.equipo_glpi_cache', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipo_glpi_cache (
        computer_id                 BIGINT        NOT NULL PRIMARY KEY,
        nombre_equipo                NVARCHAR(255) NULL,
        numero_serie                  NVARCHAR(150) NULL,
        codigo_interno                 NVARCHAR(100) NULL,
        usuario_contacto                NVARCHAR(200) NULL,
        usuario_telefono                 NVARCHAR(50)  NULL,
        ip_equipo                         NVARCHAR(50)  NULL,
        sede_nombre                        NVARCHAR(200) NULL,
        sede_nombre_completo                 NVARCHAR(300) NULL,
        oficina_id                            NVARCHAR(200) NULL,
        unidad_id                              NVARCHAR(200) NULL,
        fabricante_equipo                       NVARCHAR(150) NULL,
        modelo_equipo                            NVARCHAR(200) NULL,
        tipo_equipo                               NVARCHAR(100) NULL,
        cpu_modelos                                NVARCHAR(500) NULL,
        cpu_fabricantes                             NVARCHAR(200) NULL,
        cpu_conteo                                   BIGINT        NULL,
        cpu_nucleos                                   DECIMAL(10,2) NULL,
        cpu_hilos                                      DECIMAL(10,2) NULL,
        cpu_frecuencia_max                              BIGINT        NULL,
        ram_modulos                                      BIGINT        NULL,
        ram_total_gb                                      DECIMAL(10,2) NULL,
        ram_frecuencia_max                                 NVARCHAR(50)  NULL,
        ram_tipos                                           NVARCHAR(100) NULL,
        ram_modelos                                          NVARCHAR(500) NULL,
        ram_fabricantes                                       NVARCHAR(200) NULL,
        disk_cantidad                                          BIGINT        NULL,
        disk_total_gb                                           DECIMAL(10,2) NULL,
        disk_tipos                                               NVARCHAR(100) NULL,
        disk_interfaces                                           NVARCHAR(100) NULL,
        disk_modelos                                               NVARCHAR(500) NULL,
        mon_cantidad                                                BIGINT        NULL,
        mon_nombres                                                  NVARCHAR(500) NULL,
        mon_modelos                                                   NVARCHAR(500) NULL,
        mon_fabricantes                                                NVARCHAR(200) NULL,
        mon_seriales                                                    NVARCHAR(500) NULL,
        fecha_creacion                                                   DATETIME2     NULL,
        ultima_actualizacion                                              DATETIME2     NULL,
        ultimo_encendido                                                   DATETIME2     NULL,
        eliminado                                                           INT           NULL,
        uuid_equipo                                                          NVARCHAR(64)  NULL,
        -- Campos GLPI adicionales (hoy @Transient en VwInvComputerFull,
        -- aqui persistidos como columnas reales del cache)
        anydesk_id                   NVARCHAR(100) NULL,
        rustdesk_id                   NVARCHAR(100) NULL,
        teclado_marca                  NVARCHAR(100) NULL,
        teclado_modelo                  NVARCHAR(100) NULL,
        teclado_numero_serie              NVARCHAR(100) NULL,
        teclado_codigo_inventario          NVARCHAR(100) NULL,
        teclado_codigo_patrimonial          NVARCHAR(100) NULL,
        monitor1_nombre                      NVARCHAR(200) NULL,
        monitor1_marca                        NVARCHAR(200) NULL,
        monitor1_modelo                        NVARCHAR(200) NULL,
        monitor1_serie                          NVARCHAR(200) NULL,
        monitor2_nombre                          NVARCHAR(200) NULL,
        monitor2_marca                            NVARCHAR(200) NULL,
        monitor2_modelo                            NVARCHAR(200) NULL,
        monitor2_serie                              NVARCHAR(200) NULL,
        synced_at                                    DATETIME2     NOT NULL
    );
END;
GO
