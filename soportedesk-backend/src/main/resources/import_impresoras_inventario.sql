-- ============================================================
-- Importacion de inventario real de impresoras - Sede Central
-- Fuente: Inventario_INIA_v2.xlsx (hoja 'IMPRESORAS SEDE CENTRAL')
-- Ejecutar manualmente en SSMS. Cada paso es idempotente.
-- ============================================================

USE ssti;
GO

-- ============================================================
-- MARCAS DE IMPRESORA
-- ============================================================
INSERT INTO dbo.marcas_impresora (nombre)
SELECT v.nombre
FROM (VALUES
    (N'BROTHER'),
    (N'CANON'),
    (N'EPSON'),
    (N'HP'),
    (N'KONICA MINOLTA'),
    (N'KYOCERA'),
    (N'OKI'),
    (N'PANTUM'),
    (N'TSC'),
    (N'XEROX'),
    (N'ZEBRA')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM dbo.marcas_impresora WHERE nombre = v.nombre);
GO

-- ============================================================
-- TIPOS DE IMPRESORA nuevos (no existian en el catalogo)
-- ============================================================
INSERT INTO dbo.tipos_impresora (nombre)
SELECT v.nombre
FROM (VALUES
    (N'Impresora Plotter')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tipos_impresora WHERE nombre = v.nombre);
GO

-- ============================================================
-- SUBDEPENDENCIA faltante detectada en el inventario real
-- ============================================================
INSERT INTO dbo.subdependencias (nombre, dependencia_id)
SELECT N'Secretaría Técnica', d.id
FROM dbo.dependencias d
JOIN dbo.sedes s ON d.sede_id = s.id
WHERE s.nombre = N'Sede Central' AND d.nombre = N'Oficina de Gestión de Recursos Humanos'
AND NOT EXISTS (SELECT 1 FROM dbo.subdependencias sd WHERE sd.dependencia_id = d.id AND sd.nombre = N'Secretaría Técnica');
GO

-- ============================================================
-- MODELOS DE IMPRESORA
-- ============================================================
INSERT INTO dbo.modelos_impresora (marca_id, nombre)
SELECT m.id, v.nombre
FROM dbo.marcas_impresora m
JOIN (VALUES
    (N'BROTHER', N'DCP-T820DW'),
    (N'CANON', N'IMAGEPRESS C810'),
    (N'CANON', N'IMAGERUNNER ADVANCE DX 6855I'),
    (N'CANON', N'IMAGERUNNER ADVANCE DX 6870I'),
    (N'CANON', N'PIXMA TS6010'),
    (N'EPSON', N'COLORWORKS C6500AU'),
    (N'EPSON', N'L310'),
    (N'EPSON', N'L395'),
    (N'EPSON', N'L4160'),
    (N'EPSON', N'L4260'),
    (N'EPSON', N'L5190'),
    (N'EPSON', N'L6171'),
    (N'EPSON', N'LQ-2090II'),
    (N'HP', N'COLOR LASERJET PRO M452DW'),
    (N'HP', N'COLOR LASERJET PRO MFP M180NW'),
    (N'HP', N'COLOR LASERJET PRO MFP M277DW'),
    (N'HP', N'DESIGNJET T650'),
    (N'HP', N'DESIGNJET T730'),
    (N'HP', N'DESIGNJET T830'),
    (N'HP', N'DESIGNJET T830 MFP'),
    (N'HP', N'DESKJET INK ADVANTAGE 2135'),
    (N'HP', N'LASERJET 1536DNF MFP'),
    (N'HP', N'LASERJET MANAGED FLOW MFP E826'),
    (N'HP', N'LASERJET P1006'),
    (N'HP', N'LASERJET P1102W'),
    (N'HP', N'LASERJET P2055DN'),
    (N'HP', N'LASERJET P3015'),
    (N'HP', N'LASERJET PRO 400 MFP M425DN'),
    (N'HP', N'LASERJET PRO M402DNE'),
    (N'HP', N'LASERJET PRO MFP 4103FDW'),
    (N'HP', N'LASERJET PRO MFP M127FN'),
    (N'HP', N'LASERJET PRO MFP M426FDW'),
    (N'HP', N'OFFICEJET PRO 251DW'),
    (N'HP', N'SMART TANK 580'),
    (N'KONICA MINOLTA', N'BIZHUB 363'),
    (N'KONICA MINOLTA', N'BIZHUB 367'),
    (N'KONICA MINOLTA', N'BIZHUB 650I'),
    (N'KONICA MINOLTA', N'BIZHUB 658E'),
    (N'KONICA MINOLTA', N'BIZHUB C266'),
    (N'KONICA MINOLTA', N'BIZHUB C360I'),
    (N'KYOCERA', N'TASKALFA 306CI'),
    (N'KYOCERA', N'TASKALFA 3553CI'),
    (N'KYOCERA', N'TASKALFA 6003I'),
    (N'KYOCERA', N'TASKALFA 7003I'),
    (N'KYOCERA', N'TASKALFA 7004I'),
    (N'KYOCERA', N'TASKALFA 8353CI'),
    (N'OKI', N'ES8473MFP'),
    (N'PANTUM', N'BM5100FDW'),
    (N'TSC', N'TE200'),
    (N'TSC', N'TTP-247'),
    (N'XEROX', N'VERSALINK C405'),
    (N'XEROX', N'VERSALINK C700'),
    (N'ZEBRA', N'ZC32'),
    (N'ZEBRA', N'ZD230'),
    (N'ZEBRA', N'ZT410'),
    (N'ZEBRA', N'ZT411'),
    (N'ZEBRA', N'ZTA10')
) AS v(marca, nombre) ON v.marca = m.nombre
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.modelos_impresora mi WHERE mi.marca_id = m.id AND mi.nombre = v.nombre
);
GO

