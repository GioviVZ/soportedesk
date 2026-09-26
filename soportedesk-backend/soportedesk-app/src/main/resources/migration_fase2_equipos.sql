-- =====================================================================
-- Fase 2 del Plan de Normalizacion (seccion 4.3) -- Equipos.
-- Prioridad confirmada por el equipo: despues de Organizacion.
--
-- 100% ADITIVO: crea equipo_asignacion y la puebla con lo que ya existe
-- en ssti (equipos_enrichment, 2 filas hoy). No toca equipos_enrichment,
-- equipos_enrichment_historial ni equipos_evidencias -- siguen igual,
-- ya referencian correctamente glpi_computer_id.
--
-- LIMITACION CONOCIDA: glpi vive en MySQL (172.16.25.18), ssti en SQL
-- Server (172.16.26.16) -- no hay linked server entre ambos, asi que este
-- script NO PUEDE insertar automaticamente una fila por cada uno de los
-- 992 equipos de glpi_computers (eso requeriria un join cruzado que T-SQL
-- no puede hacer solo). Alcance de esta fase: dejar la tabla lista y
-- poblada con lo que ya se conoce (los 2 equipos con enrichment). Cargar
-- el resto (~990 equipos sin enrichment todavia) es tarea del backend
-- (Fase de codigo, mas abajo en el plan): un job que lea glpi_computers
-- via el datasource `glpi` que ya existe en application.yml e inserte
-- las filas faltantes con persona_id/ubicacion en NULL.
--
-- PRERREQUISITO: backup completo verificado.
-- =====================================================================

USE ssti;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION Fase2Equipos;

    CREATE TABLE dbo.equipo_asignacion (
        equipo_asignacion_id BIGINT NOT NULL PRIMARY KEY,
        glpi_computer_id     BIGINT NOT NULL,
        persona_id            BIGINT NULL,
        sede_id                BIGINT NULL,
        dependencia_id          BIGINT NULL,
        subdependencia_id        BIGINT NULL,
        codigo_patrimonial        NVARCHAR(80) NULL,
        codigo_inventario          NVARCHAR(80) NULL,
        fecha_asignacion            DATE NULL,
        estado                       NVARCHAR(30) NOT NULL,
        CONSTRAINT UQ_equipo_asignacion_glpi UNIQUE (glpi_computer_id),
        CONSTRAINT FK_equipo_asignacion_persona FOREIGN KEY (persona_id) REFERENCES dbo.persona(persona_id),
        CONSTRAINT FK_equipo_asignacion_sede FOREIGN KEY (sede_id) REFERENCES dbo.sedes(id),
        CONSTRAINT FK_equipo_asignacion_dependencia FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id),
        CONSTRAINT FK_equipo_asignacion_subdep FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias(id)
    );

    -- equipo_asignacion_id preservando el id de equipos_enrichment para
    -- trazabilidad directa entre ambas tablas
    INSERT INTO dbo.equipo_asignacion
        (equipo_asignacion_id, glpi_computer_id, persona_id, sede_id, dependencia_id,
         subdependencia_id, codigo_patrimonial, codigo_inventario, fecha_asignacion, estado)
    SELECT
        e.id, e.computer_id, NULL, e.sede_id, e.dependencia_id, e.subdependencia_id,
        e.codigo_patrimonial, NULL, NULL,
        ISNULL(e.estado_depuracion, 'PENDIENTE')
    FROM dbo.equipos_enrichment e;

COMMIT TRANSACTION Fase2Equipos;
GO

SELECT 'equipo_asignacion creada' AS chequeo, COUNT(*) AS filas FROM dbo.equipo_asignacion;
GO

-- =====================================================================
-- Retiro del agente propio (inventario_equipos y sus tablas hijas) --
-- confirmado por el equipo: se usa GLPI en su lugar. Paso destructivo
-- SEPARADO, con revision humana, y solo despues de que el job de carga
-- de equipo_asignacion (backend) este corriendo y validado.
-- =====================================================================
-- Nombres de FK verificados via sys.foreign_keys (24-jul-2026):
--   FK_inventario_programas_equipo   (inventario_programas -> inventario_equipos)
--   FK_inventario_discos_equipo      (inventario_discos -> inventario_equipos)
--   FK_inventario_redes_equipo       (inventario_redes -> inventario_equipos)
--   FK_inventario_red_ips_red        (inventario_red_ips -> inventario_redes)
--   FK_inventario_vpn_relacionado    (inventario_equipos -> vpn)
--   FK_inventario_equipo_relacionado (inventario_equipos -> equipos) -- ya no
--     existe si la Fase 0 ya corrio (esa la elimino al soltar dbo.equipos)
--
-- USE ssti;
-- GO
-- SET XACT_ABORT ON;
-- BEGIN TRANSACTION;
--     ALTER TABLE dbo.inventario_equipos DROP CONSTRAINT FK_inventario_vpn_relacionado;
--     ALTER TABLE dbo.inventario_discos DROP CONSTRAINT FK_inventario_discos_equipo;
--     ALTER TABLE dbo.inventario_programas DROP CONSTRAINT FK_inventario_programas_equipo;
--     ALTER TABLE dbo.inventario_redes DROP CONSTRAINT FK_inventario_redes_equipo;
--     ALTER TABLE dbo.inventario_red_ips DROP CONSTRAINT FK_inventario_red_ips_red;
--     DROP TABLE dbo.inventario_red_ips;
--     DROP TABLE dbo.inventario_redes;
--     DROP TABLE dbo.inventario_programas;
--     DROP TABLE dbo.inventario_discos;
--     DROP TABLE dbo.inventario_equipos;
-- COMMIT TRANSACTION;
-- GO
