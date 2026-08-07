-- =====================================================================
-- Fase 4: generacion segura de IDs para las tablas normalizadas.
--
-- No cambia datos ni activa el corte de la aplicacion. Crea secuencias
-- idempotentes comenzando por MAX(id) + 1, preservando todos los IDs
-- importados. Ejecutar antes de cualquier escritor sobre las tablas nuevas.
-- =====================================================================

USE ssti;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION Fase4Secuencias;

DECLARE @inicio BIGINT;
DECLARE @sql NVARCHAR(MAX);

IF OBJECT_ID(N'dbo.seq_persona_id', N'SO') IS NULL
BEGIN
    SELECT @inicio = ISNULL(MAX(persona_id), 0) + 1 FROM dbo.persona WITH (UPDLOCK, HOLDLOCK);
    SET @sql = N'CREATE SEQUENCE dbo.seq_persona_id AS BIGINT START WITH '
        + CONVERT(NVARCHAR(20), @inicio) + N' INCREMENT BY 1 CACHE 50;';
    EXEC sys.sp_executesql @sql;
END;

IF OBJECT_ID(N'dbo.seq_equipo_asignacion_id', N'SO') IS NULL
BEGIN
    SELECT @inicio = ISNULL(MAX(equipo_asignacion_id), 0) + 1
    FROM dbo.equipo_asignacion WITH (UPDLOCK, HOLDLOCK);
    SET @sql = N'CREATE SEQUENCE dbo.seq_equipo_asignacion_id AS BIGINT START WITH '
        + CONVERT(NVARCHAR(20), @inicio) + N' INCREMENT BY 1 CACHE 50;';
    EXEC sys.sp_executesql @sql;
END;

IF OBJECT_ID(N'dbo.seq_vpn_solicitud_id', N'SO') IS NULL
BEGIN
    SELECT @inicio = ISNULL(MAX(vpn_solicitud_id), 0) + 1
    FROM dbo.vpn_solicitud WITH (UPDLOCK, HOLDLOCK);
    SET @sql = N'CREATE SEQUENCE dbo.seq_vpn_solicitud_id AS BIGINT START WITH '
        + CONVERT(NVARCHAR(20), @inicio) + N' INCREMENT BY 1 CACHE 50;';
    EXEC sys.sp_executesql @sql;
END;

COMMIT TRANSACTION Fase4Secuencias;
GO

SELECT
    s.name AS secuencia,
    s.current_value,
    s.increment,
    s.is_cached
FROM sys.sequences s
WHERE s.object_id IN (
    OBJECT_ID(N'dbo.seq_persona_id', N'SO'),
    OBJECT_ID(N'dbo.seq_equipo_asignacion_id', N'SO'),
    OBJECT_ID(N'dbo.seq_vpn_solicitud_id', N'SO')
)
ORDER BY s.name;
GO
