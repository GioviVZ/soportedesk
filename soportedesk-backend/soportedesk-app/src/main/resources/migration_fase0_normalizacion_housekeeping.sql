-- =====================================================================
-- Fase 0 del Plan de Normalizacion (docs/plan-normalizacion-base-datos.docx)
-- Housekeeping: elimina equipos/correos/usuarios_red (vacias, confirmado
-- por el equipo) y las tablas de respaldo fechadas que ya quedaron
-- capturadas en el backup completo previo.
--
-- PRERREQUISITO OBLIGATORIO: correr esto solo despues de un backup
-- completo y verificado de ssti. En esta sesion ya se genero uno:
--   ssti_prenormalizacion_20260724_171842.bak
--   GestionTI_INIA_prenormalizacion_20260724_171842.bak
--   (verificados con RESTORE VERIFYONLY, ambos OK)
--
-- Ejecutar contra la base ssti. Todo dentro de una transaccion: si algo
-- falla, no queda a medias.
-- =====================================================================

USE ssti;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION Fase0Housekeeping;

    -- Verificacion de seguridad: aborta si alguna de las tres tablas
    -- tiene datos (no deberian, se confirmo vacias en la auditoria).
    IF EXISTS (SELECT 1 FROM dbo.equipos)
        THROW 50000, 'dbo.equipos tiene filas -- abortando, revisar antes de continuar', 1;
    IF EXISTS (SELECT 1 FROM dbo.correos)
        THROW 50000, 'dbo.correos tiene filas -- abortando, revisar antes de continuar', 1;
    IF EXISTS (SELECT 1 FROM dbo.usuarios_red)
        THROW 50000, 'dbo.usuarios_red tiene filas -- abortando, revisar antes de continuar', 1;

    -- FKs entrantes hacia equipos que hay que soltar antes del DROP
    ALTER TABLE dbo.inventario_equipos DROP CONSTRAINT FK_inventario_equipo_relacionado;
    ALTER TABLE dbo.vpn DROP CONSTRAINT FK_vpn_equipo;

    DROP TABLE dbo.equipos;
    DROP TABLE dbo.correos;
    DROP TABLE dbo.usuarios_red;

    -- Respaldos fechados: su contenido ya esta en el .bak completo de
    -- arriba, se retiran del esquema activo.
    DROP TABLE dbo.impresoras_subdependencia_backup_20260720;
    DROP TABLE core.Personas_Backup_PreCarga_20260720;

COMMIT TRANSACTION Fase0Housekeeping;
GO

PRINT 'Fase 0 (ssti) aplicada correctamente.';
GO

-- =====================================================================
-- Ejecutar por separado contra GestionTI_INIA (misma logica, otra base)
-- =====================================================================
-- USE GestionTI_INIA;
-- GO
-- SET XACT_ABORT ON;
-- BEGIN TRANSACTION;
--     DROP TABLE dbo.CorreoUsuarios_Backup_20260416;
-- COMMIT TRANSACTION;
-- GO
