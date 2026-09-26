-- =====================================================================
-- Reconciliacion de identidad -- clasificacion automatica sugerida.
--
-- NO crea personas nuevas. Solo puebla core.ClasificacionCuentasAD con
-- una SUGERENCIA (columna ClasificacionAutomatica) para las 1,117 cuentas
-- AD que hoy no tienen fila en dbo.persona -- reduce el trabajo manual
-- del equipo (de revisar 1,117 cuentas una por una a solo confirmar/
-- corregir una sugerencia ya pre-clasificada).
--
-- ClasificacionManual queda SIEMPRE NULL -- es el campo que el equipo
-- llena a mano para confirmar o corregir la sugerencia. IncluirComoPersona
-- tambien es una sugerencia, no una decision final.
--
-- Convenciones usadas (tomadas de core.TiposCuentaDirectorio, ya existente):
--   PERSONAL    -- cuenta de una persona real
--   FUNCIONAL   -- cuenta de rol/posicion generica, no de una persona
--                  (ej. "auditor1", "ddta11", "celm02" -- verificado contra
--                  20 muestras reales, todas resultaron ser cargos/areas,
--                  ninguna persona con nombre)
--   SERVICIO    -- cuenta tecnica/de sistema (ej. "___VMware_Conv_SA___",
--                  "SUPPORT_388945a0")
--   (sin clasificar) -- la heuristica no tuvo suficiente señal; requiere
--                  revision manual prioritaria, no se sugiere nada
--
-- Heuristica (en orden, la primera que aplica gana):
--   1. Patron de nombre de cuenta tecnica/servicio -> SERVICIO
--   2. Termina en digito y no tiene espacios (ej. sdpa19, informatica06)
--      -> FUNCIONAL
--   3. Tiene department/title/mail Y el nombre visible parece
--      "Nombre Apellido" (2+ palabras, sin digitos) -> PERSONAL
--   4. Nombre visible parece "Nombre Apellido" sin guiones ni digitos,
--      aunque no tenga department/title/mail -> PERSONAL (sugerencia mas
--      debil que el caso 3 -- OJO: esto puede dar falsos positivos con
--      cuentas de recursos compartidos con nombre propio, ej. salas de
--      reunion -- revisar antes de confirmar en ClasificacionManual)
--   5. Cualquier otro caso -> sin clasificar, requiere revision manual
--
-- Verificado antes de escribir esto (solo lectura): el patron "termina en
-- digito, sin espacios" no produjo NINGUN falso positivo contra nombres de
-- persona reales en una muestra de 20 cuentas.
--
-- Este script es 100% aditivo (solo INSERT donde no existe fila) y de
-- bajo riesgo -- no toca dbo.persona ni ninguna tabla operativa.
-- =====================================================================

USE ssti;
GO

INSERT INTO core.ClasificacionCuentasAD
    (SamAccountName, TipoCuentaID, ClasificacionAutomatica, ClasificacionManual, IncluirComoPersona, Observacion)
SELECT
    a.sam_account_name,
    NULL,
    sugerido.clasificacion,
    NULL,
    CASE sugerido.clasificacion
        WHEN 'PERSONAL' THEN CAST(1 AS BIT)
        WHEN 'FUNCIONAL' THEN CAST(0 AS BIT)
        WHEN 'SERVICIO' THEN CAST(0 AS BIT)
        ELSE NULL
    END,
    'Clasificacion automatica sugerida (reconciliacion 24-jul-2026) -- pendiente de revision manual del equipo'
FROM dbo.ad_usuarios_cache a
LEFT JOIN dbo.persona p ON p.sam_account_name = a.sam_account_name
LEFT JOIN core.ClasificacionCuentasAD c ON c.SamAccountName = a.sam_account_name
CROSS APPLY (
    SELECT CASE
        WHEN a.sam_account_name LIKE '%vmware%'
          OR a.sam_account_name LIKE '%backup%'
          OR a.sam_account_name LIKE '%noreply%'
          OR a.sam_account_name LIKE 'svc%'
          OR a.sam_account_name LIKE 'SUPPORT[_]%'
          OR a.sam_account_name LIKE '%scanner%'
          OR a.sam_account_name LIKE '%impresora%'
          OR a.sam_account_name LIKE '%printer%'
        THEN 'SERVICIO'
        WHEN a.sam_account_name LIKE '%[0-9]' AND a.sam_account_name NOT LIKE '% %'
        THEN 'FUNCIONAL'
        WHEN (a.department IS NOT NULL OR a.title IS NOT NULL OR a.mail IS NOT NULL)
             AND a.display_name LIKE '% %' AND a.display_name NOT LIKE '%[0-9]%'
        THEN 'PERSONAL'
        WHEN a.display_name LIKE '% %' AND a.display_name NOT LIKE '%[0-9]%' AND a.display_name NOT LIKE '%-%'
        THEN 'PERSONAL'
        ELSE NULL
    END AS clasificacion
) sugerido
WHERE p.persona_id IS NULL AND c.SamAccountName IS NULL;
GO

-- Verificacion: distribucion de la sugerencia aplicada
SELECT ISNULL(ClasificacionAutomatica, '(sin clasificar -- revision manual prioritaria)') AS clasificacion, COUNT(*) AS filas
FROM core.ClasificacionCuentasAD
WHERE Observacion LIKE 'Clasificacion automatica sugerida%'
GROUP BY ClasificacionAutomatica
ORDER BY filas DESC;
GO
