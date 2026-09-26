-- =====================================================================
-- Revision manual de las 19 cuentas AD que la heuristica automatica dejo
-- sin clasificar (sin senal suficiente). Revisadas una por una:
--
--   17 son cuentas de sistema/servicio/area genuinas -> se reclasifican
--   2 SON PERSONAS REALES que la heuristica excluyo por error:
--     - dsancheza: "EEA Viru - David Sanchez Amaya" -- el prefijo de
--       sede (EEA Viru) hizo que la regla de exclusion por guion (pensada
--       para nombres de area tipo "DDTA - Especialista") descartara un
--       nombre de persona real con prefijo de ubicacion.
--     - enfernandez: "Enrique Noe Fernandez-Northcote" -- el apellido
--       compuesto con guion disparo la misma regla de exclusion por error.
--
-- Se crean esas 2 personas a mano (nombres extraidos/depurados
-- manualmente, no por formula generica -- mas seguro para un caso de
-- solo 2 filas conocidas).
-- =====================================================================

USE ssti;
GO

UPDATE core.ClasificacionCuentasAD
SET ClasificacionAutomatica = CASE SamAccountName
        WHEN 'dsancheza' THEN 'PERSONAL'
        WHEN 'enfernandez' THEN 'PERSONAL'
        WHEN 'contabilidad' THEN 'FUNCIONAL'
        WHEN 'logistica' THEN 'FUNCIONAL'
        WHEN 'oa' THEN 'FUNCIONAL'
        WHEN 'ogp' THEN 'FUNCIONAL'
        WHEN 'opp' THEN 'FUNCIONAL'
        WHEN 'presupuesto' THEN 'FUNCIONAL'
        WHEN 'rrgg' THEN 'FUNCIONAL'
        WHEN 'soporte' THEN 'FUNCIONAL'
        WHEN 'helpdesk' THEN 'FUNCIONAL'
        ELSE 'SERVICIO'  -- Administrator, Guest, krbtgt, localserver, prueba, SIAF, systemuser
    END,
    ClasificacionManual = CASE SamAccountName
        WHEN 'dsancheza' THEN 'PERSONAL'
        WHEN 'enfernandez' THEN 'PERSONAL'
        WHEN 'contabilidad' THEN 'FUNCIONAL'
        WHEN 'logistica' THEN 'FUNCIONAL'
        WHEN 'oa' THEN 'FUNCIONAL'
        WHEN 'ogp' THEN 'FUNCIONAL'
        WHEN 'opp' THEN 'FUNCIONAL'
        WHEN 'presupuesto' THEN 'FUNCIONAL'
        WHEN 'rrgg' THEN 'FUNCIONAL'
        WHEN 'soporte' THEN 'FUNCIONAL'
        WHEN 'helpdesk' THEN 'FUNCIONAL'
        ELSE 'SERVICIO'
    END,
    IncluirComoPersona = CASE WHEN SamAccountName IN ('dsancheza','enfernandez') THEN 1 ELSE 0 END,
    RevisadoPor = 'revision_manual_24jul2026',
    FechaRevision = SYSUTCDATETIME(),
    Observacion = 'Revisado a mano de la lista de 19 sin clasificar automaticamente'
WHERE SamAccountName IN (
    'Administrator','contabilidad','dsancheza','enfernandez','Guest','helpdesk',
    'krbtgt','localserver','logistica','oa','ogp','opp','presupuesto',
    'prueba','rrgg','SIAF','soporte','systemuser'
);  -- odavila se trata aparte abajo (mismo caso que dsancheza)

UPDATE core.ClasificacionCuentasAD
SET ClasificacionAutomatica = 'PERSONAL', ClasificacionManual = 'PERSONAL', IncluirComoPersona = 1,
    RevisadoPor = 'revision_manual_24jul2026', FechaRevision = SYSUTCDATETIME(),
    Observacion = 'Revisado a mano -- persona real con prefijo de sede en el nombre (EEA Pucallpa)'
WHERE SamAccountName = 'odavila';
GO

INSERT INTO dbo.persona
    (persona_id, tipo_documento, numero_documento, nombres, apellidos, sam_account_name,
     correo_institucional, telefono, celular, empresa, estado_persona, activo, tipo_cuenta_id,
     fecha_registro, fecha_actualizacion, creado_por, actualizado_por)
VALUES
    (10552, NULL, NULL, 'David', 'Sanchez Amaya', 'dsancheza', NULL, NULL, NULL, NULL,
     'ACTIVO', 1, (SELECT TipoCuentaID FROM core.TiposCuentaDirectorio WHERE Codigo = 'PERSONAL'),
     SYSUTCDATETIME(), NULL, 'revision_manual_24jul2026', NULL),
    (10553, NULL, NULL, 'Enrique Noe', 'Fernandez-Northcote', 'enfernandez', NULL, NULL, NULL, NULL,
     'INACTIVO', 0, (SELECT TipoCuentaID FROM core.TiposCuentaDirectorio WHERE Codigo = 'PERSONAL'),
     SYSUTCDATETIME(), NULL, 'revision_manual_24jul2026', NULL),
    (10554, NULL, NULL, 'Oscar', 'Davila Ramirez', 'odavila', NULL, NULL, NULL, NULL,
     'ACTIVO', 1, (SELECT TipoCuentaID FROM core.TiposCuentaDirectorio WHERE Codigo = 'PERSONAL'),
     SYSUTCDATETIME(), NULL, 'revision_manual_24jul2026', NULL);
GO

UPDATE ac
SET ac.persona_id = p.persona_id
FROM dbo.ad_cuenta ac
JOIN dbo.persona p ON p.sam_account_name = ac.sam_account_name
WHERE ac.persona_id IS NULL;
GO

SELECT 'persona total' AS chequeo, COUNT(*) AS filas FROM dbo.persona
UNION ALL
SELECT 'ClasificacionCuentasAD sin clasificar restantes', COUNT(*) FROM core.ClasificacionCuentasAD WHERE ClasificacionAutomatica IS NULL;
GO
