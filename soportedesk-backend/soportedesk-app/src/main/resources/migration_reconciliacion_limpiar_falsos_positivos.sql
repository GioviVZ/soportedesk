-- =====================================================================
-- Limpia los 11 falsos positivos identificados en la promocion automatica
-- a persona (migration_reconciliacion_crear_personas.sql) -- cuentas de
-- recursos/institucionales que la heuristica marco como PERSONAL por
-- tener nombre con forma "Palabra Palabra", pero no son personas.
--
-- Accion: se desvinculan de ad_cuenta, se corrige su clasificacion a
-- FUNCIONAL o SERVICIO segun corresponda (con Observacion dejando
-- rastro de la correccion manual), y se eliminan de dbo.persona.
-- =====================================================================

USE ssti;
GO

UPDATE dbo.ad_cuenta
SET persona_id = NULL
WHERE sam_account_name IN (
    'auditorio','eventos','imagen','iniatemporal','migracion_inia',
    'pvraem','riego','seguridad','transporte','usr_app_inia','vigilancia'
);
GO

UPDATE core.ClasificacionCuentasAD
SET ClasificacionAutomatica = CASE SamAccountName
        WHEN 'iniatemporal' THEN 'SERVICIO'
        WHEN 'migracion_inia' THEN 'SERVICIO'
        WHEN 'usr_app_inia' THEN 'SERVICIO'
        ELSE 'FUNCIONAL'
    END,
    ClasificacionManual = CASE SamAccountName
        WHEN 'iniatemporal' THEN 'SERVICIO'
        WHEN 'migracion_inia' THEN 'SERVICIO'
        WHEN 'usr_app_inia' THEN 'SERVICIO'
        ELSE 'FUNCIONAL'
    END,
    IncluirComoPersona = 0,
    RevisadoPor = 'correccion_automatica_24jul2026',
    FechaRevision = SYSUTCDATETIME(),
    Observacion = 'Corregido: cuenta de recurso/institucional detectada como falso positivo tras revisar la promocion automatica a persona'
WHERE SamAccountName IN (
    'auditorio','eventos','imagen','iniatemporal','migracion_inia',
    'pvraem','riego','seguridad','transporte','usr_app_inia','vigilancia'
);
GO

DELETE FROM dbo.persona
WHERE creado_por = 'reconciliacion_automatica_24jul2026'
  AND sam_account_name IN (
    'auditorio','eventos','imagen','iniatemporal','migracion_inia',
    'pvraem','riego','seguridad','transporte','usr_app_inia','vigilancia'
);
GO

SELECT 'persona total tras limpieza' AS chequeo, COUNT(*) AS filas FROM dbo.persona;
GO
