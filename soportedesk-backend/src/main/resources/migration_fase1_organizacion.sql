-- =====================================================================
-- Fase 1 del Plan de Normalizacion (docs/plan-normalizacion-base-datos.docx,
-- seccion 4.2) -- prioridad confirmada por el equipo: Organizacion primero.
--
-- v2 (24-jul-2026): la v1 fallaba con "Nombre de columna 'X' no es
-- valido" (Msg 207) porque cada ALTER TABLE ADD estaba en el mismo batch
-- que el UPDATE que usaba la columna nueva -- SQL Server compila todo el
-- batch de una vez y la columna "no existe todavia" en ese momento. Esta
-- version separa cada ALTER de su UPDATE con GO. La transaccion sigue
-- abierta igual: GO es un separador de lotes del cliente (SSMS/sqlcmd),
-- no hace COMMIT ni ROLLBACK por si solo.
--
-- 100% ADITIVO: agrega columnas nuevas (NULL) y tablas nuevas, no borra ni
-- renombra nada existente. sedes/dependencias/subdependencias mantienen su
-- nombre actual a proposito (ver nota de riesgo/beneficio en la v1).
--
-- Verificado antes de escribir esto (solo lectura, sin riesgo):
--   - org.SedeMapeo: 26/26/26 -- 1 a 1 exacto
--   - org.DependenciaMapeo: 37/37/37 -- 1 a 1 exacto
--   - org.SubdependenciaMapeo: 18/18/18 -- 1 a 1 exacto
--   - GestionOficinaID de DependenciaMapeo y SubdependenciaMapeo: 0 solapados
--   - Reconstruccion de dependencia_padre_id: 36 padres, los 36 con match
--     unico de vuelta (0 ambiguos, 0 sin match) -- seguro migrar la jerarquia.
--
-- PRERREQUISITO: backup completo verificado
-- (ssti_prenormalizacion_20260724_171842.bak). Las fases 0, Identidad, 2
-- y 3 ya corrieron correctamente (verificado 24-jul-2026); esta es la
-- unica pendiente.
-- =====================================================================

USE ssti;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION Fase1Organizacion;
GO

-- --- Batch 1: catalogos nuevos (CREATE + INSERT en el mismo batch si
--     funciona -- el problema es solo ALTER TABLE ADD + uso inmediato) ---
CREATE TABLE dbo.ubigeo (
    ubigeo_id     INT NOT NULL PRIMARY KEY,
    codigo_ubigeo VARCHAR(10) NULL,
    departamento  VARCHAR(100) NULL,
    provincia     VARCHAR(100) NULL,
    distrito      VARCHAR(100) NULL
);
INSERT INTO dbo.ubigeo (ubigeo_id, codigo_ubigeo, departamento, provincia, distrito)
SELECT UbigeoID, CodigoUbigeo, Departamento, Provincia, Distrito
FROM GestionTI_INIA.dbo.Ubigeo;

CREATE TABLE dbo.tipo_unidad (
    tipo_unidad_id     INT NOT NULL PRIMARY KEY,
    nombre_tipo_unidad VARCHAR(100) NOT NULL
);
INSERT INTO dbo.tipo_unidad (tipo_unidad_id, nombre_tipo_unidad)
SELECT TipoUnidadID, NombreTipoUnidad
FROM GestionTI_INIA.dbo.TipoUnidad;
GO

-- --- Batch 2: ALTER sedes (solo, nada mas en este batch) ---
ALTER TABLE dbo.sedes ADD
    ubigeo_id      INT NULL CONSTRAINT FK_sedes_ubigeo REFERENCES dbo.ubigeo(ubigeo_id),
    direccion      NVARCHAR(300) NULL,
    tipo_sede      VARCHAR(100) NULL,
    tipo_unidad_id INT NULL CONSTRAINT FK_sedes_tipo_unidad REFERENCES dbo.tipo_unidad(tipo_unidad_id);
GO

-- --- Batch 3: ahora si se puede usar las columnas nuevas de sedes;
--     tambien anexo (tabla nueva, CREATE+INSERT ok en el mismo batch) ---
UPDATE s
SET s.ubigeo_id      = g.UbigeoID,
    s.direccion      = g.Direccion,
    s.tipo_sede      = g.TipoSede,
    s.tipo_unidad_id = g.TipoUnidadID
FROM dbo.sedes s
JOIN org.SedeMapeo m ON m.SSTISedeID = s.id
JOIN GestionTI_INIA.dbo.Sedes g ON g.SedeID = m.GestionSedeID;

