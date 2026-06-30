-- =============================================================
-- Sistema Gestión de Soporte Informático INIA - Catálogos iniciales
-- Ejecutar en SSMS una sola vez (idempotente con NOT EXISTS)
-- =============================================================

USE ssti;
GO

-- ============================================================
-- SEDES (27)
-- ============================================================

INSERT INTO dbo.sedes (nombre)
SELECT v.nombre
FROM (VALUES
    (N'Centro Experimental La Molina'),
    (N'EEA Amazonas'),
    (N'EEA Andenes'),
    (N'EEA Arequipa'),
    (N'EEA Baños del Inca'),
    (N'EEA Canaán'),
    (N'EEA Canchán'),
    (N'EEA Chincha'),
    (N'EEA Chumbibamba'),
    (N'EEA Donoso'),
    (N'EEA El Chira'),
    (N'EEA El Porvenir'),
    (N'EEA Illpa'),
    (N'EEA Los Cedros'),
    (N'EEA Moquegua'),
    (N'EEA Pasco'),
    (N'EEA Perla del Vraem'),
    (N'EEA Pichanaki'),
    (N'EEA Pucallpa'),
    (N'EEA San Bernardo'),
    (N'EEA San Ramón'),
    (N'EEA San Roque'),
    (N'EEA Santa Ana'),
    (N'EEA Tacna'),
    (N'EEA Virú'),
    (N'EEA Vista Florida'),
    (N'Sede Central')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM dbo.sedes WHERE nombre = v.nombre);
GO

-- ============================================================
-- DEPENDENCIAS
-- ============================================================

-- EEAs y Centro Experimental: una dependencia con el mismo nombre que la sede
INSERT INTO dbo.dependencias (nombre, sede_id)
SELECT s.nombre, s.id
FROM dbo.sedes s
WHERE s.nombre IN (
    N'Centro Experimental La Molina',
    N'EEA Amazonas',    N'EEA Andenes',       N'EEA Arequipa',
    N'EEA Baños del Inca', N'EEA Canaán',     N'EEA Canchán',
    N'EEA Chincha',     N'EEA Chumbibamba',   N'EEA Donoso',
    N'EEA El Chira',    N'EEA El Porvenir',   N'EEA Illpa',
    N'EEA Los Cedros',  N'EEA Moquegua',      N'EEA Pasco',
    N'EEA Perla del Vraem', N'EEA Pichanaki', N'EEA Pucallpa',
    N'EEA San Bernardo', N'EEA San Ramón',    N'EEA San Roque',
    N'EEA Santa Ana',   N'EEA Tacna',         N'EEA Virú',
    N'EEA Vista Florida'
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.dependencias d WHERE d.nombre = s.nombre AND d.sede_id = s.id
);
GO

