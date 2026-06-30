-- Carga limpia de impresoras desde Impresoras 2025-2026.xlsx
-- Version 2: cat?logos por staging, dependencias/subdependencias amarradas a sede, sin GO, compatible con SSMS/Azure Data Studio/DBeaver.
-- Registros importables: 179

USE ssti;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DROP TABLE IF EXISTS #impresoras_import;
    CREATE TABLE #impresoras_import (
        source_row INT NOT NULL,
        source_numero NVARCHAR(30) NULL,
        sede NVARCHAR(150) NOT NULL,
        dependencia NVARCHAR(150) NULL,
        subdependencia NVARCHAR(150) NULL,
        marca NVARCHAR(80) NOT NULL,
        modelo NVARCHAR(100) NOT NULL,
        tipo_impresora NVARCHAR(100) NULL,
        serie NVARCHAR(100) NULL,
        codigo_inventario NVARCHAR(100) NULL,
        codigo_patrimonial NVARCHAR(100) NULL,
        tipo_conexion NVARCHAR(10) NOT NULL,
        ip NVARCHAR(45) NULL,
        modelo_toner_negro NVARCHAR(80) NULL,
        modelo_toner_c NVARCHAR(80) NULL,
        modelo_toner_m NVARCHAR(80) NULL,
        modelo_toner_y NVARCHAR(80) NULL,
        estado NVARCHAR(30) NOT NULL
    );

    INSERT INTO #impresoras_import VALUES (2, N'156', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'KONICA MINOLTA', N'BIZHUB C360I', N'Fotocopiadora multifuncional', N'AA2J041008871', N'202408441', NULL, N'IP', N'172.16.23.33', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (3, N'88', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora multifuncional', N'A1UE041104348', N'202406682', NULL, N'IP', N'172.16.10.252', N'TN-414', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (4, N'48', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Supervision y Monitoreo', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora multifuncional', N'A1UE041114655', N'202405462', N'74222358-0298', N'IP', N'172.16.10.32', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (5, N'74', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora multifuncional', N'A1UE041114301', N'202410833', N'742223580069', N'IP', N'172.16.23.173', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (6, N'82', N'Sede Central', N'Oficina de Gestion de Recursos Humanos', NULL, N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora multifuncional', N'A1UE041114570', N'202405993', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (7, N'163', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora multifuncional', N'A1UE041105892', N'202415193', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (8, N'172', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'KONICA MINOLTA', N'BIZHUB 363', N'Fotocopiadora multifuncional', NULL, N'202412708', N'74222726-0023', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (9, N'96', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000660', N'202407128', NULL, N'IP', N'172.16.23.142', N'TN-323', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (10, N'41', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Normatividad de la Innovacion Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000620', N'202419526', N'74222358-0109', N'IP', N'172.16.23.166', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (11, N'164', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000815', N'202409494', N'742223580083', N'IP', N'172.16.23.9', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (12, N'133', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Productos Agrarios', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000646', N'202412751', NULL, N'IP', N'172.16.5.169', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (13, N'51', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000577', N'202409101', NULL, N'IP', N'172.16.5.173', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (14, N'30', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Promocion de la Innovacion Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000482', N'202412109', NULL, N'IP', N'172.16.5.206', N'TN-323', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (15, N'34', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Promocion de la Innovacion Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000613', N'202411755', NULL, N'IP', N'172.16.5.207', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (16, N'32', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Promocion de la Innovacion Agraria', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000486', N'202412347', NULL, N'IP', N'172.16.5.210', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (17, N'83', N'Sede Central', N'Oficina de Gestion de Recursos Humanos', N'Secretaria Tecnica', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000598', N'202419777', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (18, N'89', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000373', N'202407120', NULL, N'USB', NULL, N'TN-323', NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (19, N'162', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'KONICA MINOLTA', N'BIZHUB 367', N'Fotocopiadora multifuncional', N'A789041000418', N'202415200', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (20, N'109', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74041000595', N'202408121', NULL, N'IP', N'172.16.22.165', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (21, N'63', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74047700242', NULL, N'742223580402', N'IP', N'172.16.23.165', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (22, N'134', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74041000155', N'202407796', NULL, N'IP', N'172.16.23.59', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (23, N'62', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74041000254', N'202410598', N'74222358-0278', N'IP', N'172.16.23.69', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (24, N'69', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', N'Subdireccion de Recursos Geneticos', N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74041000843', N'202410289', N'74222358-0312', N'IP', N'172.16.23.88', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (25, N'72', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74041000871', N'202410123', N'74222358-0313', N'IP', N'172.16.23.89', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (26, N'66', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74041000726', N'202410718', N'742223580311', N'IP', N'172.16.23.90', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (27, N'137', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'KONICA MINOLTA', N'BIZHUB 650I', N'Fotocopiadora multifuncional', N'AC74041000586', N'202408107', NULL, N'IP', N'172.16.23.92', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (28, N'138', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora multifuncional', N'AA6R041001576', N'202408106', N'74222358-0156', N'IP', N'172.16.23.168', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (29, N'95', N'Sede Central', N'Oficina de Administracion', N'Unidad de Contabilidad', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora multifuncional', N'AA6R041000999', N'202406290', N'74222358-0153', N'IP', N'172.16.23.28', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (30, N'84', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora multifuncional', N'AA6R041001023', N'202406653', N'74222358-0152', N'IP', N'172.16.23.29', N'TN-516', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (31, N'148', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Productos Agrarios', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora multifuncional', N'AA6R041001479', N'202408581', N'74222358-0157', N'IP', N'172.16.23.37', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (32, N'91', N'Sede Central', N'Oficina de Administracion', N'Unidad de Contabilidad', N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora multifuncional', N'AA6R041000907', N'202409196', N'74222358-0151', N'IP', N'172.16.23.73', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (33, N'141', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'KONICA MINOLTA', N'BIZHUB 658E', N'Fotocopiadora multifuncional', N'AA6R041001586', N'202408914', N'74222358-0155', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (34, N'171', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'KONICA MINOLTA', N'BIZHUB C266', N'Fotocopiadora multifuncional', N'A90G041000609', N'202412706', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (35, N'97', N'Sede Central', N'Oficina de Administracion', N'Unidad de Tesoreria', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000054', N'202406388', N'74222358-0332', N'IP', N'172.16.23.109', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (36, N'131', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Planeamiento y Modernizacion', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000046', N'202416337', N'74222358-0342', N'IP', N'172.16.23.111', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (37, N'46', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'HP', N'LASERJET MANAGED FLOW MFP E826', N'Impresora laser', N'MXBCQC31QS', N'202405536', N'74222358-0381', N'IP', N'172.16.23.141', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (38, N'126', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Cooperacion Tecnica y Financiera', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000003', NULL, N'74222358-0346', N'IP', N'172.16.23.114', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (39, N'103', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000093', N'202414923', N'74222358-0337', N'IP', N'172.16.23.161', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (40, N'39', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', NULL, N'HP', N'HP LASERJETMFP M426FDW', N'Impresora laser', N'BRBSHB1836', N'202412474', N'74084100-0110', N'IP', N'172.16.23.146', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (41, N'77', N'Sede Central', N'Oficina de Gestion de Recursos Humanos', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000071', N'202405885', N'74222358-0343', N'IP', N'172.16.23.162', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (42, N'92', N'Sede Central', N'Oficina de Administracion', N'Unidad de Contabilidad', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000117', N'202406412', N'74222358-0330', N'IP', N'172.16.23.163', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (43, N'7', N'Sede Central', N'Gerencia General', N'Unidad de Tecnologia de la Informacion', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000118', N'202421415', N'74222358-0341', N'IP', N'172.16.23.167', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (44, N'9', N'Sede Central', N'Gerencia General', N'Unidad Funcional de Integridad', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000044', N'202419756', N'74222358-0345', N'IP', N'172.16.23.169', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (45, N'8', N'Sede Central', N'Gerencia General', N'Unidad Funcional de Integridad', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000006', N'202416134', N'74222358-0349', N'IP', N'172.16.23.170', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (46, N'124', N'Sede Central', N'Oficina de Asesoria Juridica', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000094', N'202414740', N'74222358-0338', N'IP', N'172.16.47.20', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (47, N'18', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000127', N'202419730', N'74222358-0334', N'IP', N'172.16.60.242', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (48, N'132', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Presupuesto', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000075', N'202416426', N'74222358-0347', N'IP', N'172.16.62.78', N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (49, N'2', N'Sede Central', N'Presidencia Ejecutiva', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000139', NULL, N'742222358-0327', N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (50, N'3', N'Sede Central', N'Presidencia Ejecutiva', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000053', NULL, NULL, N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (51, N'10', N'Sede Central', N'Gerencia General', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000140', N'202415401', N'742222358-0335', N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (52, N'11', N'Sede Central', N'Gerencia General', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000070', NULL, NULL, N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (53, N'15', N'Sede Central', N'Gerencia General', N'Unidad de Comunicaciones e Imagen Institucional', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000023', N'202419902', N'74222358-0333', N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (54, N'24', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000038', N'202419701', N'74222358-0328', N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (55, N'111', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000068', N'202406904', N'74222358-0344', N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (56, N'113', N'Sede Central', N'Oficina de Administracion', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000028', N'202406069', N'74222358-0339', N'IP', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (57, N'145', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Productos Agrarios', N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000050', N'202415105', N'74222358-0348', N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (58, N'180', N'Sede Central', N'Oficina de Control Institucional', NULL, N'PANTUM', N'BM5100FDW', N'Impresora multifuncional', N'CL5N000095', N'202411216', N'74222358-0340', N'USB', NULL, N'TL-5120X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (59, N'28', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', NULL, N'OKI', N'ES8473MFP', N'Impresora multifuncional laser a color', N'AL6C047522', N'202412040', N'74222358-0213', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (60, N'44', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'CANON', N'IMAGE RUNNER ADVANCE DX 6855I', N'Fotocopiadora multifuncional', N'35X00512', N'202405275', N'74222358-0316', N'IP', N'172.16.23.103', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (61, N'55', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'CANON', N'IMAGEPRESS SERVER H350', N'Server', N'A00089230', N'202416442', NULL, N'IP', N'172.16.23.46', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (62, N'98', N'Sede Central', N'Oficina de Administracion', N'Unidad de Tesoreria', N'CANON', N'IMAGERUNNER ADANCE DX 68701', N'Fotocopiadora multifuncional', N'4DQ00504', N'202406520', N'74222358-0297', N'IP', N'172.16.23.81', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (63, N'50', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'CANON', N'IMAGERUNNER ADVANCE DX 6855I', N'Fotocopiadora multifuncional', N'35X00508', N'202405396', N'74222358-0315', N'IP', N'172.16.23.102', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (64, N'135', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'CANON', N'IMAGERUNNER ADVANCE DX 6855I', N'Fotocopiadora multifuncional', N'35X00561', N'202408868', NULL, N'IP', N'172.16.23.151', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (65, N'49', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora multifuncional', N'3LY00530', N'202405643', N'74222358-0314', N'IP', N'172.16.23.100', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (66, N'68', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', N'Subdireccion de Biotecnologia', N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora multifuncional', N'3LY00532', N'202410341', N'74222358-0318', N'IP', N'172.16.23.104', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (67, N'161', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora multifuncional', N'4DQ00503', N'202408940', N'74222358-0310', N'IP', N'172.16.23.87', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (68, N'90', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'CANON', N'IMAGERUNNER ADVANCE DX 6870I', N'Fotocopiadora multifuncional', N'ZBAB00241532', N'202406659', N'72222358-0296', N'USB', NULL, N'GPR-63', NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (69, N'114', N'Sede Central', N'Oficina de Administracion', NULL, N'KYOCERA', N'TASALFA7004I', N'Fotocopiadora multifuncional', N'H6H3900243', N'202405040', N'74222358-0362', N'IP', N'172.16.23.124', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (70, N'38', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', NULL, N'KYOCERA', N'TASKALFA 306CI', N'Fotocopiadora multifuncional', N'VEV6400057', N'202412473', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (71, N'26', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', NULL, N'KYOCERA', N'TASKALFA 6003I', N'Fotocopiadora multifuncional', N'RFQ0803836', N'202412263', N'74222358-0214', N'IP', N'172.16.23.42', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (72, N'27', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', NULL, N'KYOCERA', N'TASKALFA 6003I', N'Fotocopiadora multifuncional', N'RFQ0803839', N'202412186', NULL, N'IP', N'172.16.23.43', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (74, N'40', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Normatividad de la Innovacion Agraria', N'KYOCERA', N'TASKALFA 6003I', N'Fotocopiadora multifuncional', N'RFQ0803841', N'202412116', N'74222358-0216', N'IP', N'172.16.23.45', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (75, N'107', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'HP', N'LASERJET PRO MFP 4103FDW', N'Impresora laser', N'BRBSQD007P', N'202414982', N'74222358-0306', N'IP', N'172.16.41.150', N'W1510A / W1510X', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (76, N'147', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Productos Agrarios', N'KYOCERA', N'TASKALFA 7003I', N'Fotocopiadora multifuncional', N'RU91100636', N'202409160', N'74222358-0280', N'IP', N'172.16.23.60', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (77, N'144', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Productos Agrarios', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900254', N'202415106', N'74222358-0365', N'IP', N'172.16.23.137', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (78, N'117', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900257', N'202408200', N'74222358-0367', N'IP', N'172.16.23.116', N'TK-6347', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (79, N'78', N'Sede Central', N'Oficina de Gestion de Recursos Humanos', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900222', N'202405856', N'74222358-0357', N'IP', N'172.16.23.117', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (80, N'87', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900224', N'202406650', N'74222358-0358', N'IP', N'172.16.23.118', N'TK-6347', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (81, N'29', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900256', N'202412039', N'74222358-0366', N'IP', N'172.16.23.119', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (82, N'179', N'Sede Central', N'Oficina de Control Institucional', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900253', N'202411250', N'74222358-0364', N'IP', N'172.16.23.120', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (83, N'177', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'EPSON', N'L5190', N'Impresora de inyeccion a color', N'X5NS036777', N'202416745', N'74083650-0058', N'IP', N'172.16.62.18', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (84, N'94', N'Sede Central', N'Oficina de Administracion', N'Unidad de Contabilidad', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900309', N'202406291', N'74222358-0378', N'IP', N'172.16.23.121', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (85, N'158', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'COLOR LASERJET PRO M452DW', N'Impresora laser', NULL, N'202408414', N'74084100-0244', N'IP', N'192.16.0.110', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (86, N'93', N'Sede Central', N'Oficina de Administracion', N'Unidad de Contabilidad', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900303', N'202406411', N'74222358-0377', N'IP', N'172.16.23.122', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (87, N'99', N'Sede Central', N'Oficina de Administracion', N'Unidad de Tesoreria', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900236', N'202406519', N'74222358-0360', N'IP', N'172.16.23.123', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (88, N'6', N'Sede Central', N'Gerencia General', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900273', N'202406733', NULL, N'IP', N'172.16.23.125', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (89, N'105', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900271', NULL, NULL, N'IP', N'172.16.23.126', N'TK-6347', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (90, N'12', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'FUJITSU', N'FI-6800', N'Escaner', N'A9ECC01742', N'202419647', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (91, N'4', N'Sede Central', N'Presidencia Ejecutiva', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900166', N'202415294', NULL, N'IP', N'172.16.23.127', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (92, N'17', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'TSC', N'TE200', N'Impresora etiquetadora', N'TEA22074619', N'202419736', N'74084043-0010', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (93, N'19', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'TSC', N'TE200', N'Impresora etiquetadora', N'TEA22074627', N'202419723', N'74084043-0009', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (94, N'20', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'FUJITSU', N'FI-6800', N'Escaner', NULL, N'202419724', N'74080050-0085', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (95, N'21', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'TSC', N'TE200', N'Impresora etiquetadora', N'TEA22074612', N'202436151', N'74084043-0007', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (96, N'22', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'TSC', N'TE200', N'Impresora etiquetadora', N'TEA22074609', N'202419710', N'74084043-0001', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (97, N'23', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'FUJITSU', N'FI-7900', N'Escaner', NULL, N'202419711', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (98, N'5', N'Sede Central', N'Presidencia Ejecutiva', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900250', N'202415389', NULL, N'IP', N'172.16.23.128', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (100, N'123', N'Sede Central', N'Oficina de Asesoria Juridica', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900261', N'202414775', N'74222358-0369', N'IP', N'172.16.23.129', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (101, N'31', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', NULL, N'FUJITSU', N'FI-7900', N'Escaner', N'C2WC000859', N'202412147', N'74080050-0092', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (102, N'33', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Promocion de la Innovacion Agraria', N'HP', N'LASERJET PRO MFP M127FN', N'Impresora laser', N'BRBSG7FVKZ', N'202412379', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (103, N'35', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Promocion de la Innovacion Agraria', N'EPSON', N'L310', N'Impresora de inyeccion a color', N'VHLK004899', N'202411760', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (104, N'36', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Promocion de la Innovacion Agraria', N'HP', N'HP LASERJET P1102W', N'Impresora laser', N'BRBSB6BG1J', N'202411762', N'74084100-0125', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (105, N'37', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Promocion de la Innovacion Agraria', N'HP', N'HP SCANJET 5590', N'Escaner', N'CN35HW0V0', N'202411766', N'74080050-0037', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (106, N'130', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900258', N'202416182', N'74222358-0368', N'IP', N'172.16.23.130', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (107, N'42', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Normatividad de la Innovacion Agraria', N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora laser', N'BRBSHB182S', N'202419527', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (108, N'43', N'Sede Central', N'Direccion de Gestion de la Innovacion Agraria', N'Subdireccion de Normatividad de la Innovacion Agraria', N'HP', N'HP OFFICEJET PRO 251DW', N'Impresora de inyeccion a color', N'CN4COCV020', N'202419259', N'740836500039', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (109, N'45', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Supervision y Monitoreo', N'HP', N'LASERTJET PRO MFP M426FDW', N'Impresora laser', N'SRBSHBL81T', N'202405496', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (110, N'47', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'HP', N'LASERTJET PRO MFP M426FDW', N'Impresora laser', N'BRBSHB1835', N'202405561', N'74084100-0104', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (111, N'52', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'HP', N'HP LASERJET 1536DNF MFP', N'Impresora laser', N'CNB9B84B71', N'202409098', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (112, N'53', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'HP', N'HP LASERJET 1536DNF MFP', N'Impresora laser', N'CNB9B84B9R', N'202409327', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (113, N'54', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'CANON', N'IMAGEPRESS C810', N'Imprenta digital a color', N'2NY06022', N'202416438', N'67505880-0005', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (114, N'56', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora laser', N'CNF8H7W84D', N'202416468', N'740841000147', N'USB', NULL, N'CF280X