-- ============================================================
-- TONERS/CONSUMIBLES POR MODELO
-- ============================================================
INSERT INTO dbo.modelo_impresora_toners (modelo_impresora_id, color, variante, codigo)
SELECT mi.id, v.color, v.variante, v.codigo
FROM dbo.modelos_impresora mi
JOIN dbo.marcas_impresora m ON mi.marca_id = m.id
JOIN (VALUES
    (N'BROTHER', N'DCP-T820DW', N'Negro', N'Estándar', N'BTD60BK'),
    (N'BROTHER', N'DCP-T820DW', N'Cyan', N'Estándar', N'BT5000C'),
    (N'BROTHER', N'DCP-T820DW', N'Magenta', N'Estándar', N'BT5000M'),
    (N'BROTHER', N'DCP-T820DW', N'Amarillo', N'Estándar', N'BT5000Y'),
    (N'CANON', N'IMAGEPRESS C810', N'Negro', N'Estándar', N'T01 Negro'),
    (N'CANON', N'IMAGEPRESS C810', N'Cyan', N'Estándar', N'T01 Cian'),
    (N'CANON', N'IMAGEPRESS C810', N'Magenta', N'Estándar', N'T01 Magenta'),
    (N'CANON', N'IMAGEPRESS C810', N'Amarillo', N'Estándar', N'T01 Amarillo'),
    (N'CANON', N'IMAGERUNNER ADVANCE DX 6855I', N'Negro', N'Estándar', N'GPR-63'),
    (N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Negro', N'Estándar', N'GPR-63'),
    (N'CANON', N'PIXMA TS6010', N'Negro', N'Estándar', N'PGI-170'),
    (N'CANON', N'PIXMA TS6010', N'Cyan', N'Estándar', N'CLI-171 Cian'),
    (N'CANON', N'PIXMA TS6010', N'Magenta', N'Estándar', N'CLI-171 Magenta'),
    (N'CANON', N'PIXMA TS6010', N'Amarillo', N'Estándar', N'CLI-171 Amarillo'),
    (N'EPSON', N'COLORWORKS C6500AU', N'Negro', N'Estándar', N'T44B5'),
    (N'EPSON', N'COLORWORKS C6500AU', N'Cyan', N'Estándar', N'T44B2'),
    (N'EPSON', N'COLORWORKS C6500AU', N'Magenta', N'Estándar', N'T44B3'),
    (N'EPSON', N'COLORWORKS C6500AU', N'Amarillo', N'Estándar', N'T44B4'),
    (N'EPSON', N'L310', N'Negro', N'Estándar', N'T664120'),
    (N'EPSON', N'L310', N'Cyan', N'Estándar', N'T664220'),
    (N'EPSON', N'L310', N'Magenta', N'Estándar', N'T664320'),
    (N'EPSON', N'L310', N'Amarillo', N'Estándar', N'T664420'),
    (N'EPSON', N'L395', N'Negro', N'Estándar', N'T664120'),
    (N'EPSON', N'L395', N'Cyan', N'Estándar', N'T664220'),
    (N'EPSON', N'L395', N'Magenta', N'Estándar', N'T664320'),
    (N'EPSON', N'L395', N'Amarillo', N'Estándar', N'T664420'),
    (N'EPSON', N'L4160', N'Negro', N'Estándar', N'T504120'),
    (N'EPSON', N'L4160', N'Cyan', N'Estándar', N'T504220'),
    (N'EPSON', N'L4160', N'Magenta', N'Estándar', N'T504320'),
    (N'EPSON', N'L4160', N'Amarillo', N'Estándar', N'T504420'),
    (N'EPSON', N'L4260', N'Negro', N'Estándar', N'T504120'),
    (N'EPSON', N'L4260', N'Cyan', N'Estándar', N'T504220'),
    (N'EPSON', N'L4260', N'Magenta', N'Estándar', N'T504320'),
    (N'EPSON', N'L4260', N'Amarillo', N'Estándar', N'T504420'),
    (N'EPSON', N'L5190', N'Negro', N'Estándar', N'T544120'),
    (N'EPSON', N'L5190', N'Cyan', N'Estándar', N'T544220'),
    (N'EPSON', N'L5190', N'Magenta', N'Estándar', N'T544320'),
    (N'EPSON', N'L5190', N'Amarillo', N'Estándar', N'T544420'),
    (N'EPSON', N'L6171', N'Negro', N'Estándar', N'T504120'),
    (N'EPSON', N'L6171', N'Cyan', N'Estándar', N'T504220'),
    (N'EPSON', N'L6171', N'Magenta', N'Estándar', N'T504320'),
    (N'EPSON', N'L6171', N'Amarillo', N'Estándar', N'T504420'),
    (N'EPSON', N'LQ-2090II', N'Negro', N'Estándar', N'S015335'),
    (N'HP', N'COLOR LASERJET PRO M452DW', N'Negro', N'Estándar', N'CF410A'),
    (N'HP', N'COLOR LASERJET PRO M452DW', N'Cyan', N'Estándar', N'CF411A'),
    (N'HP', N'COLOR LASERJET PRO M452DW', N'Magenta', N'Estándar', N'CF413A'),
    (N'HP', N'COLOR LASERJET PRO M452DW', N'Amarillo', N'Estándar', N'CF412A'),
    (N'HP', N'COLOR LASERJET PRO MFP M180NW', N'Negro', N'Estándar', N'CF510A'),
    (N'HP', N'COLOR LASERJET PRO MFP M180NW', N'Cyan', N'Estándar', N'CF511A'),
    (N'HP', N'COLOR LASERJET PRO MFP M180NW', N'Magenta', N'Estándar', N'CF513A'),
    (N'HP', N'COLOR LASERJET PRO MFP M180NW', N'Amarillo', N'Estándar', N'CF512A'),
    (N'HP', N'COLOR LASERJET PRO MFP M277DW', N'Negro', N'Estándar', N'CF400A'),
    (N'HP', N'COLOR LASERJET PRO MFP M277DW', N'Cyan', N'Estándar', N'CF401A'),
    (N'HP', N'COLOR LASERJET PRO MFP M277DW', N'Magenta', N'Estándar', N'CF403A'),
    (N'HP', N'COLOR LASERJET PRO MFP M277DW', N'Amarillo', N'Estándar', N'CF402A'),
    (N'HP', N'DESIGNJET T650', N'Negro', N'Estándar', N'HP 712 Negro'),
    (N'HP', N'DESIGNJET T650', N'Cyan', N'Estándar', N'HP 712 Cian'),
    (N'HP', N'DESIGNJET T650', N'Magenta', N'Estándar', N'HP 712 Magenta'),
    (N'HP', N'DESIGNJET T650', N'Amarillo', N'Estándar', N'HP 712 Amarillo'),
    (N'HP', N'DESIGNJET T730', N'Negro', N'Estándar', N'F9J68A'),
    (N'HP', N'DESIGNJET T730', N'Cyan', N'Estándar', N'F9J67A'),
    (N'HP', N'DESIGNJET T730', N'Magenta', N'Estándar', N'F9J66A'),
    (N'HP', N'DESIGNJET T730', N'Amarillo', N'Estándar', N'F9J65A'),
    (N'HP', N'DESIGNJET T830', N'Negro', N'Estándar', N'F9J68A'),
    (N'HP', N'DESIGNJET T830', N'Cyan', N'Estándar', N'F9J67A'),
    (N'HP', N'DESIGNJET T830', N'Magenta', N'Estándar', N'F9J66A'),
    (N'HP', N'DESIGNJET T830', N'Amarillo', N'Estándar', N'F9J65A'),
    (N'HP', N'DESIGNJET T830 MFP', N'Negro', N'Estándar', N'F9J68A'),
    (N'HP', N'DESIGNJET T830 MFP', N'Cyan', N'Estándar', N'F9J67A'),
    (N'HP', N'DESIGNJET T830 MFP', N'Magenta', N'Estándar', N'F9J66A'),
    (N'HP', N'DESIGNJET T830 MFP', N'Amarillo', N'Estándar', N'F9J65A'),
    (N'HP', N'DESKJET INK ADVANTAGE 2135', N'Negro', N'Estándar', N'HP 664 Negro'),
    (N'HP', N'DESKJET INK ADVANTAGE 2135', N'Cyan', N'Tricolor', N'HP 664 Tricolor'),
    (N'HP', N'DESKJET INK ADVANTAGE 2135', N'Magenta', N'Tricolor', N'HP 664 Tricolor'),
    (N'HP', N'DESKJET INK ADVANTAGE 2135', N'Amarillo', N'Tricolor', N'HP 664 Tricolor'),
    (N'HP', N'LASERJET 1536DNF MFP', N'Negro', N'Estándar', N'CE278A (78A)'),
    (N'HP', N'LASERJET MANAGED FLOW MFP E826', N'Negro', N'Estándar', N'W9084MC'),
    (N'HP', N'LASERJET P1006', N'Negro', N'Estándar', N'CB435A (35A)'),
    (N'HP', N'LASERJET P1102W', N'Negro', N'Estándar', N'CE285A (85A)'),
    (N'HP', N'LASERJET P2055DN', N'Negro', N'Estándar', N'CE505A (05A)'),
    (N'HP', N'LASERJET P3015', N'Negro', N'Estándar', N'CE255A (55A)'),
    (N'HP', N'LASERJET PRO 400 MFP M425DN', N'Negro', N'Estándar', N'CF280A'),
    (N'HP', N'LASERJET PRO 400 MFP M425DN', N'Negro', N'Alto rendimiento', N'CF280X'),
    (N'HP', N'LASERJET PRO M402DNE', N'Negro', N'Estándar', N'CF226A'),
    (N'HP', N'LASERJET PRO M402DNE', N'Negro', N'Alto rendimiento', N'CF226X'),
    (N'HP', N'LASERJET PRO MFP 4103FDW', N'Negro', N'Estándar', N'W1510A'),
    (N'HP', N'LASERJET PRO MFP 4103FDW', N'Negro', N'Alto rendimiento', N'W1510X'),
    (N'HP', N'LASERJET PRO MFP M127FN', N'Negro', N'Estándar', N'CF283A (83A)'),
    (N'HP', N'LASERJET PRO MFP M426FDW', N'Negro', N'Estándar', N'CF226A'),
    (N'HP', N'LASERJET PRO MFP M426FDW', N'Negro', N'Alto rendimiento', N'CF226X'),
    (N'HP', N'OFFICEJET PRO 251DW', N'Negro', N'Estándar', N'HP 950'),
    (N'HP', N'OFFICEJET PRO 251DW', N'Cyan', N'Estándar', N'HP 951 Cian'),
    (N'HP', N'OFFICEJET PRO 251DW', N'Magenta', N'Estándar', N'HP 951 Magenta'),
    (N'HP', N'OFFICEJET PRO 251DW', N'Amarillo', N'Estándar', N'HP 951 Amarillo'),
    (N'HP', N'SMART TANK 580', N'Negro', N'Estándar', N'GT53'),
    (N'HP', N'SMART TANK 580', N'Cyan', N'Estándar', N'GT52 Cian'),
    (N'HP', N'SMART TANK 580', N'Magenta', N'Estándar', N'GT52 Magenta'),
    (N'HP', N'SMART TANK 580', N'Amarillo', N'Estándar', N'GT52 Amarillo'),
    (N'KONICA MINOLTA', N'BIZHUB 363', N'Negro', N'Estándar', N'TN-414'),
    (N'KONICA MINOLTA', N'BIZHUB 367', N'Negro', N'Estándar', N'TN-323'),
    (N'KONICA MINOLTA', N'BIZHUB 650I', N'Negro', N'Estándar', N'TN-628'),
    (N'KONICA MINOLTA', N'BIZHUB 658E', N'Negro', N'Estándar', N'TN-516'),
    (N'KONICA MINOLTA', N'BIZHUB C266', N'Negro', N'Estándar', N'TN-223K'),
    (N'KONICA MINOLTA', N'BIZHUB C266', N'Cyan', N'Estándar', N'TN-223C'),
    (N'KONICA MINOLTA', N'BIZHUB C266', N'Magenta', N'Estándar', N'TN-223M'),
    (N'KONICA MINOLTA', N'BIZHUB C266', N'Amarillo', N'Estándar', N'TN-223Y'),
    (N'KONICA MINOLTA', N'BIZHUB C360I', N'Negro', N'Estándar', N'TN-328K'),
    (N'KONICA MINOLTA', N'BIZHUB C360I', N'Cyan', N'Estándar', N'TN-328C'),
    (N'KONICA MINOLTA', N'BIZHUB C360I', N'Magenta', N'Estándar', N'TN-328M'),
    (N'KONICA MINOLTA', N'BIZHUB C360I', N'Amarillo', N'Estándar', N'TN-328Y'),
    (N'KYOCERA', N'TASKALFA 306CI', N'Negro', N'Estándar', N'TK-5197K'),
    (N'KYOCERA', N'TASKALFA 306CI', N'Cyan', N'Estándar', N'TK-5197C'),
    (N'KYOCERA', N'TASKALFA 306CI', N'Magenta', N'Estándar', N'TK-5197M'),
    (N'KYOCERA', N'TASKALFA 306CI', N'Amarillo', N'Estándar', N'TK-5197Y'),
    (N'KYOCERA', N'TASKALFA 3553CI', N'Negro', N'Estándar', N'TK-8527K'),
    (N'KYOCERA', N'TASKALFA 3553CI', N'Cyan', N'Estándar', N'TK-8527C'),
    (N'KYOCERA', N'TASKALFA 3553CI', N'Magenta', N'Estándar', N'TK-8527M'),
    (N'KYOCERA', N'TASKALFA 3553CI', N'Amarillo', N'Estándar', N'TK-8527Y'),
    (N'KYOCERA', N'TASKALFA 6003I', N'Negro', N'Estándar', N'TK-6327'),
    (N'KYOCERA', N'TASKALFA 7003I', N'Negro', N'Estándar', N'TK-6727'),
    (N'KYOCERA', N'TASKALFA 7004I', N'Negro', N'Estándar', N'TK-6347'),
    (N'KYOCERA', N'TASKALFA 8353CI', N'Negro', N'Estándar', N'TK-8737K'),
    (N'KYOCERA', N'TASKALFA 8353CI', N'Cyan', N'Estándar', N'TK-8737C'),
    (N'KYOCERA', N'TASKALFA 8353CI', N'Magenta', N'Estándar', N'TK-8737M'),
    (N'KYOCERA', N'TASKALFA 8353CI', N'Amarillo', N'Estándar', N'TK-8737Y'),
    (N'OKI', N'ES8473MFP', N'Negro', N'Estándar', N'45862822'),
    (N'OKI', N'ES8473MFP', N'Cyan', N'Estándar', N'45862826'),
    (N'OKI', N'ES8473MFP', N'Magenta', N'Estándar', N'45862825'),
    (N'OKI', N'ES8473MFP', N'Amarillo', N'Estándar', N'45862824'),
    (N'PANTUM', N'BM5100FDW', N'Negro', N'Estándar', N'TL-5120X'),
    (N'TSC', N'TE200', N'Negro', N'Estándar', N'Ribbon'),
    (N'TSC', N'TTP-247', N'Negro', N'Estándar', N'Ribbon'),
    (N'XEROX', N'VERSALINK C405', N'Negro', N'Estándar', N'106R03520'),
    (N'XEROX', N'VERSALINK C405', N'Cyan', N'Estándar', N'106R03522'),
    (N'XEROX', N'VERSALINK C405', N'Magenta', N'Estándar', N'106R03523'),
    (N'XEROX', N'VERSALINK C405', N'Amarillo', N'Estándar', N'106R03521'),
    (N'XEROX', N'VERSALINK C700', N'Negro', N'Estándar', N'106R03757'),
    (N'XEROX', N'VERSALINK C700', N'Cyan', N'Estándar', N'106R03760'),
    (N'XEROX', N'VERSALINK C700', N'Magenta', N'Estándar', N'106R03759'),
    (N'XEROX', N'VERSALINK C700', N'Amarillo', N'Estándar', N'106R03758'),
    (N'ZEBRA', N'ZC32', N'Negro', N'YMCKO', N'800300-550LA'),
    (N'ZEBRA', N'ZC32', N'Cyan', N'YMCKO', N'800300-550LA'),
    (N'ZEBRA', N'ZC32', N'Magenta', N'YMCKO', N'800300-550LA'),
    (N'ZEBRA', N'ZC32', N'Amarillo', N'YMCKO', N'800300-550LA'),
    (N'ZEBRA', N'ZD230', N'Negro', N'Estándar', N'Ribbon'),
    (N'ZEBRA', N'ZT410', N'Negro', N'Estándar', N'Ribbon'),
    (N'ZEBRA', N'ZT411', N'Negro', N'Estándar', N'Ribbon'),
    (N'ZEBRA', N'ZTA10', N'Negro', N'Estándar', N'Ribbon')
) AS v(marca, modelo, color, variante, codigo) ON v.marca = m.nombre AND v.modelo = mi.nombre
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.modelo_impresora_toners t
    WHERE t.modelo_impresora_id = mi.id AND t.color = v.color AND t.variante = v.variante
);
GO