CREATE TABLE dbo.anexo (
    anexo_id        INT NOT NULL PRIMARY KEY,
    sede_id         BIGINT NULL,
    ubigeo_id       INT NULL,
    nombre_anexo    NVARCHAR(200) NOT NULL,
    direccion_anexo NVARCHAR(300) NULL,
    CONSTRAINT FK_anexo_sede FOREIGN KEY (sede_id) REFERENCES dbo.sedes(id),
    CONSTRAINT FK_anexo_ubigeo FOREIGN KEY (ubigeo_id) REFERENCES dbo.ubigeo(ubigeo_id)
);
INSERT INTO dbo.anexo (anexo_id, sede_id, ubigeo_id, nombre_anexo, direccion_anexo)
SELECT a.AnexoID, m.SSTISedeID, a.UbigeoID, a.NombreAnexo, a.DireccionAnexo
FROM GestionTI_INIA.dbo.Anexos a
LEFT JOIN org.SedeMapeo m ON m.GestionSedeID = a.SedeID;
GO

-- --- Batch 4: ALTER dependencias (solo, nada mas en este batch) ---
ALTER TABLE dbo.dependencias ADD
    dependencia_padre_id BIGINT NULL CONSTRAINT FK_dependencias_padre REFERENCES dbo.dependencias(id),
    org_unit_path         NVARCHAR(300) NULL;
GO

-- --- Batch 5: ahora si se puede usar las columnas nuevas de dependencias ---
UPDATE d
SET d.org_unit_path = uo.OrgUnitPath
FROM dbo.dependencias d
JOIN org.DependenciaMapeo m ON m.SSTIDependenciaID = d.id
LEFT JOIN GestionTI_INIA.dbo.UnidadesOrganizativas uo ON uo.OficinaID = m.GestionOficinaID;

UPDATE d
SET d.dependencia_padre_id = padre.SSTIDependenciaID
FROM dbo.dependencias d
JOIN org.DependenciaMapeo m ON m.SSTIDependenciaID = d.id
JOIN GestionTI_INIA.dbo.Oficinas o ON o.OficinaID = m.GestionOficinaID
JOIN org.DependenciaMapeo padre ON padre.GestionOficinaID = o.OficinaPadreID
WHERE o.OficinaPadreID IS NOT NULL;
GO

-- --- Batch 6: ALTER subdependencias (solo, nada mas en este batch) ---
ALTER TABLE dbo.subdependencias ADD org_unit_path NVARCHAR(300) NULL;
GO

-- --- Batch 7: ahora si se puede usar la columna nueva de subdependencias ---
UPDATE sd
SET sd.org_unit_path = uo.OrgUnitPath
FROM dbo.subdependencias sd
JOIN org.SubdependenciaMapeo m ON m.SSTISubdependenciaID = sd.id
LEFT JOIN GestionTI_INIA.dbo.UnidadesOrganizativas uo ON uo.OficinaID = m.GestionOficinaID;
GO

COMMIT TRANSACTION Fase1Organizacion;
GO

-- Verificacion rapida post-migracion
SELECT 'sedes enriquecidas' AS chequeo, COUNT(*) AS filas FROM dbo.sedes WHERE ubigeo_id IS NOT NULL
UNION ALL
SELECT 'dependencias con padre', COUNT(*) FROM dbo.dependencias WHERE dependencia_padre_id IS NOT NULL
UNION ALL
SELECT 'anexos importados', COUNT(*) FROM dbo.anexo
UNION ALL
SELECT 'ubigeo importado', COUNT(*) FROM dbo.ubigeo;
GO

-- =====================================================================
-- Retiro de las tablas puente org.*Mapeo -- SOLO despues de que el equipo
-- valide que sedes/dependencias/subdependencias enriquecidas son correctas.
-- No se incluye en la transaccion de arriba a proposito (paso destructivo
-- separado, con revision humana entre medio). Nota: el schema org tambien
-- tiene 6 vistas (vw_SedesComparacion, vw_DependenciasComparacion,
-- vw_UbicacionesInstitucionales, vw_DependenciasActivas,
-- vw_SubdependenciasComparacion, vw_SubdependenciasActivas) creadas el
-- 20-jul-2026 -- revisarlas antes de retirar el schema completo, podrian
-- depender de estas tablas o ser utiles para validar la migracion.
-- =====================================================================
-- BEGIN TRANSACTION;
--     DROP TABLE org.AnexoMapeo;
--     DROP TABLE org.DependenciaMapeo;
--     DROP TABLE org.SubdependenciaMapeo;
--     DROP TABLE org.SedeMapeo;
-- COMMIT TRANSACTION;