CF280A
12 MESES', NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (115, N'57', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'HEIDELBERG', N'HEIDELBERG GTO', N'Imprenta offset', NULL, N'202416480', N'67505880-0001', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (116, N'58', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'GM3', N'SFML-720', N'Laminadora', N'20103002', N'202416486', N'67506374-0001', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (117, N'59', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'HP', N'HP DESINGJET T650', N'Impresora plotter', N'CN29L4M04T', N'202405280', N'74085000-0006', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (118, N'60', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'HP', N'LASERJET PRO MFP M426FDW', N'Impresora laser', N'BRBSHB1831', N'202410187', N'74084100-0114', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (119, N'61', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'ZEBRA', N'ZTA10', N'Impresora etiquetadora', N'18J162200396', N'202410409', N'74083200-0002', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (120, N'65', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', N'Subdireccion de Recursos Geneticos', N'HP', N'LASERTJET PRO MFP 4103FDW', N'Impresora laser', N'BRBSQ7W0C9', N'202410032', N'74222358-0354', N'USB', NULL, N'W1510A
W1510X
12 MESES', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (121, N'67', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'ZEBRA', N'ZT410', N'Impresora etiquetadora', N'18J162800909', N'202410714', N'740832000061', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (122, N'70', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', N'Subdireccion de Recursos Geneticos', N'ZEBRA', N'ZT411', N'Impresora etiquetadora', N'99N230501794', N'202410288', N'74083200-0090', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (123, N'71', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', N'Subdireccion de Recursos Geneticos', N'ZEBRA', N'ZT410', N'Impresora etiquetadora', N'18J1516000347', N'202410138', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (124, N'73', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', N'Subdireccion de Biotecnologia', N'HP', N'LASERJET 400 MFP M425DN', N'Impresora laser', N'CNF8H7R3MH', N'202411929', N'74222358-0167', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (125, N'75', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'HP', N'HP DESKJET INK ADVANTAGE 2135', N'Impresora laser', N'F5S2880025', N'202410846', N'74083650-0068', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (126, N'76', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', NULL, N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora laser', N'CNF8H7R3M8', N'202410829', N'74222358-0031', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (127, N'79', N'Sede Central', N'Oficina de Gestion de Recursos Humanos', NULL, N'ZEBRA', N'ZC32', N'Impresora etiquetadora', N'ZC300', N'202405766', N'952246270003', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (128, N'81', N'Sede Central', N'Oficina de Gestion de Recursos Humanos', NULL, N'HP', N'HP DIGITAL SENDER FLOW 8500 FN2', N'Escaner', N'CNN3KAN002', N'202406017', N'74080050-0090', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (129, N'13', N'Sede Central', N'Gerencia General', N'Unidad de Comunicaciones e Imagen Institucional', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900265', N'202419887', N'74222358-0370', N'IP', N'172.16.23.131', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (130, N'128', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Presupuesto', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900282', NULL, NULL, N'IP', N'172.16.23.132', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (131, N'125', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Planeamiento y Modernizacion', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900312', N'202416314', N'74222358-0379', N'IP', N'172.16.23.133', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (132, N'16', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900272', N'202415466', N'74222358-0372', N'IP', N'172.16.23.134', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (133, N'100', N'Sede Central', N'Oficina de Administracion', N'Unidad de Tesoreria', N'EPSON', N'LQ-2090II', N'Impresora matricial', N'X4S3000093', N'202406482', N'74084550-0023', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (134, N'101', N'Sede Central', N'Oficina de Administracion', N'Unidad de Tesoreria', N'EPSON', N'LQ-2090II', N'Impresora matricial', N'X4S3000178', N'202406474', N'74084550-0024', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (135, N'102', N'Sede Central', N'Oficina de Administracion', N'Unidad de Tesoreria', N'EPSON', N'LQ-2090II', N'Impresora matricial', N'X4SS0001S1', N'202406491', N'74084550-0025', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (136, N'104', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'TSC', N'TE200', N'Impresora etiquetadora', N'TEA23271721', N'202414929', N'74083200-0094', N'USB', NULL, N'Cinta Térmica de Impresión', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (137, N'106', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'ZEBRA', N'ZD230', N'Impresora etiquetadora', N'D5N233100266', N'202428906', N'74082875-0002', N'USB', NULL, N'Cinta Térmica de Impresión', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (138, N'108', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'ZEBRA', N'ZD230', N'Impresora etiquetadora', N'D5N232100370', N'202426619', N'74083875-0004', N'USB', NULL, N'Cinta Térmica de Impresión', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (139, N'110', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'HP', N'HP DESIGNJET T830', N'Impresora plotter', N'CN8CB7M014', N'202414966', N'74085000005', N'USB', NULL, N'HP F9J68A Negro', N'HP F9J67A Cian', N'HP F9J66A Magenta', N'HP F9J65A Amarillo', N'Activa');
    INSERT INTO #impresoras_import VALUES (140, N'86', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900241', N'202406652', N'74222358-0361', N'IP', N'172.16.23.135', N'TK-6347', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (141, N'112', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'HP', N'LASERJET MFP M426DW', N'Impresora laser', N'BRBSHB183B', N'202406921', NULL, N'USB', NULL, N'CF226XD / CF226X', NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (142, N'85', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900233', N'202406177', N'74222358-0359', N'IP', N'172.16.23.136', N'TK-6347', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (143, N'127', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Cooperacion Tecnica y Financiera', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900297', N'202416219', N'74222358-0375', N'IP', N'172.16.23.138', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (144, N'119', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'ZEBRA', N'ZD230', N'Impresora etiquetadora', N'D5N233100419', N'202404211', N'74083875-0003', N'USB', NULL, N'Cinta Térmica de Impresión', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (145, N'120', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'TSC', N'TTP-247', N'Impresora etiquetadora', N'T4519270736', N'202414903', N'740832000078', N'USB', NULL, N'Cinta Térmica de Impresión', NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (146, N'121', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'HP', N'HP DESINGJET T730', N'Impresora plotter', N'CN98M7M0FK', N'202414970', N'74085000-0002', N'USB', NULL, N'HP F9J68A Negro', N'HP F9J67A Cian', N'HP F9J66A Magenta', N'HP F9J65A Amarillo', N'Activa');
    INSERT INTO #impresoras_import VALUES (148, N'136', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'BROTHER', N'DCP-T820DW', N'Impresora de inyeccion a color', N'U66055B2H595949', N'202407763', N'74222358-0283', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (149, N'139', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'HP', N'COLOR LASERJET PRO MFP M180NW', N'Impresora laser', N'VNC3201222', N'202408120', N'74222358-0160', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (150, N'140', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'EPSON', N'L4160', N'Impresora de inyeccion a color', N'X4DW094160', N'202408399', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (151, N'80', N'Sede Central', N'Oficina de Gestion de Recursos Humanos', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900163', N'202405989', N'74222358-0355', N'IP', N'172.16.23.139', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (152, N'142', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'HP', N'F6W15A', N'Impresora de inyeccion a color', N'BRBSHB183D', N'202407814', N'740836500030', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (153, N'143', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'HP', N'LASERT JET P2055DN', N'Impresora laser', N'CNCGC06577', N'202415189', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (154, N'129', N'Sede Central', N'Oficina de Planeamiento y Presupuesto', N'Unidad de Inversiones', N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H3900298', N'202416053', N'74222358-0376', N'IP', N'172.16.23.140', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (155, N'146', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Productos Agrarios', N'HP', N'HP SCANJET 5590', N'Escaner', N'CN085VH01X', N'202415112', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (156, N'149', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'EPSON', N'L6171', N'Impresora de inyeccion a color', NULL, N'202408778', N'74083650-0071', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (157, N'150', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'HP SCANJET G3110', N'Escaner', N'CN09RA50JP', N'202409128', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (158, N'151', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'CANON', N'PIXMA TS6010', N'Impresora de inyeccion a color', N'AERU00024', N'202408763', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (159, N'152', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'EPSON', N'L5190', N'Impresora de inyeccion a color', N'X5NS041355', N'202408538', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (160, N'153', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'HP LASERJET P2055DN', N'Impresora laser', N'CNCGB02720', N'202408761', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (161, N'154', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'EPSON', N'L4260', N'Impresora de inyeccion a color', NULL, N'202421330', N'742223580400', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (162, N'155', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora laser', N'CNF8GD374K', N'202408790', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (163, N'157', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'EPSON', N'L5190', N'Impresora de inyeccion a color', NULL, N'202408786', N'74083650-0054', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (164, N'159', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'EPSON', N'L395', N'Impresora de inyeccion a color', N'X2P6298822', N'202408429', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (165, N'160', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'BROTHER', N'DCP-T820DW', N'Impresora de inyeccion a color', N'U66055J1H376466', NULL, NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (166, N'183', N'Sede Central', N'Direccion Ejecutiva PRED', NULL, N'KYOCERA', N'TASKALFA 7004I', N'Fotocopiadora multifuncional', N'H6H4900810', NULL, NULL, N'IP', N'172.16.23.171', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (167, N'64', N'Sede Central', N'Direccion de Recursos Geneticos y Biotecnologia', N'Subdireccion de Recursos Geneticos', N'KYOCERA', N'TASKALFA 8353CI', N'Fotocopiadora multifuncional', N'RTW0Y00009', N'202410208', N'74222358-0380', N'IP', N'172.16.23.143', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (168, N'165', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'HP', N'HP SCANJET 5590', N'Escaner', N'CN35HWH0V2', N'202409485', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (169, N'166', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', NULL, N'HP', N'HP LASERJET P3015', N'Impresora laser', N'BRBSF2VL1Z', N'202409519', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (170, N'167', N'Sede Central', N'Gerencia General', N'Unidad de Atencion al Ciudadano y Gestion Documental', N'FUJITSU', N'FI-6800', N'Escaner', N'A9ECC01748', N'202415448', N'74080050-0088', N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (171, N'168', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'LASERJET PRO M402DNE', N'Impresora laser', N'BRBSM3X9TV', N'202409749', N'74084100-0240', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (172, N'169', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'HP DESIGNJET T830 MFP', N'Impresora plotter', N'CN9AN8M06B', N'202412580', N'74085000-0003', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (173, N'170', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'COLOR LASERJET PRO MFP M277DW', N'Impresora laser', N'VNBKK5C92L', N'202412661', N'74222358-0246', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (174, N'1', N'Sede Central', N'Presidencia Ejecutiva', NULL, N'KYOCERA', N'TASKASLFA 3553CI', N'Fotocopiadora multifuncional', N'RMZ9300005', N'202415412', N'742222358-0154', N'IP', N'172.16.23.70', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (175, N'115', N'Sede Central', N'Oficina de Administracion', N'Unidad de Abastecimiento', N'XEROX', N'VERSALINK C405', N'Impresora multifuncional laser a color', N'3356628020', N'202406130', N'74223580-0256', N'USB', NULL, N'Tóner Negro', N'Tóner Cyan', NULL, N'Tóner Amarillo', N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (176, N'173', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'HP SCANJET G3110', N'Escaner', N'CN09RA50HM', N'202412702', N'740800500042', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (177, N'174', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'HP SCANJET G3110', N'Escaner', N'CN09RA50J5', N'202412703', N'740800500040', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (178, N'175', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', N'Subdireccion de Investigacion y Liberacion de Tecnologias', N'HP', N'HP LASERJET P1006', N'Impresora laser', N'VNF3B51141', N'202412699', N'740841000157', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (179, N'176', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'HP', N'HP SMART TANK 580', N'Impresora de inyeccion a color', N'1F3Y2-80030', N'202407359', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (180, N'178', N'Sede Central', N'Direccion de Investigacion y Desarrollo Tecnologico', NULL, N'HP', N'1536', N'Impresora laser', N'CNC9C2KBYX', NULL, N'740841000187', N'USB', NULL, NULL, NULL, NULL, NULL, N'En mantenimiento');
    INSERT INTO #impresoras_import VALUES (181, N'14', N'Sede Central', N'Gerencia General', N'Unidad de Comunicaciones e Imagen Institucional', N'XEROX', N'VERSALINK C700', N'Fotocopiadora multifuncional', N'AIUE041108781', N'202412436', NULL, N'IP', N'172.16.23.40', NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (182, N'181', N'Sede Central', N'Oficina de Control Institucional', NULL, N'HP', N'LASERJET PRO 400 MFP M425DN', N'Impresora multifuncional laser', N'CND8F47395', N'202411247', NULL, N'USB', NULL, NULL, NULL, NULL, NULL, N'Activa');
    INSERT INTO #impresoras_import VALUES (184, N'183', N'Sede Central', N'Direccion de Servicios Estrategicos Agrarios', N'Subdireccion de Extension Agropecuario', N'EPSON', N'COLORWORKS C6500AU', N'Impresora etiquetadora color', N'X7F4009437', NULL, N'675010060001', N'IP', N'172.16.23.174', NULL, NULL, NULL, NULL, N'En mantenimiento');

    -- Catalogos que alimentan los combos del sistema
    INSERT INTO dbo.sedes (nombre)
    SELECT DISTINCT i.sede
    FROM #impresoras_import i
    WHERE NOT EXISTS (SELECT 1 FROM dbo.sedes s WHERE s.nombre = i.sede);

    -- Reparacion de nombres antiguos si una carga previa creo dependencias con abreviaturas.
    DECLARE @sedeCentralId BIGINT;
    SELECT @sedeCentralId = id FROM dbo.sedes WHERE nombre = N'Sede Central';

    DECLARE @oldDepId BIGINT;
    DECLARE @newDepId BIGINT;

    SELECT @oldDepId = id FROM dbo.dependencias WHERE sede_id = @sedeCentralId AND nombre = N'Organo de Control Institucional';
    SELECT @newDepId = id FROM dbo.dependencias WHERE sede_id = @sedeCentralId AND nombre = N'Oficina de Control Institucional';
    IF @oldDepId IS NOT NULL AND @newDepId IS NULL
        UPDATE dbo.dependencias SET nombre = N'Oficina de Control Institucional' WHERE id = @oldDepId;
    ELSE IF @oldDepId IS NOT NULL AND @newDepId IS NOT NULL
    BEGIN
        UPDATE dbo.usuarios_red SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.equipos SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.correos SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.impresoras SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.subdependencias SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        DELETE FROM dbo.dependencias WHERE id = @oldDepId;
    END;

    SET @oldDepId = NULL;
    SET @newDepId = NULL;
    SELECT @oldDepId = id FROM dbo.dependencias WHERE sede_id = @sedeCentralId AND nombre = N'PRED';
    SELECT @newDepId = id FROM dbo.dependencias WHERE sede_id = @sedeCentralId AND nombre = N'Direccion Ejecutiva PRED';
    IF @oldDepId IS NOT NULL AND @newDepId IS NULL
        UPDATE dbo.dependencias SET nombre = N'Direccion Ejecutiva PRED' WHERE id = @oldDepId;
    ELSE IF @oldDepId IS NOT NULL AND @newDepId IS NOT NULL
    BEGIN
        UPDATE dbo.usuarios_red SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.equipos SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.correos SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.impresoras SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        UPDATE dbo.subdependencias SET dependencia_id = @newDepId WHERE dependencia_id = @oldDepId;
        DELETE FROM dbo.dependencias WHERE id = @oldDepId;
    END;

    INSERT INTO dbo.tipos_impresora (nombre)
    SELECT DISTINCT i.tipo_impresora
    FROM #impresoras_import i
    WHERE i.tipo_impresora IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.tipos_impresora ti WHERE ti.nombre = i.tipo_impresora);

    INSERT INTO dbo.dependencias (nombre, sede_id)
    SELECT DISTINCT i.dependencia, s.id
    FROM #impresoras_import i
    JOIN dbo.sedes s ON s.nombre = i.sede
    WHERE i.dependencia IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM dbo.dependencias d
          WHERE d.nombre = i.dependencia AND d.sede_id = s.id
      );

    INSERT INTO dbo.subdependencias (nombre, dependencia_id)
    SELECT DISTINCT i.subdependencia, d.id
    FROM #impresoras_import i
    JOIN dbo.sedes s ON s.nombre = i.sede
    JOIN dbo.dependencias d ON d.nombre = i.dependencia AND d.sede_id = s.id
    WHERE i.subdependencia IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM dbo.subdependencias sd
          WHERE sd.nombre = i.subdependencia AND sd.dependencia_id = d.id
      );

    -- Validacion antes de cargar impresoras: si algo no resolvio a catalogo, muestra la fila fuente y corta.
    IF EXISTS (
        SELECT 1
        FROM #impresoras_import i
        LEFT JOIN dbo.sedes s ON s.nombre = i.sede
        LEFT JOIN dbo.dependencias d ON d.nombre = i.dependencia AND d.sede_id = s.id
        LEFT JOIN dbo.subdependencias sd ON sd.nombre = i.subdependencia AND sd.dependencia_id = d.id
        LEFT JOIN dbo.tipos_impresora ti ON ti.nombre = i.tipo_impresora
        WHERE s.id IS NULL
           OR (i.dependencia IS NOT NULL AND d.id IS NULL)
           OR (i.subdependencia IS NOT NULL AND sd.id IS NULL)
           OR (i.tipo_impresora IS NOT NULL AND ti.id IS NULL)
    )
    BEGIN
        SELECT i.source_row, i.source_numero, i.sede, i.dependencia, i.subdependencia, i.tipo_impresora,
               CASE WHEN s.id IS NULL THEN 'NO_SEDE' END AS error_sede,
               CASE WHEN i.dependencia IS NOT NULL AND d.id IS NULL THEN 'NO_DEPENDENCIA' END AS error_dependencia,
               CASE WHEN i.subdependencia IS NOT NULL AND sd.id IS NULL THEN 'NO_SUBDEPENDENCIA' END AS error_subdependencia,
               CASE WHEN i.tipo_impresora IS NOT NULL AND ti.id IS NULL THEN 'NO_TIPO_IMPRESORA' END AS error_tipo_impresora
        FROM #impresoras_import i
        LEFT JOIN dbo.sedes s ON s.nombre = i.sede
        LEFT JOIN dbo.dependencias d ON d.nombre = i.dependencia AND d.sede_id = s.id
        LEFT JOIN dbo.subdependencias sd ON sd.nombre = i.subdependencia AND sd.dependencia_id = d.id
        LEFT JOIN dbo.tipos_impresora ti ON ti.nombre = i.tipo_impresora
        WHERE s.id IS NULL
           OR (i.dependencia IS NOT NULL AND d.id IS NULL)
           OR (i.subdependencia IS NOT NULL AND sd.id IS NULL)
           OR (i.tipo_impresora IS NOT NULL AND ti.id IS NULL);
        THROW 51000, 'Carga detenida: hay catalogos no resueltos para los combos.', 1;
    END;

    INSERT INTO dbo.impresoras (marca, modelo, tipo_impresora_id, serie, codigo_inventario, codigo_patrimonial, tipo_conexion, ip, sede_id, dependencia_id, subdependencia_id, estado, modelo_toner_negro, modelo_toner_c, modelo_toner_m, modelo_toner_y)
    SELECT i.marca, i.modelo, ti.id, i.serie, i.codigo_inventario, i.codigo_patrimonial, i.tipo_conexion, i.ip, s.id, d.id, sd.id, i.estado, i.modelo_toner_negro, i.modelo_toner_c, i.modelo_toner_m, i.modelo_toner_y
    FROM #impresoras_import i
    JOIN dbo.sedes s ON s.nombre = i.sede
    LEFT JOIN dbo.dependencias d ON d.nombre = i.dependencia AND d.sede_id = s.id
    LEFT JOIN dbo.subdependencias sd ON sd.nombre = i.subdependencia AND sd.dependencia_id = d.id
    LEFT JOIN dbo.tipos_impresora ti ON ti.nombre = i.tipo_impresora
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.impresoras x
        WHERE x.marca = i.marca
          AND x.modelo = i.modelo
          AND (
                (i.serie IS NOT NULL AND x.serie = i.serie)
             OR (i.codigo_inventario IS NOT NULL AND x.codigo_inventario = i.codigo_inventario)
             OR (i.codigo_patrimonial IS NOT NULL AND x.codigo_patrimonial = i.codigo_patrimonial)
          )
    );

    DECLARE @insertadas INT = @@ROWCOUNT;

    COMMIT TRANSACTION;

    SELECT @insertadas AS impresoras_insertadas;
    SELECT estado, COUNT(*) AS total FROM dbo.impresoras GROUP BY estado ORDER BY estado;
    SELECT ti.nombre AS tipo, COUNT(*) AS total FROM dbo.impresoras i LEFT JOIN dbo.tipos_impresora ti ON ti.id = i.tipo_impresora_id GROUP BY ti.nombre ORDER BY total DESC;
    SELECT s.nombre AS sede, d.nombre AS dependencia, COUNT(*) AS repetidos
    FROM dbo.dependencias d
    JOIN dbo.sedes s ON s.id = d.sede_id
    GROUP BY s.nombre, d.nombre
    HAVING COUNT(*) > 1
    ORDER BY s.nombre, d.nombre;
    SELECT d.nombre AS dependencia, sd.nombre AS subdependencia, COUNT(*) AS repetidos
    FROM dbo.subdependencias sd
    JOIN dbo.dependencias d ON d.id = sd.dependencia_id
    GROUP BY d.nombre, sd.nombre
    HAVING COUNT(*) > 1
    ORDER BY d.nombre, sd.nombre;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SELECT ERROR_NUMBER() AS error_number, ERROR_LINE() AS error_line, ERROR_MESSAGE() AS error_message;
    THROW;
END CATCH;