-- Sede Central: dependencias específicas
INSERT INTO dbo.dependencias (nombre, sede_id)
SELECT v.nombre, s.id
FROM dbo.sedes s
CROSS JOIN (VALUES
    (N'Direccion de Gestion de la Innovacion Agraria'),
    (N'Direccion de Investigacion y Desarrollo Tecnologico'),
    (N'Direccion de Recursos Geneticos y Biotecnologia'),
    (N'Direccion de Servicios Estrategicos Agrarios'),
    (N'Gerencia General'),
    (N'Oficina de Administracion'),
    (N'Oficina de Asesoria Juridica'),
    (N'Oficina de Gestion de Recursos Humanos'),
    (N'Oficina de Planeamiento y Presupuesto'),
    (N'Presidencia Ejecutiva')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND NOT EXISTS (
    SELECT 1 FROM dbo.dependencias d WHERE d.nombre = v.nombre AND d.sede_id = s.id
);
GO

-- ============================================================
-- SUBDEPENDENCIAS
-- ============================================================

-- EEAs y Centro Experimental: subdependencia "—" (sin subdivisión)
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT N'—', d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
WHERE s.nombre IN (
    N'Centro Experimental La Molina',
    N'EEA Amazonas',    N'EEA Andenes',       N'EEA Arequipa',
    N'EEA Baños del Inca', N'EEA Canaán',     N'EEA Canchán',
    N'EEA Chincha',     N'EEA Chumbibamba',   N'EEA Donoso',
    N'EEA El Chira',    N'EEA El Porvenir',   N'EEA Illpa',
    N'EEA Los Cedros',  N'EEA Moquegua',      N'EEA Pasco',
    N'EEA Perla del Vraem', N'EEA Pichanaki', N'EEA Pucallpa',
    N'EEA San Bernardo', N'EEA San Ramón',    N'EEA San Roque',
    N'EEA Santa Ana',   N'EEA Tacna',         N'EEA Virú',
    N'EEA Vista Florida'
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = N'—'
);
GO

-- Sede Central — dependencias sin subdivisión → "—"
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT N'—', d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
WHERE s.nombre = N'Sede Central'
AND d.nombre IN (
    N'Oficina de Asesoria Juridica',
    N'Oficina de Gestion de Recursos Humanos',
    N'Presidencia Ejecutiva'
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = N'—'
);
GO

-- Sede Central — Dirección de Gestión de la Innovación Agraria
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT v.nombre, d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
CROSS JOIN (VALUES
    (N'Subdireccion de Normatividad de la Innovacion Agraria'),
    (N'Subdireccion de Promocion de la Innovacion Agraria')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND d.nombre = N'Direccion de Gestion de la Innovacion Agraria'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = v.nombre);
GO

-- Sede Central — Dirección de Investigación y Desarrollo Tecnológico
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT v.nombre, d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
CROSS JOIN (VALUES
    (N'Subdireccion de Investigacion y Liberacion de Tecnologias'),
    (N'Subdireccion de Productos Agrarios')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND d.nombre = N'Direccion de Investigacion y Desarrollo Tecnologico'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = v.nombre);
GO

-- Sede Central — Dirección de Recursos Genéticos y Biotecnología
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT v.nombre, d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
CROSS JOIN (VALUES
    (N'Subdireccion de Biotecnologia'),
    (N'Subdireccion de Recursos Geneticos')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND d.nombre = N'Direccion de Recursos Geneticos y Biotecnologia'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = v.nombre);
GO

-- Sede Central — Dirección de Servicios Estratégicos Agrarios
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT v.nombre, d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
CROSS JOIN (VALUES
    (N'Subdireccion de Extension Agropecuario'),
    (N'Subdireccion de Supervision y Monitoreo')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND d.nombre = N'Direccion de Servicios Estrategicos Agrarios'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = v.nombre);
GO

-- Sede Central — Gerencia General
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT v.nombre, d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
CROSS JOIN (VALUES
    (N'Unidad de Atencion al Ciudadano y Gestion Documental'),
    (N'Unidad de Comunicaciones e Imagen Institucional'),
    (N'Unidad de Tecnologia de la Informacion')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND d.nombre = N'Gerencia General'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = v.nombre);
GO

-- Sede Central — Oficina de Administración
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT v.nombre, d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
CROSS JOIN (VALUES
    (N'Unidad de Abastecimiento'),
    (N'Unidad de Contabilidad'),
    (N'Unidad de Tesoreria')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND d.nombre = N'Oficina de Administracion'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = v.nombre);
GO

-- Sede Central — Oficina de Planeamiento y Presupuesto
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT v.nombre, d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
CROSS JOIN (VALUES
    (N'Unidad de Cooperacion Tecnica y Financiera'),
    (N'Unidad de Inversiones'),
    (N'Unidad de Planeamiento y Modernizacion'),
    (N'Unidad de Presupuesto')
) AS v(nombre)
WHERE s.nombre = N'Sede Central'
AND d.nombre = N'Oficina de Planeamiento y Presupuesto'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = v.nombre);
GO

-- ============================================================
-- Verificación final
-- ============================================================
SELECT 'sedes'          AS tabla, COUNT(*) AS total FROM dbo.sedes         UNION ALL
SELECT 'dependencias'   AS tabla, COUNT(*) AS total FROM dbo.dependencias   UNION ALL
SELECT 'subdependencias'AS tabla, COUNT(*) AS total FROM dbo.subdependencias;
GO
