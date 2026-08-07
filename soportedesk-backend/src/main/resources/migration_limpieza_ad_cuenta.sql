-- =====================================================================
-- Elimina dbo.ad_cuenta -- copia redundante de dbo.ad_usuarios_cache.
--
-- Por que: persona.sam_account_name ya permite consultar los atributos
-- de AD en vivo con un JOIN directo contra ad_usuarios_cache (mismo
-- patron que ya se usa para Correo con GestionTI_INIA). ad_cuenta no
-- tenia ningun mecanismo de sincronizacion -- se lleno una sola vez el
-- 24-jul-2026 y ya estaba desactualizada (verificado: 2 cuentas reales
-- en ad_usuarios_cache que no existian en ad_cuenta).
--
-- Verificado antes de este script: 0 referencias en el codigo de la
-- aplicacion, 0 tablas dependen de ad_cuenta salvo su propia FK saliente
-- hacia persona (se elimina junto con la tabla).
--
-- Ejemplo de reemplazo, si alguna vez se necesita:
--   SELECT p.*, a.mail, a.department, a.enabled
--   FROM dbo.persona p
--   JOIN dbo.ad_usuarios_cache a ON a.sam_account_name = p.sam_account_name
-- =====================================================================

USE ssti;
GO
DROP TABLE dbo.ad_cuenta;
GO

SELECT 'ad_cuenta eliminada' AS chequeo,
       CASE WHEN OBJECT_ID('dbo.ad_cuenta') IS NULL THEN 'OK' ELSE 'SIGUE EXISTIENDO' END AS resultado;
GO
