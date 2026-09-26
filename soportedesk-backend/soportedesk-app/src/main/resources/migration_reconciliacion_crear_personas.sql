-- =====================================================================
-- Promueve a dbo.persona las 551 cuentas AD clasificadas como PERSONAL
-- por la heuristica automatica (migration_reconciliacion_clasificacion_automatica.sql),
-- SIN esperar confirmacion manual -- decision explicita del equipo
-- (24-jul-2026), entendiendo que ClasificacionManual sigue en NULL.
--
-- IDs nuevos: 10001+ (MAX(persona_id) actual es 100, del piloto
-- core.Personas) -- sin riesgo de colision, deja rango 101-10000 libre
-- por si core.Personas crece independientemente.
--
-- given_name/surname: 519 de las 551 los tienen separados; para las
-- otras 32 (ej. "auditorio" -> given_name="Auditorio INIA", surname NULL)
-- se separa display_name por el primer espacio. Todas las filas PERSONAL
-- tienen garantizado un espacio en display_name porque la clasificacion
-- lo exigio (ver script anterior) -- no hay riesgo de apellidos vacio.
--
-- ADVERTENCIA CONOCIDA: la clasificacion automatica ya mostro falsos
-- positivos identificables a simple vista, por ejemplo "auditorio"
-- (Auditorio INIA) e "imagen" (Imagen Institucional - INIA) -- son
-- recursos/cuentas institucionales, no personas, pero pasaron el filtro
-- por tener nombre con forma "Palabra Palabra". Quedan creadas igual por
-- la decision del equipo de no esperar revision manual; se listan al
-- final de este script para limpieza posterior.
--
-- PRERREQUISITO: migration_reconciliacion_clasificacion_automatica.sql
-- ya aplicado (1,117 filas clasificadas, verificado 551 PERSONAL).
-- =====================================================================

USE ssti;
GO

WITH candidatos AS (
    SELECT
        a.sam_account_name,
        CASE WHEN a.surname IS NOT NULL THEN a.given_name
             ELSE LEFT(a.display_name, CHARINDEX(' ', a.display_name + ' ') - 1) END AS nombres,
        CASE WHEN a.surname IS NOT NULL THEN a.surname
             ELSE LTRIM(SUBSTRING(a.display_name, CHARINDEX(' ', a.display_name + ' ') + 1, 4000)) END AS apellidos,
        a.mail,
        a.telephone_number,
        a.mobile,
        a.enabled,
        ROW_NUMBER() OVER (ORDER BY a.sam_account_name) + 10000 AS persona_id_nuevo
    FROM dbo.ad_usuarios_cache a
    JOIN core.ClasificacionCuentasAD c ON c.SamAccountName = a.sam_account_name
    LEFT JOIN dbo.persona p ON p.sam_account_name = a.sam_account_name
    WHERE c.ClasificacionAutomatica = 'PERSONAL' AND p.persona_id IS NULL
)
INSERT INTO dbo.persona
    (persona_id, tipo_documento, numero_documento, nombres, apellidos, sam_account_name,
     correo_institucional, telefono, celular, empresa, estado_persona, activo, tipo_cuenta_id,
     fecha_registro, fecha_actualizacion, creado_por, actualizado_por)
SELECT
    persona_id_nuevo, NULL, NULL, nombres, apellidos, sam_account_name,
    mail, telephone_number, mobile, NULL,
    CASE WHEN enabled = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END,
    enabled,
    (SELECT TipoCuentaID FROM core.TiposCuentaDirectorio WHERE Codigo = 'PERSONAL'),
    SYSUTCDATETIME(), NULL, 'reconciliacion_automatica_24jul2026', NULL
FROM candidatos;
GO

-- Enlaza ad_cuenta.persona_id para las cuentas recien promovidas (hoy
-- estaban en 98/1215, sube a 649/1215)
UPDATE ac
SET ac.persona_id = p.persona_id
FROM dbo.ad_cuenta ac
JOIN dbo.persona p ON p.sam_account_name = ac.sam_account_name
WHERE ac.persona_id IS NULL;
GO

-- Verificacion
SELECT 'persona total' AS chequeo, COUNT(*) AS filas FROM dbo.persona
UNION ALL
SELECT 'persona creadas por reconciliacion automatica', COUNT(*) FROM dbo.persona WHERE creado_por = 'reconciliacion_automatica_24jul2026'
UNION ALL
SELECT 'ad_cuenta con persona_id resuelto', COUNT(*) FROM dbo.ad_cuenta WHERE persona_id IS NOT NULL;
GO

-- Candidatos a falso positivo para revision manual prioritaria (cuentas
-- de recursos/institucionales, no de personas individuales) -- NO se
-- eliminan automaticamente, requiere confirmacion del equipo
SELECT persona_id, nombres, apellidos, sam_account_name
FROM dbo.persona
WHERE creado_por = 'reconciliacion_automatica_24jul2026'
  AND (sam_account_name IN ('auditorio', 'imagen')
       OR nombres LIKE '%institucional%' OR nombres LIKE '%INIA%'
       OR apellidos LIKE '%institucional%' OR apellidos LIKE '%INIA%');
GO
