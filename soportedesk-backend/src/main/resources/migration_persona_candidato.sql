-- =====================================================================
-- Bandeja de revision para la reconciliacion de identidad continua.
--
-- Reemplaza el patron de core.ClasificacionCuentasAD (eliminada porque
-- nunca tuvo un consumidor real) por una tabla que SI tiene un job que
-- la llena (PersonaReconciliacionService.detectarCandidatosNuevos, diario)
-- y un endpoint que la consume para confirmar/descartar.
--
-- persona_candidato_id usa IDENTITY porque, a diferencia de dbo.persona,
-- estas filas siempre son nuevas -- no hay ningun ID legado que preservar.
-- =====================================================================

USE ssti;
GO

CREATE TABLE dbo.persona_candidato (
    persona_candidato_id   BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    sam_account_name       NVARCHAR(120) NOT NULL,
    nombres                NVARCHAR(150) NOT NULL,
    apellidos              NVARCHAR(200) NOT NULL,
    correo_institucional   NVARCHAR(250) NULL,
    clasificacion_sugerida VARCHAR(20) NULL,  -- PERSONAL / FUNCIONAL / SERVICIO / NULL = sin senal suficiente
    estado                 VARCHAR(20) NOT NULL CONSTRAINT DF_persona_candidato_estado DEFAULT ('PENDIENTE'), -- PENDIENTE / CONFIRMADO / DESCARTADO
    fecha_deteccion         DATETIME2 NOT NULL CONSTRAINT DF_persona_candidato_fecha DEFAULT (SYSUTCDATETIME()),
    confirmado_por          NVARCHAR(100) NULL,
    fecha_resolucion        DATETIME2 NULL,
    persona_id              BIGINT NULL,  -- se llena cuando se confirma y se crea la persona real
    CONSTRAINT UQ_persona_candidato_sam UNIQUE (sam_account_name),
    CONSTRAINT FK_persona_candidato_persona FOREIGN KEY (persona_id) REFERENCES dbo.persona(persona_id)
);
GO

SELECT CASE WHEN OBJECT_ID('dbo.persona_candidato') IS NOT NULL THEN 'OK' ELSE 'ERROR' END AS resultado;
GO
