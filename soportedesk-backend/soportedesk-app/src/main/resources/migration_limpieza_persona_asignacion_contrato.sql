-- =====================================================================
-- Elimina dbo.persona_asignacion y dbo.persona_contrato.
--
-- Por que: copiaban datos de core.PersonaAsignaciones/PersonaContratos,
-- que a su vez nunca tuvieron un proceso real que las alimentara (piloto
-- sin dueno). El equipo confirmo (30-jul-2026) que el seguimiento de
-- cargo/asignacion y contrato de una persona fue una idea de diseno sin
-- dueno real todavia -- mismo criterio aplicado a ad_cuenta.
--
-- Verificado antes de este script: 0 referencias en el codigo de la
-- aplicacion, 0 tablas dependen de ninguna de las dos salvo sus propias
-- FK salientes (se eliminan junto con las tablas).
--
-- Si en el futuro alguien SI se hace dueno de este proceso, el diseno
-- original sigue documentado en docs/plan-normalizacion-base-datos.docx,
-- seccion 4.1.
-- =====================================================================

USE ssti;
GO
DROP TABLE dbo.persona_asignacion;
DROP TABLE dbo.persona_contrato;
GO

SELECT 'persona_asignacion eliminada' AS chequeo,
       CASE WHEN OBJECT_ID('dbo.persona_asignacion') IS NULL THEN 'OK' ELSE 'SIGUE EXISTIENDO' END AS resultado
UNION ALL
SELECT 'persona_contrato eliminada',
       CASE WHEN OBJECT_ID('dbo.persona_contrato') IS NULL THEN 'OK' ELSE 'SIGUE EXISTIENDO' END;
GO