-- ============================================================
-- IMPRESORAS (164 equipos reales, Sede Central)
-- ============================================================
IF OBJECT_ID('tempdb..#impresoras_staging') IS NOT NULL DROP TABLE #impresoras_staging;
CREATE TABLE #impresoras_staging (
    numero NVARCHAR(10), sede NVARCHAR(100), dependencia NVARCHAR(150), subdependencia NVARCHAR(150),
    marca NVARCHAR(100), modelo NVARCHAR(100), tipo NVARCHAR(100),
    serie NVARCHAR(100), codigo_patrimonial NVARCHAR(100), codigo_inventario NVARCHAR(100),
    ip NVARCHAR(50), tipo_conexion NVARCHAR(50), estado NVARCHAR(50)
);
GO

INSERT INTO #impresoras_staging (numero, sede, dependencia, subdependencia, marca, modelo, tipo, serie, codigo_patrimonial, codigo_inventario, ip, tipo_conexion, estado)
VALUES
    (N'18', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'BROTHER', N'DCP-T820DW', N'Impresora de Inyección a Color', N'U66055B2H595949', N'74222358-0283', N'202407763', NULL, N'USB', N'Activa'),
    (N'19', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'BROTHER', N'DCP-T820DW', N'Impresora de Inyección a Color', N'U66055J1H376466', NULL, NULL, NULL, N'USB', N'Activa'),
    (N'74', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'CANON', N'IMAGERUNNER ADVANCE DX 6855I', N'Fotocopiadora Multifuncional Laser', N'35X00512', N'74222358-0316', N'202405275', N'172.16.23.103', N'IP', N'Activa'),
    (N'82', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Extensión Agropecuaria', N'CANON', N'IMAGEPRESS C810', N'Imprenta Digital a Color', N'2NY06022', N'67505880-0005', N'202416438', NULL, N'IP', N'Activa'),
    (N'136', N'Sede Central', N'Oficina de Administración', N'Unidad de Tesorería', N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora Multifuncional Laser', N'4DQ00504', N'74222358-0297', N'202406520', N'172.16.23.81', N'IP', N'Activa'),
    (N'20', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'CANON', N'IMAGERUNNER ADVANCE DX 6855I', N'Fotocopiadora Multifuncional Laser', N'35X00561', NULL, N'202408868', N'172.16.23.151', N'IP', N'Activa'),
    (N'75', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'CANON', N'IMAGERUNNER ADVANCE DX 6855I', N'Fotocopiadora Multifuncional Laser', N'35X00508', N'74222358-0315', N'202405396', N'172.16.23.102', N'IP', N'Activa'),
    (N'21', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora Multifuncional Laser', N'4DQ00503', N'74222358-0310', N'202408940', N'172.16.23.87', N'IP', N'Activa'),
    (N'67', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'Subdirección de Biotecnología', N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora Multifuncional Laser', N'3LY00532', N'74222358-0318', N'202410341', N'172.16.23.104', N'IP', N'Activa'),
    (N'76', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora Multifuncional Laser', N'3LY00530', N'74222358-0314', N'202405643', N'172.16.23.100', N'IP', N'Activa'),
    (N'108', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora Multifuncional Laser', N'ZBAB00241532', N'72222358-0296', N'202406659', NULL, N'IP', N'En mantenimiento'),
    (N'36', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'CANON', N'PIXMA TS6010', N'Impresora de Inyección a Color', N'AERU00024', NULL, N'202408763', NULL, N'USB', N'Activa'),
    (N'83', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Extensión Agropecuaria', N'EPSON', N'COLORWORKS C6500AU', N'Impresora Etiquetadora Color', N'X7F4009437', N'675010060001', NULL, N'172.16.23.174', N'IP', N'Activa'),
    (N'12', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Promoción de la Innovación Agraria', N'EPSON', N'L310', N'Impresora de Inyección a Color', N'VHLK004899', NULL, N'202411760', NULL, N'USB', N'Activa'),
    (N'41', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'EPSON', N'L395', N'Impresora de Inyección a Color', N'X2P6298822', NULL, N'202408429', NULL, N'USB', N'Activa'),
    (N'23', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'EPSON', N'L4160', N'Impresora de Inyección a Color', N'X4DW094160', NULL, N'202408399', NULL, N'USB', N'Activa'),
    (N'39', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'EPSON', N'L4260', N'Impresora de Inyección a Color', NULL, N'742223580400', N'202421330', NULL, N'USB', N'Activa'),
    (N'22', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'EPSON', N'L5190', N'Impresora de Inyección a Color', N'X5NS036777', N'74083650-0058', N'202416745', N'172.16.62.18', N'IP', N'Activa'),
    (N'38', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'EPSON', N'L5190', N'Impresora de Inyección a Color', N'X5NS041355', NULL, N'202408538', NULL, N'USB', N'Activa'),
    (N'40', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'EPSON', N'L5190', N'Impresora de Inyección a Color', NULL, N'74083650-0054', N'202408786', NULL, N'USB', N'Activa'),
    (N'37', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'EPSON', N'L6171', N'Impresora de Inyección a Color', NULL, N'74083650-0071', N'202408778', NULL, N'USB', N'Activa'),
    (N'137', N'Sede Central', N'Oficina de Administración', N'Unidad de Tesorería', N'EPSON', N'LQ-2090II', N'Impresora Matricial', N'X4S3000093', N'74084550-0023', N'202406482', NULL, N'Puerto paralelo', N'Activa'),
    (N'138', N'Sede Central', N'Oficina de Administración', N'Unidad de Tesorería', N'EPSON', N'LQ-2090II', N'Impresora Matricial', N'X4S3000178', N'74084550-0024', N'202406474', NULL, N'Puerto paralelo', N'Activa'),
    (N'139', N'Sede Central', N'Oficina de Administración', N'Unidad de Tesorería', N'EPSON', N'LQ-2090II', N'Impresora Matricial', N'X4SS0001S1', N'74084550-0025', N'202406491', NULL, N'Puerto paralelo', N'Activa'),
    (N'28', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'HP', N'LASERJET 1536DNF MFP', N'Impresora Laser', N'CNC9C2KBYX', N'740841000187', NULL, NULL, N'IP', N'En mantenimiento'),
    (N'42', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'HP', N'COLOR LASERJET PRO M452DW', N'Impresora Laser', NULL, N'74084100-0244', N'202408414', N'192.16.0.110', N'IP', N'Activa'),
    (N'24', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'HP', N'COLOR LASERJET PRO MFP M180NW', N'Impresora Laser', N'VNC3201222', N'74222358-0160', N'202408120', NULL, N'IP', N'Activa'),
    (N'47', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'HP', N'COLOR LASERJET PRO MFP M277DW', N'Impresora Laser', N'VNBKK5C92L', N'74222358-0246', N'202412661', NULL, N'IP', N'En mantenimiento'),
    (N'110', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'HP', N'DESIGNJET T830', N'Impresora Plotter', N'CN8CB7M014', N'74085000005', N'202414966', NULL, N'IP', N'Activa'),
    (N'46', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'HP', N'DESIGNJET T830 MFP', N'Impresora Plotter', N'CN9AN8M06B', N'74085000-0003', N'202412580', NULL, N'IP', N'En mantenimiento'),
    (N'79', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'HP', N'DESIGNJET T650', N'Impresora Plotter', N'CN29L4M04T', N'74085000-0006', N'202405280', NULL, N'IP', N'Activa'),
    (N'112', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'HP', N'DESIGNJET T730', N'Impresora Plotter', N'CN98M7M0FK', N'74085000-0002', N'202414970', NULL, N'IP', N'Activa'),
    (N'58', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'HP', N'DESKJET INK ADVANTAGE 2135', N'Impresora Laser', N'F5S2880025', N'74083650-0068', N'202410846', NULL, N'IP', N'Activa'),
    (N'84', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Extensión Agropecuaria', N'HP', N'LASERJET 1536DNF MFP', N'Impresora Laser', N'CNB9B84B71', NULL, N'202409098', NULL, N'IP', N'Activa'),
    (N'85', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Extensión Agropecuaria', N'HP', N'LASERJET 1536DNF MFP', N'Impresora Laser', N'CNB9B84B9R', NULL, N'202409327', NULL, N'IP', N'Activa'),
    (N'48', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'HP', N'LASERJET P1006', N'Impresora Laser', N'VNF3B51141', N'740841000157', N'202412699', NULL, N'USB', N'En mantenimiento'),
    (N'14', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Promoción de la Innovación Agraria', N'HP', N'LASERJET P1102W', N'Impresora Laser', N'BRBSB6BG1J', N'74084100-0125', N'202411762', NULL, N'USB', N'Activa'),
    (N'43', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'HP', N'LASERJET P2055DN', N'Impresora Laser', N'CNCGB02720', NULL, N'202408761', NULL, N'USB', N'Activa'),
    (N'80', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'HP', N'LASERJET P3015', N'Impresora Laser', N'BRBSF2VL1Z', NULL, N'202409519', NULL, N'USB', N'Activa'),
    (N'2', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'—', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora Multifuncional Laser', N'BRBSHB1836', N'74084100-0110', N'202412474', N'172.16.23.146', N'IP', N'Activa'),
    (N'9', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Normatividad de la Innovación Agraria', N'HP', N'OFFICEJET PRO 251DW', N'Impresora de Inyección a Color', N'CN4COCV020', N'740836500039', N'202419259', NULL, N'USB', N'En mantenimiento'),
    (N'27', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'HP', N'SMART TANK 580', N'Impresora de Inyección a Color', N'1F3Y2-80030', NULL, N'202407359', NULL, N'USB', N'Activa'),
    (N'68', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'Subdirección de Biotecnología', N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora Multifuncional Laser', N'CNF8H7R3MH', N'74222358-0167', N'202411929', NULL, N'USB', N'Activa'),
    (N'77', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'HP', N'LASERJET MANAGED FLOW MFP E826', N'Impresora Laser', N'MXBCQC31QS', N'74222358-0381', N'202405536', N'172.16.23.141', N'IP', N'Activa'),
    (N'111', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora Multifuncional Laser', N'BRBSHB183B', NULL, N'202406921', NULL, N'USB', N'En mantenimiento'),
    (N'44', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora Multifuncional Laser', N'CNF8GD374K', NULL, N'202408790', NULL, N'USB', N'Activa'),
    (N'59', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora Multifuncional Laser', N'CNF8H7R3M8', N'74222358-0031', N'202410829', NULL, N'USB', N'Activa'),
    (N'86', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Extensión Agropecuaria', N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora Multifuncional Laser', N'CNF8H7W84D', N'740841000147', N'202416468', NULL, N'USB', N'En mantenimiento'),
    (N'144', N'Sede Central', N'Oficina de Control Institucional', N'—', N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora Multifuncional Laser', N'CND8F47395', NULL, N'202411247', NULL, N'USB', N'Activa'),
    (N'45', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'HP', N'LASERJET PRO M402DNE', N'Impresora Laser', N'BRBSM3X9TV', N'74084100-0240', N'202409749', NULL, N'IP', N'En mantenimiento'),
    (N'109', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'HP', N'LASERJET PRO MFP 4103FDW', N'Impresora Multifuncional Laser', N'BRBSQD007P', N'74222358-0306', N'202414982', N'172.16.41.150', N'IP', N'Activa'),
    (N'13', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Promoción de la Innovación Agraria', N'HP', N'LASERJET PRO MFP M127FN', N'Impresora Multifuncional Laser', N'BRBSG7FVKZ', NULL, N'202412379', NULL, N'USB', N'Activa'),
    (N'8', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Normatividad de la Innovación Agraria', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora Multifuncional Laser', N'BRBSHB182S', NULL, N'202419527', NULL, N'USB', N'Activa'),
    (N'25', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora Multifuncional Laser', N'BRBSHB183D', N'740836500030', N'202407814', NULL, N'USB', N'En mantenimiento'),
    (N'57', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora Multifuncional Laser', N'BRBSHB1831', N'74084100-0114', N'202410187', NULL, N'USB', N'Activa'),
    (N'26', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'HP', N'LASERJET P2055DN', N'Impresora Laser', N'CNCGC06577', NULL, N'202415189', NULL, N'USB', N'Activa'),
    (N'69', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'Subdirección de Recursos Genéticos', N'HP', N'LASERJET PRO MFP 4103FDW', N'Impresora Multifuncional Laser', N'BRBSQ7W0C9', N'74222358-0354', N'202410032', NULL, N'IP', N'Activa'),
    (N'78', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora Multifuncional Laser', N'BRBSHB1835', N'74084100-0104', N'202405561', NULL, N'USB', N'Activa'),
    (N'88', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Supervisión y Monitoreo', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora Multifuncional Laser', N'SRBSHBL81T', NULL, N'202405496', NULL, N'USB', N'Activa'),
    (N'30', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora Multifuncional Laser', N'A1UE041105892', NULL, N'202415193', NULL, N'IP', N'En mantenimiento'),
    (N'49', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora Multifuncional Laser', NULL, N'74222726-0023', N'202412708', NULL, N'IP', N'En mantenimiento'),
    (N'60', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora Multifuncional Laser', N'A1UE041114301', N'742223580069', N'202410833', N'172.16.23.173', N'IP', N'Activa'),
    (N'89', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Supervisión y Monitoreo', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora Multifuncional Laser', N'A1UE041114655', N'74222358-0298', N'202405462', N'172.16.10.32', N'IP', N'Activa'),
    (N'113', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora Multifuncional Laser', N'A1UE041104348', NULL, N'202406682', N'172.16.10.252', N'IP', N'Activa'),
    (N'147', N'Sede Central', N'Oficina de Gestión de Recursos Humanos', N'—', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora Multifuncional Laser', N'A1UE041114570', NULL, N'202405993', NULL, N'IP', N'En mantenimiento'),
    (N'10', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Normatividad de la Innovación Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000620', N'74222358-0109', N'202419526', N'172.16.23.166', N'IP', N'Activa'),
    (N'15', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Promoción de la Innovación Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000482', NULL, N'202412109', N'172.16.5.206', N'IP', N'Activa'),
    (N'16', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Promoción de la Innovación Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000613', NULL, N'202411755', N'172.16.5.207', N'IP', N'Activa'),
    (N'17', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Promoción de la Innovación Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000486', NULL, N'202412347', N'172.16.5.210', N'IP', N'Activa'),
    (N'31', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000418', NULL, N'202415200', NULL, N'IP', N'En mantenimiento'),
    (N'52', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Productos Agrarios', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000646', NULL, N'202412751', N'172.16.5.169', N'IP', N'Activa'),
    (N'81', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'—', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000815', N'742223580083', N'202409494', N'172.16.23.9', N'IP', N'Activa'),
    (N'87', N'Sede Central', N'Dirección de Servicios Estratégicos Agrarios', N'Subdirección de Extensión Agropecuaria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000577', NULL, N'202409101', N'172.16.5.173', N'IP', N'Activa'),
    (N'114', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000660', NULL, N'202407128', N'172.16.23.142', N'IP', N'Activa'),
    (N'115', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000373', NULL, N'202407120', NULL, N'IP', N'En mantenimiento'),
    (N'152', N'Sede Central', N'Oficina de Gestión de Recursos Humanos', N'Secretaría Técnica', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora Multifuncional Laser', N'A789041000598', NULL, N'202419777', NULL, N'IP', N'En mantenimiento'),
    (N'32', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74041000155', NULL, N'202407796', N'172.16.23.59', N'IP', N'Activa'),
    (N'33', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74041000586', NULL, N'202408107', N'172.16.23.92', N'IP', N'Activa'),
    (N'50', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74041000595', NULL, N'202408121', N'172.16.22.165', N'IP', N'Activa'),
    (N'61', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74047700242', N'742223580402', NULL, N'172.16.23.165', N'IP', N'Activa'),
    (N'62', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74041000254', N'74222358-0278', N'202410598', N'172.16.23.69', N'IP', N'Activa'),
    (N'63', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74041000871', N'74222358-0313', N'202410123', N'172.16.23.89', N'IP', N'Activa'),
    (N'64', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74041000726', N'742223580311', N'202410718', N'172.16.23.90', N'IP', N'Activa'),
    (N'70', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'Subdirección de Recursos Genéticos', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora Multifuncional Laser', N'AC74041000843', N'74222358-0312', N'202410289', N'172.16.23.88', N'IP', N'Activa'),
    (N'34', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora Multifuncional Laser', N'AA6R041001576', N'74222358-0156', N'202408106', N'172.16.23.168', N'IP', N'Activa'),
    (N'35', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora Multifuncional Laser', N'AA6R041001586', N'74222358-0155', N'202408914', NULL, N'IP', N'En mantenimiento'),
    (N'53', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Productos Agrarios', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora Multifuncional Laser', N'AA6R041001479', N'74222358-0157', N'202408581', N'172.16.23.37', N'IP', N'Activa'),
    (N'116', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora Multifuncional Laser', N'AA6R041001023', N'74222358-0152', N'202406653', N'172.16.23.29', N'IP', N'Activa'),
    (N'131', N'Sede Central', N'Oficina de Administración', N'Unidad de Contabilidad', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora Multifuncional Laser', N'AA6R041000999', N'74222358-0153', N'202406290', N'172.16.23.28', N'IP', N'Activa'),
    (N'132', N'Sede Central', N'Oficina de Administración', N'Unidad de Contabilidad', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora Multifuncional Laser', N'AA6R041000907', N'74222358-0151', N'202409196', N'172.16.23.73', N'IP', N'Activa'),
    (N'51', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Investigación y Liberación de Tecnologías', N'KONICA MINOLTA', N'BIZHUB C266', N'Fotocopiadora Multifuncional Laser a Color', N'A90G041000609', NULL, N'202412706', NULL, N'IP', N'En mantenimiento'),
    (N'29', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'—', N'KONICA MINOLTA', N'BIZHUB C360I', N'Fotocopiadora Multifuncional Laser a Color', N'AA2J041008871', NULL, N'202408441', N'172.16.23.33', N'IP', N'Activa'),
    (N'106', N'Sede Central', N'Oficina de Administración', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900243', N'74222358-0362', N'202405040', N'172.16.23.124', N'IP', N'Activa'),
    (N'3', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'—', N'KYOCERA', N'TASKALFA 306CI', N'Fotocopiadora Multifuncional Laser a Color', N'VEV6400057', NULL, N'202412473', NULL, N'IP', N'Activa'),
    (N'4', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'—', N'KYOCERA', N'TASKALFA 6003I', N'Fotocopiadora Multifuncional Laser', N'RFQ0803836', N'74222358-0214', N'202412263', N'172.16.23.42', N'IP', N'Activa'),
    (N'5', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'—', N'KYOCERA', N'TASKALFA 6003I', N'Fotocopiadora Multifuncional Laser', N'RFQ0803839', NULL, N'202412186', N'172.16.23.43', N'IP', N'Activa'),
    (N'11', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'Subdirección de Normatividad de la Innovación Agraria', N'KYOCERA', N'TASKALFA 6003I', N'Fotocopiadora Multifuncional Laser', N'RFQ0803841', N'74222358-0216', N'202412116', N'172.16.23.45', N'IP', N'Activa'),
    (N'54', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Productos Agrarios', N'KYOCERA', N'TASKALFA 7003I', N'Fotocopiadora Multifuncional Laser', N'RU91100636', N'74222358-0280', N'202409160', N'172.16.23.60', N'IP', N'Activa'),
    (N'1', N'Sede Central', N'Dirección Ejecutiva PRED', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H4900810', NULL, NULL, N'172.16.23.171', N'IP', N'Activa'),
    (N'6', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900256', N'74222358-0366', N'202412039', N'172.16.23.119', N'IP', N'Activa'),
    (N'55', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Productos Agrarios', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900254', N'74222358-0365', N'202415106', N'172.16.23.137', N'IP', N'Activa'),
    (N'90', N'Sede Central', N'Gerencia General', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900273', NULL, N'202406733', N'172.16.23.125', N'IP', N'Activa'),
    (N'95', N'Sede Central', N'Gerencia General', N'Unidad de Atención al Ciudadano y Gestión Documental', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900272', N'74222358-0372', N'202415466', N'172.16.23.134', N'IP', N'Activa'),
    (N'102', N'Sede Central', N'Gerencia General', N'Unidad de Comunicaciones e Imagen Institucional', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900265', N'74222358-0370', N'202419887', N'172.16.23.131', N'IP', N'Activa'),
    (N'117', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900257', N'74222358-0367', N'202408200', N'172.16.23.116', N'IP', N'Activa'),
    (N'118', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900224', N'74222358-0358', N'202406650', N'172.16.23.118', N'IP', N'Activa'),
    (N'119', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900271', NULL, NULL, N'172.16.23.126', N'IP', N'Activa'),
    (N'120', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900241', N'74222358-0361', N'202406652', N'172.16.23.135', N'IP', N'Activa'),
    (N'121', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900233', N'74222358-0359', N'202406177', N'172.16.23.136', N'IP', N'Activa'),
    (N'133', N'Sede Central', N'Oficina de Administración', N'Unidad de Contabilidad', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900309', N'74222358-0378', N'202406291', N'172.16.23.121', N'IP', N'Activa'),
    (N'134', N'Sede Central', N'Oficina de Administración', N'Unidad de Contabilidad', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900303', N'74222358-0377', N'202406411', N'172.16.23.122', N'IP', N'Activa'),
    (N'140', N'Sede Central', N'Oficina de Administración', N'Unidad de Tesorería', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900236', N'74222358-0360', N'202406519', N'172.16.23.123', N'IP', N'Activa'),
    (N'142', N'Sede Central', N'Oficina de Asesoría Jurídica', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900261', N'74222358-0369', N'202414775', N'172.16.23.129', N'IP', N'Activa'),
    (N'145', N'Sede Central', N'Oficina de Control Institucional', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900253', N'74222358-0364', N'202411250', N'172.16.23.120', N'IP', N'Activa'),
    (N'148', N'Sede Central', N'Oficina de Gestión de Recursos Humanos', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900222', N'74222358-0357', N'202405856', N'172.16.23.117', N'IP', N'Activa'),
    (N'149', N'Sede Central', N'Oficina de Gestión de Recursos Humanos', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900163', N'74222358-0355', N'202405989', N'172.16.23.139', N'IP', N'Activa'),
    (N'153', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900258', N'74222358-0368', N'202416182', N'172.16.23.130', N'IP', N'Activa'),
    (N'154', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Cooperación Técnica y Financiera', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900297', N'74222358-0375', N'202416219', N'172.16.23.138', N'IP', N'Activa'),
    (N'156', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Inversiones', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900298', N'74222358-0376', N'202416053', N'172.16.23.140', N'IP', N'Activa'),
    (N'157', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Planeamiento y Modernización', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900312', N'74222358-0379', N'202416314', N'172.16.23.133', N'IP', N'Activa'),
    (N'159', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Presupuesto', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900282', NULL, NULL, N'172.16.23.132', N'IP', N'Activa'),
    (N'161', N'Sede Central', N'Presidencia Ejecutiva', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900166', NULL, N'202415294', N'172.16.23.127', N'IP', N'Activa'),
    (N'162', N'Sede Central', N'Presidencia Ejecutiva', N'—', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora Multifuncional Laser', N'H6H3900250', NULL, N'202415389', N'172.16.23.128', N'IP', N'Activa'),
    (N'71', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'Subdirección de Recursos Genéticos', N'KYOCERA', N'TASKALFA 8353CI', N'Fotocopiadora Multifuncional Laser a Color', N'RTW0Y00009', N'74222358-0380', N'202410208', N'172.16.23.143', N'IP', N'Activa'),
    (N'163', N'Sede Central', N'Presidencia Ejecutiva', N'—', N'KYOCERA', N'TASKALFA 3553CI', N'Fotocopiadora Multifuncional Laser a Color', N'RMZ9300005', N'742222358-0154', N'202415412', N'172.16.23.70', N'IP', N'Activa'),
    (N'7', N'Sede Central', N'Dirección de Gestión de la Innovación Agraria', N'—', N'OKI', N'ES8473MFP', N'Impresora Multifuncional Laser a Color', N'AL6C047522', N'74222358-0213', N'202412040', NULL, N'IP', N'Activa'),
    (N'56', N'Sede Central', N'Dirección de Investigación y Desarrollo Tecnológico', N'Subdirección de Productos Agrarios', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000050', N'74222358-0348', N'202415105', NULL, N'IP', N'Activa'),
    (N'91', N'Sede Central', N'Gerencia General', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000140', N'742222358-0335', N'202415401', N'172.16.23.172', N'IP', N'Activa'),
    (N'92', N'Sede Central', N'Gerencia General', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000070', NULL, NULL, NULL, N'USB', N'Activa'),
    (N'93', N'Sede Central', N'Gerencia General', N'Unidad Funcional de Integridad', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000044', N'74222358-0345', N'202419756', N'172.16.23.169', N'IP', N'Activa'),
    (N'94', N'Sede Central', N'Gerencia General', N'Unidad Funcional de Integridad', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000006', N'74222358-0349', N'202416134', N'172.16.23.170', N'IP', N'Activa'),
    (N'96', N'Sede Central', N'Gerencia General', N'Unidad de Atención al Ciudadano y Gestión Documental', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000127', N'74222358-0334', N'202419730', N'172.16.60.242', N'IP', N'Activa'),
    (N'97', N'Sede Central', N'Gerencia General', N'Unidad de Atención al Ciudadano y Gestión Documental', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000038', N'74222358-0328', N'202419701', NULL, N'IP', N'Activa'),
    (N'103', N'Sede Central', N'Gerencia General', N'Unidad de Comunicaciones e Imagen Institucional', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000023', N'74222358-0333', N'202419902', NULL, N'USB', N'Activa'),
    (N'105', N'Sede Central', N'Gerencia General', N'Unidad de Tecnología de la Información', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000118', N'74222358-0341', N'202421415', N'172.16.23.167', N'IP', N'Activa'),
    (N'107', N'Sede Central', N'Oficina de Administración', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000028', N'74222358-0339', N'202406069', NULL, N'Red', N'Activa'),
    (N'122', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000093', N'74222358-0337', N'202414923', N'172.16.23.161', N'IP', N'Activa'),
    (N'123', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000068', N'74222358-0344', N'202406904', NULL, N'USB', N'Activa'),
    (N'135', N'Sede Central', N'Oficina de Administración', N'Unidad de Contabilidad', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000117', N'74222358-0330', N'202406412', N'172.16.23.163', N'IP', N'Activa'),
    (N'141', N'Sede Central', N'Oficina de Administración', N'Unidad de Tesorería', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000054', N'74222358-0332', N'202406388', N'172.16.23.109', N'IP', N'Activa'),
    (N'143', N'Sede Central', N'Oficina de Asesoría Jurídica', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000094', N'74222358-0338', N'202414740', N'172.16.47.20', N'IP', N'Activa'),
    (N'146', N'Sede Central', N'Oficina de Control Institucional', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000095', N'74222358-0340', N'202411216', NULL, N'USB', N'Activa'),
    (N'150', N'Sede Central', N'Oficina de Gestión de Recursos Humanos', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000071', N'74222358-0343', N'202405885', N'172.16.23.162', N'IP', N'Activa'),
    (N'155', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Cooperación Técnica y Financiera', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000003', N'74222358-0346', NULL, N'172.16.23.114', N'IP', N'Activa'),
    (N'158', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Planeamiento y Modernización', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000046', N'74222358-0342', N'202416337', N'172.16.23.111', N'IP', N'Activa'),
    (N'160', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Presupuesto', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000075', N'74222358-0347', N'202416426', N'172.16.62.78', N'IP', N'Activa'),
    (N'164', N'Sede Central', N'Presidencia Ejecutiva', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000139', N'742222358-0327', NULL, NULL, N'USB', N'Activa'),
    (N'165', N'Sede Central', N'Presidencia Ejecutiva', N'—', N'PANTUM', N'BM5100FDW', N'Impresora Multifuncional Laser', N'CL5N000053', NULL, NULL, NULL, N'USB', N'Activa'),
    (N'98', N'Sede Central', N'Gerencia General', N'Unidad de Atención al Ciudadano y Gestión Documental', N'TSC', N'TE200', N'Impresora Etiquetadora', N'TEA22074619', N'74084043-0010', N'202419736', NULL, N'USB', N'Activa'),
    (N'99', N'Sede Central', N'Gerencia General', N'Unidad de Atención al Ciudadano y Gestión Documental', N'TSC', N'TE200', N'Impresora Etiquetadora', N'TEA22074627', N'74084043-0009', N'202419723', NULL, N'USB', N'Activa'),
    (N'100', N'Sede Central', N'Gerencia General', N'Unidad de Atención al Ciudadano y Gestión Documental', N'TSC', N'TE200', N'Impresora Etiquetadora', N'TEA22074612', N'74084043-0007', N'202436151', NULL, N'USB', N'Activa'),
    (N'101', N'Sede Central', N'Gerencia General', N'Unidad de Atención al Ciudadano y Gestión Documental', N'TSC', N'TE200', N'Impresora Etiquetadora', N'TEA22074609', N'74084043-0001', N'202419710', NULL, N'USB', N'Activa'),
    (N'124', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'TSC', N'TE200', N'Impresora Etiquetadora', N'TEA23271721', N'74083200-0094', N'202414929', NULL, N'USB', N'Activa'),
    (N'125', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'TSC', N'TTP-247', N'Impresora Etiquetadora', N'T4519270736', N'740832000078', N'202414903', NULL, N'USB', N'Activa'),
    (N'127', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'XEROX', N'VERSALINK C405', N'Impresora Multifuncional Laser a Color', N'3356628020', N'74223580-0256', N'202406130', NULL, N'IP', N'En mantenimiento'),
    (N'104', N'Sede Central', N'Gerencia General', N'Unidad de Comunicaciones e Imagen Institucional', N'XEROX', N'VERSALINK C700', N'Fotocopiadora Multifuncional Laser a Color', N'AIUE041108781', NULL, N'202412436', N'172.16.23.40', N'IP', N'Activa'),
    (N'151', N'Sede Central', N'Oficina de Gestión de Recursos Humanos', N'—', N'ZEBRA', N'ZC32', N'Impresora Etiquetadora', N'ZC300', N'952246270003', N'202405766', NULL, N'USB', N'Activa'),
    (N'128', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'ZEBRA', N'ZD230', N'Impresora Etiquetadora', N'D5N233100266', N'74082875-0002', N'202428906', NULL, N'USB', N'Activa'),
    (N'129', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'ZEBRA', N'ZD230', N'Impresora Etiquetadora', N'D5N232100370', N'74083875-0004', N'202426619', NULL, N'USB', N'Activa'),
    (N'130', N'Sede Central', N'Oficina de Administración', N'Unidad de Abastecimiento', N'ZEBRA', N'ZD230', N'Impresora Etiquetadora', N'D5N233100419', N'74083875-0003', N'202404211', NULL, N'USB', N'Activa'),
    (N'66', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'ZEBRA', N'ZT410', N'Impresora Etiquetadora', N'18J162800909', N'740832000061', N'202410714', NULL, N'USB', N'Activa'),
    (N'73', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'Subdirección de Recursos Genéticos', N'ZEBRA', N'ZT410', N'Impresora Etiquetadora', N'18J1516000347', NULL, N'202410138', NULL, N'USB', N'Activa'),
    (N'72', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'Subdirección de Recursos Genéticos', N'ZEBRA', N'ZT411', N'Impresora Etiquetadora', N'99N230501794', N'74083200-0090', N'202410288', NULL, N'USB', N'Activa'),
    (N'65', N'Sede Central', N'Dirección de Recursos Genéticos y Biotecnología', N'—', N'ZEBRA', N'ZTA10', N'Impresora Etiquetadora', N'18J162200396', N'74083200-0002', N'202410409', NULL, N'USB', N'Activa');
GO

INSERT INTO dbo.impresoras (modelo_impresora_id, tipo_impresora_id, serie, codigo_inventario, codigo_patrimonial, tipo_conexion, ip, sede_id, dependencia_id, subdependencia_id, estado)
SELECT mi.id, ti.id, s.serie, s.codigo_inventario, s.codigo_patrimonial, s.tipo_conexion, s.ip, sd.id, dep.id, sub.id, s.estado
FROM #impresoras_staging s
JOIN dbo.sedes sd ON sd.nombre = s.sede
JOIN dbo.dependencias dep ON dep.nombre = s.dependencia AND dep.sede_id = sd.id
JOIN dbo.subdependencias sub ON sub.nombre = s.subdependencia AND sub.dependencia_id = dep.id
JOIN dbo.marcas_impresora ma ON ma.nombre = s.marca
JOIN dbo.modelos_impresora mi ON mi.marca_id = ma.id AND mi.nombre = s.modelo
JOIN dbo.tipos_impresora ti ON LTRIM(RTRIM(ti.nombre)) = s.tipo
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.impresoras i
    WHERE i.modelo_impresora_id = mi.id
      AND ISNULL(i.serie, '') = ISNULL(s.serie, '')
      AND ISNULL(i.codigo_patrimonial, '') = ISNULL(s.codigo_patrimonial, '')
      AND ISNULL(i.codigo_inventario, '') = ISNULL(s.codigo_inventario, '')
);
GO

DROP TABLE #impresoras_staging;
GO

-- ============================================================
-- Verificacion final
-- ============================================================
SELECT 'marcas_impresora' AS tabla, COUNT(*) AS total FROM dbo.marcas_impresora UNION ALL
SELECT 'modelos_impresora', COUNT(*) FROM dbo.modelos_impresora UNION ALL
SELECT 'modelo_impresora_toners', COUNT(*) FROM dbo.modelo_impresora_toners UNION ALL
SELECT 'impresoras', COUNT(*) FROM dbo.impresoras;
GO