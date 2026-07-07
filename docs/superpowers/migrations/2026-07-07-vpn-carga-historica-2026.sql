-- Carga historica: cuentas VPN ya existentes (archivo 'VPN 2026.xlsx')
-- Ejecutar en: ssti (SQL Server)
-- Genera 405 registros con estado_solicitud='APROBADO', estado='Activo',
-- titular_tipo='INTERNO_MANUAL'. correo/dependencia pueden venir NULL si el Excel no los tenia.
-- NO es idempotente: correr una sola vez. Verificar antes de re-ejecutar.

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cyalta', N'KhT6YojaIa4LYn2wE', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Claudia', N'Yalta Maceda', N'cyalta@inia.gob.pe',
    1, 30, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dquispe', N'f2Y2Tgl5hinXTLExe', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Diego Rafael', N'Quispe Torres', N'dquispe@inia.gob.pe',
    1, 31, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jalcantara', N'7zfxMUDuPRhneEJYU', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Enrique', N'Alcántara Delgado', N'jalcantara@inia.gob.pe',
    1, 28, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rlobato', N'm18YcUVB9ymzmdWSw', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Roiser Honorio', N'Lobato Gálvez', N'rlobato@inia.gob.pe',
    1, 29, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jquispe', N'rZz29S8vRxYkYoMtg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan José', N'Quispe Coronado', N'jjquispe@inia.gob.pe',
    1, 35, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sguarniz', N'KAcEppdytI6oq2utp', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sonia Paola', N'Guarniz Nicho', N'sguarniz@inia.gob.pe',
    1, 33, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'avasquez', N'CProI8IFeFNs3Wh7C', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Analí Ysabel', N'Vásquez Motta', N'avasquez@inia.gob.pe',
    1, 32, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dmejia', N'hrNA2hMnpon7q89wi', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Delia Inés Rosario', N'Mejía Sandoval', N'dmejia@inia.gob.pe',
    1, 34, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eeamazonas01', N'n8B26QEbbsgRuRuLn', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rober', N'Torres Salazar', N'rtorress@inia.gob.pe',
    3, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jalejo', N'SJWg9M2cXfUBaKZL5', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan', N'Alejo Rivera', N'jalejo@inia.gob.pe',
    4, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lmarquez', N'Y9ZSB94rGeDEArxuR', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luis Ángel', N'Márquez Chávez', N'lmarquez@inia.gob.pe',
    5, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gmunoz', N'w7xLBvUpitaUeV6L7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gilmer Antonio', N'Muñoz Espinoza', N'Muñoz Espinoza',
    6, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pcolos', N'6QhFb6QdujZFFqCGa', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Percy', N'Colos Ayala', N'pcolos@inia.gob.pe',
    7, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'acortavarria', N'TnwekuHKq3bb8Ljfr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Adolfo Renato', N'Cortavarría Roncagliolo', N'acortavarria@inia.gob.pe',
    8, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jteran', N'A8UPDBdvwtm63DnhL', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Alfonso', N'Terán Rojas', N'jteran@inia.gob.pe',
    9, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ycardenas', N'SuzXz4L7dmUqyZhLV', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Yoel Melzor', N'Cárdenas Cosme', N'ycardenas@inia.gob.pe',
    10, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cquilcate', N'kxbyqMe47SaaE6D9q', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carlos Enrique', N'Quilcate Pairazamán', N'cquilcate@inia.gob.pe',
    11, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'nruesta', N'ByAeUDzE4THWzWNjK', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Nelson Asdrúbal', N'Ruesta Campoverde', N'nruesta@inia.gob.pe',
    12, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'msantillan', N'jvTatoKZcT9GVt8Z8', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Manuel Dante', N'Santillán Gonzáles', N'msantillan@inia.gob.pe',
    13, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'smedrano', N'bvaF58snDZY4aHPUu', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Soledad', N'Medrano Damián', N'smedrano@inia.gob.pe',
    14, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'bmartinez', N'RAD2VUp6Mtyy3FCye', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Boris Martínez', N'Martínez Zapata', N'bmartinezz@inia.gob.pe',
    15, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'evilca', N'Sv7hEZ34vacjWbA6E', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edmundo Benjamín', N'Vilca Quispe', N'evilca@inia.gob.pe',
    16, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'hdiaz', N'JvTwUj659DFHrefks', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Henry', N'Díaz Chuquizuta', N'hdiaz@inia.gob.pe',
    22, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jperez', N'hnBVJhLfeV75reN77', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Enrique', N'Pérez Arirama', N'jperez@inia.gob.pe',
    23, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'icortez', N'B7jH59rLa2G47rvWr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ivana', N'Cortez Juro', N'icortez@inia.gob.pe',
    24, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsanchez', N'4o26z3UGCeVpvpEwP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'David', N'Sánchez Amaya', N'dsanchez@inia.gob.pe',
    26, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sperez', N'nA8gjFTVQq2Tvo5YX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Saúl Percy', N'Pérez Saldaña', N'sperez@inia.gob.pe',
    27, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cpoemape', N'xm42X3xq8zejxnEao', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carlos Alberto', N'Poemape Tuesta', N'cpoemape@inia.gob.pe',
    1, NULL, 3, N'Director',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'omateo', N'9db88MPmSfPHSq6Mx', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Olga', N'Mateo', N'omateo@inia.gob.pe',
    1, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'svargas', N'SgrKo56cxLj8rVs6e', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sandra Marilia', N'Vargas Cisneros', N'svargas@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'vruiz', N'tgEWaR1JPMGcHFyuf', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Vicente', N'Ruiz Escobar', N'vruiz@inia.gob.pe',
    1, 29, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cmarquina', N'tbPGMpVDZWikVz2B1', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carla', N'Marquina', N'cmarquina@inia.gob.pe',
    1, 31, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'kpacocha', N'rKEGm546KY6BKa2mr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Karina', N'Pacocha Toribio', N'kpacocha@inia.gob.pe',
    4, 4, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'iniaeepa2025 (odavila)', N'tH56UUVHFwpdtK9mg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Óscar Adolfo', N'Dávila Ramírez', N'odavila@inia.gob.pe',
    20, 20, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'hcardenas', N'huN1eaKK9uvBuvh4u', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Helí Hernando', N'Cárdenas Yaya', N'hcardenas@inia.gob.pe',
    1, 32, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'MCAVERO', N'twMaK0T172JZdXHKG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mayra Antonieta', N'Cavero Sota', N'mcavero@inia.gob.pe',
    1, 33, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mscarpatti', N'BSi99NS2f7inrLNTd', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marco Antonio', N'Scarpatti Casavilca', NULL,
    1, 35, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'omestanza', N'Sxb67TlcTt5ETJtbm', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Orson Antero', N'Mestanza Millones', N'omestanza@inia.gob.pe',
    1, 30, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdb07', N'478sH3uMGemb4P5ew', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José', N'Ayala Felix', N'jayala@inia.gob.pe',
    1, 30, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jflores', N'92ck8KDB781HrdbNv', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Janet Ruth', N'Flores Carhuapuma', N'jflores@inia.gob.pe',
    1, 30, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jelias', N'PcL2NtGKwmz9DibLm', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan Elías', N'Uscategui', N'jelias@inia.gob.pe',
    1, 31, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'nmedina', N'figlwSX2PbIHib5uy', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Norali', N'Medina Campos', N'nmedina@inia.gob.pe',
    1, 31, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eolivarez', N'eTV8zeB9vdw4tgIhm', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Evelyn Lissette', N'Olivarez Rivera', N'eolivarez@inia.gob.pe',
    1, 31, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsea63', N'2X9VXj2EwLs4Fq4mJ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Taina', N'Valdivia', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdiee09', N'ghniWKPbAPXLzBT4m', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Angélica', N'Laurente Ramos', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdilte18', N'uAd51Ign3bQGmkFD7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carol', N'Santiago', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'esalazar', N'lBI78WernZ8yMqJnP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Evelin Judith', N'Salazar Hinostroza', N'esalazar@inia.gob.pe',
    1, 29, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rcosme', N'Kp492Gr92vydXtxVe', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Roberto Carlos', N'Cosme de la Cruz', N'rcosme@inia.gob.pe',
    1, 29, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lnino', N'2Hw42CdwbF3HBvfDR', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luz Angélica', N'Niño Vegas', N'lnino@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'yaquino', N'6ZgMCXsGBYA9yB2JC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Yeny Natali', N'Aquino Villasante', N'yaquino@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eveli', N'ESs9zZgV3Gd2g6ZpS', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Eudosio Amancio', N'Veli Rivera', N'eveli@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'msiguenas', N'wfKrxP7FVkeVK1s9q', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Segundo Manuel', N'Sigueñas Saavedra', N'ssiguenas@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'aquispe', N'4uTUEy4mgi3YquAvF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ana María', N'Quispe Gonzales', N'aquispe@inia.gob.pe',
    1, 28, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'iechevarria', N'cgFUv4CgdYiBeBCvP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Isabel Cristina', N'Echevarria Anyosa', N'iechevarria@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdpa47', N'A1E2hBfZAEp9QGLXf', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Thalia', N'García', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'vramirez', N'nQlAKg7GMYxTA59sd', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Virgilio', N'Ramírez Romaní', N'vramirez@inia.gob.pe',
    1, 29, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jcochas', N'jUbk3tghH3kkmIeIK', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juanita Melissa', N'Cochas Escandon', N'jcochas@inia.gob.pe',
    1, 29, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jtorresch', N'i4s5bZrwBi4m9EpX6', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan Luis', N'Torres Chuquillanqui', N'jtorresch@inia.gob.pe',
    1, 29, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'agarcia', N'r8r6oH5QcRjZJdjDR', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Amalia del Pilar', N'García Gongora', N'agarcia@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdioses', N'BrRCCGYufRV8F7MPI', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Susan', N'Dioses Córdova', N'sdioses@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sgutierrezc', N'JgsBY5Ejc6mJN8Imv', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Savina', N'Gutiérrez Calle', N'sgutierrez@inia.gob.pe',
    1, 30, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'agarcias', N'qbFMjUKal8l3ggclG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Auraliz', N'García', N'agarcias@inia.gob.pe',
    1, 30, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jzevallosc', N'bu9g6t1BHOHkTtWN4', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jonatan David', N'Zevallos Castañeda', N'jzevallos@inia.gob.pe',
    1, 31, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua03', N'TYLivUQb0gKi13jpC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lucy Amparito', N'Magallanes Condori', N'abastecimiento12@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua04', N'DBP4qWZWSjrs3iAX6', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Héctor Enrique', N'Curo Maquen', N'abastecimiento13@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cperez', N'YzZ0PL3xR87eoM1ys', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carmen Inés', N'Pérez Risco', N'abastecimiento1@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua44', N'8WnFW2HlyF5thSA3T', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Claudio Gerson', N'Huamani Quintana', N'abastecimiento5@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua33', N'PDQAFi1ghkra6mCg2', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José', N'Aguilar Trujillo', N'abastecimiento9@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua20', N'D3uvsK25EL23ysnkF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Briceño', N'Buelot Isabel', N'abastecimiento10@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua11', N'4VRDmGi3JpqBExh1p', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Fiorella Stefani', N'Miranda Ureta', N'abastecimiento3@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua12', N'P2YSE5PSqtaDakspY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan José', N'Vicencio Alania', N'abastecimiento6@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua26', N'Xs76mETuahmM19sXH', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'María Macarena', N'Navarrete Ormeño', N'abastecimiento14@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua18', N'85qfDjv2VQLiiFPYE', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Brandon', N'Valdivia Ugarte', N'abastecimiento17@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua25', N'IpIR6UAARi8ILWTBC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Miriam Violeta', N'Arias Oscanova', N'abastecimiento15@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua24', N'Se4sWc4hQ1wbnmFHF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gerson Santiago', N'Quiroz Cachique', N'abastecimiento18@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua45', N'XyL2sXAYnD22MzGqZ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Isaura Felina', N'Rodriguez Torres', N'abastecimiento11@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'hmaldonado', N'7y5YJwmycxJJK0LXE', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Héctor', N'Maldonado Ore', N'hmaldonado@inia.gob.pe',
    1, 32, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jgonzales', N'NCcKHcPJEh8hQLN4w', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Luis', N'Gonzales Carrera', N'catalogo_siga@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mmedina', N'TxP8MDU16dLQlHWq7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Miguel Ángel', N'Medina Vicuña', NULL,
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'evargas', N'BY462zAVEY3gs2hFg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edgar José', N'Vargas Sicha', NULL,
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua56', N'ygFapQTnGLhMC8Rv5', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Martha Geovana', N'Villa Delgado', N'abastecimiento2@inia.gob.pe',
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'idelcarpio', N'rvIZh6PxC9lwWAJHG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ivette', N'Del Carpio o''Brien', N'idelcarpio@inia.gob.pe',
    1, 32, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'up09', N'4j9hVakwMt2r4KXkE', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luz Mabel', N'Núñez Eslava', NULL,
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua25', N'IpIR6UAARi8ILWTBC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Miriam Violeta', N'Arias Oscanova', NULL,
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua24', N'Se4sWc4hQ1wbnmFHF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gerson Santiago', N'Quiroz Cachique', NULL,
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ua31', N'8yemdKLmtuHpi49Qc', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Medaly', N'Calderon', NULL,
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'elozano', N'dn9eKYCVKhermP5rA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Emerson', N'Lozano', N'elozano@inia.gob.pe',
    1, 32, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mgonzalezp', N'4ZgmUSTpjIdm5SIMe', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marisela', N'Gonzalez Pezo', N'mgonzalezp@inia.gob.pe',
    1, 32, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mcosavalente', N'UjXmdXQpuEvH3FM87', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Martha', N'Cosavalente Vidarte', N'mcosavalente@inia.gob.pe',
    1, 32, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uii04', N'wybLJEcsgQUKdlu76', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Alonso', N'Peña Carrillo', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uacid02', N'dqwkU3pdKAr68KDdW', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Max Gerson', N'Puchoc Rios', N'archivoutd@inia.gob.pe',
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uacid03', N'anSS4tfRqNkaHyb89', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Heydi', N'Chinguel Neyra', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'marce', N'8uxgxLzy5IpIWxtKH', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Melissa', N'Arce', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uacid04', N'ziXXx6HEeqkr9nTYC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jenny Julissa', N'García Nizama', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mhuamanm', N'F38hciEfGj4FstdC9', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mireya Fabiola', N'Huaman Matos', N'mhuamanm@inia.gob.pe',
    1, 1, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lsantiago', N'wLPl4JU8EYjVyzvt3', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ludy', N'Santiago Hilario', N'lsantiago@inia.gob.pe',
    1, 1, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uii06', N'HYPNun9bHy9kWk8dK', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Manuel Smit', N'Basilio Ibarra', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'icastillo', N'hfqfQkg8h7c4f54Bw', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Inés', N'Castillo Caycho', N'icastillo@inia.gob.pe',
    1, 32, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uc04', N'zWHPjp53aXdWrdxKD', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Alexander', N'Mancilla Rodríguez', N'amancilla@inia.gob.pe',
    1, 32, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uc05', N'ga8N2Di3GFaW3NzjD', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Junior', N'Hinostroza Picon', NULL,
    1, 32, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jisasi', N'IEM2Ru2ZK5j3dqGkR', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Julio', N'Isasi Villafuerte', N'jisasi@inia.gob.pe',
    1, 32, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uctf02', N'25dfJPn1q69ptJTpR', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Judith', N'Tenorio Villavicencio', NULL,
    1, 35, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'upi07', N'nwh8YFrYE9pNuuT2W', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Liliana', N'García Pisco', NULL,
    1, 35, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'upm13', N'QcinDvMMY225fufXf', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Miguel', N'Macavilca Villar', NULL,
    1, 35, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'Lluna', N'iTBogSaCsUpQ3vZbV', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luis Ángel', N'Luna Cano', N'lluna@inia.gob.pe',
    1, 35, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rcarrion', N'Tx6Pc6Xto9ZA3Ztnt', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ricardo Ignacio', N'Carrión Concha', N'rcarrion@inia.gob.pe',
    1, 35, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'upre01', N'gRT7MwBCX7Mhbb15A', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Magali Sibeth', N'Vásquez Paredes', N'mvasquezp@inia.gob.pe',
    1, 35, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'upre06', N'msm3LVQD3acKGE9Ib', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Reynaldo', N'Tica Osco', NULL,
    1, 35, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'upre02', N'fm8X5Dl9Y8DVw3KwA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Pedro Luis', N'Cajahuaman Abregu', NULL,
    1, 35, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'upre04', N'AV9PrR6JVUmZ7edwF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Fernando', N'Caqui Díaz', N'fcaqui@inia.gob.pe',
    1, 35, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'fdulanto', N'JUJ29B2gqeNkW5BB5', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Franco Ricardo', N'Dulanto Mora', N'fdulanto@inia.gob.pe',
    1, 35, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'Informatica24', N'n5BjTEcqrtlQlRw8M', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Percy', N'Pazo Carnero', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica26', N'XEt9MCvBkswWc3CZg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Christopher', N'Cabana', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica11', N'FGEUP22xWek3uN5yX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Alex Yengle', N'Cosamalon', N'desarrollo_ui02@inia.gob.pe',
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica28', N'pRQ92fYgCPijeg6nj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Óscar', N'Pazos', N'desarrollo_uti01@inia.gob.pe',
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica18', N'9CDzCYr5PJaAhyz6E', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jeremy Miguel', N'Valdavia Correa', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica27', N'vi5EecspJJtNVYwLt', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carlos Kevin', N'Chacon Panta', N'soporte_uti04@inia.gob.pe',
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ovillanuevaf', N'Pg1R6TmcIKojs28t2', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Oldy', N'Villanueva Fabian', N'ovillanueva@inia.gob.pe',
    1, 1, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica30', N'ZdRpy9Arkf2MUh8vG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carlos Enrique', N'Macarlupu Flores', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica31', N'uRW28QodDsVry4v1i', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Joguer', N'Tacas Misaico', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gvivanco', N'8ucBe3UQ5GtktVpkb', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Giovani', N'Vivanco Zaravia', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica22', N'PicatZavAmxDqM33L', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Manuel Gerardo', N'Gonzales Macha', NULL,
    1, 1, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cacosta', N'vg54rCvtNJVWj1BWx', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carmen Rosa', N'Acosta Mamani', N'cacosta@inia.gob.pe',
    1, 32, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'amonge', N'2LM6vZ66zIm5K2hrX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Anghy Sofía', N'Monge Alvarez', N'amonge@inia.gob.pe',
    1, 32, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jreyna', N'LFEGVA5lrvElmtmCM', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Luis', N'Reyna Soto', N'jreyna@inia.gob.pe',
    1, 32, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'iescudero', N'AnURpu2jK3SkiSiQj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Iris Prissila', N'Escudero Pineda', N'iescudero@inia.gob.pe',
    1, 32, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lvaldiviezo', N'QsnrqEWN7UjxY69TS', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Liz', N'Valdiviezo Caceda', N'lvaldiviezo@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cturin', N'fBY23KTXfx7t8WrDP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Cecilia Claudia', N'Turin Canchaya', N'cturin@inia.gob.pe',
    1, 28, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ddta14', N'u8WWHgJti0tqhrfwE', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Josselyn', N'Chilin Sulca', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sosorio', N'CYojfLEVyJpffeMrg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sandra', N'Osorio Orellana', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdpa64', N'HxexjbQ17MZeQL74Z', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gerson Walter', N'Quispe Machaca', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ddta15', N'zs1Ax88Thin1RK49f', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mishel Belén', N'Soto Sánchez', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ddta13', N'ucFM5nlV5Su92C7PQ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Erika', N'Chávez Almidon', N'didet_especialista02@inia.gob.pe',
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'nurcia', N'cn7DQuAapi8nesGwJ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Nancy', N'Urcia Barahona', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pdiaz', N'96vhgg1H4euVfIufa', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Augusto Pablo', N'Díaz Alva', N'pdiaz@inia.gob.pe',
    1, 29, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'calejos', N'aM5UF3kCR12vdrnkA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carol', N'Alejos', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsaravian', N'dDUMTxv6F2W9rwXHq', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'David', N'Saravia Navarro', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'didet42', N'x2q63rBowCwRLwbpe', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Manuel', N'Bermejo del Aguila', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'didet43', N'eVzvXlFLV2C7QWjzg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carol Paola', N'Díaz Nieves', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'didet38', N'kalvWnT1yF6AzXY9K', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Angheline Tabatha', N'Ricce Furch', NULL,
    1, 29, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ksanchez', N'ykhDmzSXC31i488E6', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Katherine Lourdes', N'Sánchez Caycho', N'ksanchez@inia.gob.pe',
    1, 30, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdrg09', N'qCJ31Mn2SP30MYtWs', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Leydy Benigna', N'Tafur Catalan', NULL,
    1, 30, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'aalvarez', N'xiwPJ4AVEn675kRGI', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Adolfo', N'Alvarez Orcoapaza', N'aalvarez@inia.gob.pe',
    1, 30, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsea60', N'6MLABpmtPnU3pZyMx', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Erick', N'Rodriguez Felipa', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme19', N'qwC7pLn3eqjS6A6fs', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'María Magdalena', N'Ordóñez Estrada', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme22', N'IjZxZ5dRZ1YOP2nXS', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Cristina Eylin', N'Aybar Mendoza', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme20', N'NIluITxo1rVI7Wxua', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'María Teresa', N'Julón Pérez', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme51', N'7r3ud93X1d6qryLqA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Stefany Shirley', N'Vicharra Bravo', N'coordinacionadm_dsea@inia.gob.pe',
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme17', N'lwvGYw903a0kkuL9L', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Dula Noelia', N'Tovar Orihuela', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme31', N'ZAr9BkIbow7MAe7pA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Froylain', N'Vivar Díaz', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme33', N'1Hzy7ldu60vTJbrLS', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sthephanny Cristina', N'Otárola Norabuena', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme54', N'Xxux61brlrAAOQZAj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edwin', N'Jara Vergaray', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rorconi', N'Xzfs5sLsRo8Pkks25', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rocío Mabel', N'Orconi Quispe', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsea55', N'1dxt7ZncQ8NkPaPZe', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sandra Jennifer', N'Mayhualla Huaman', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme21', N'N4ZuUrmqEW3FBrogM', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Daniel', N'Huamalies Arroyo', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme26', N'z19LaZ9ACZe22J3aL', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jimy Kidt', N'Castro de la Cruz', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsme18', N'PFrI9RQqw5kPz0uMa', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rosalía', N'Quichua Baldeón', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsea57', N'SkDdUwdkpeTsRxz5h', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Yauri Ramírez', N'Magaly Rossi', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gelizalde', N'TyKpi9g9JNgMLNiKn', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Zoila Graciela', N'Elizalde Chávez', N'gelizalde@inia.gob.pe',
    1, 31, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eeaelchira01', N'bCa6bi9iI5DhX8JRU', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mabel Jaselyn', N'Novoa Ordóñez', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsea61', N'Dqj7eGPAwdgDjyfZM', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edder', N'Chacon', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsea62', N'8FFkGZNWbs7fdaNqt', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Alexsandra Leonela', N'Valentín Chávez', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jramireza', N'LWnTzNqKft5ej38BH', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Adrian', N'Ramírez Aparicio', N'jramireza@inia.gob.pe',
    1, 31, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dsea64', N'7vjk7aSsZZcd3a4fC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Tomás Daniel', N'Samaniego Vivanco', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jcarrasco', N'nHNwTHmWWrRXo5X3b', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jackelyn Andree', N'Carrasco Chalco', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'kaquino', N'JsXDrWCsmWgY2Jovc', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Katherine', N'Aquino Chávez', NULL,
    1, 31, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred1', N'2lbkcFHTvxbRFH3IG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luis Miguel', N'Collantes Reyes', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred2', N'p5wJj5CtrXzEwl94j', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan José', N'Vicencio Alania', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred3', N'MiPWjyP3rf3Bby38L', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Susana Yrida', N'Rojas Alva', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred4', N'gyLyqjY7h3YslNo8A', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rudy Jimmy', N'Berrocal Huallanca', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred5', N'qFIZ7fHnCML6NgqSA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Esther Huamán', N'Cueva', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred6', N'4wn9PJ7LrMx6CfnvZ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Amalia Margarita', N'Abanto Verástegui de León', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred7', N'tJdjW9PpzGr11uyB7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carmelita Vila', N'Benites', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred8', N'vq9NWD416Laa3CkWU', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Julio Nishikawa', N'Menacho', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred9', N'eXph2uefG4inYDJNi', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Miuxa Lyan', N'Bruno Santiago', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred10', N'dyJIrL2bDUinHXH5Q', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ysmael Rafael', N'Mayuri Quispe', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pred11', N's4Wdur0XBAeSelAVQ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carmen Rosa', N'Grillo Oshiro', NULL,
    1, 38, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eeadonoso01', N'WYHpeIgBQ5zzhIYHg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Katherine Sophia', N'Pimentel Condor', NULL,
    11, 11, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pvraem', N'xrY9aC5QS4Qz1swp5', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mariluz', N'Mendez Marca', NULL,
    18, 18, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'acobos', N'scoyd5nmJU4smcP3U', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Alessandra Daniela', N'Cobos Lombardi', N'acobos@inia.gob.pe',
    1, 33, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'oci08', N'7j1vtKHRqWvmjfiJF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Zaida Maribel', N'Zapata Ocaris', NULL,
    1, 39, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'oci10', N'KMtrHUTjULjq2RJ6l', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Evelyn Carola', N'Castro Gamarra', NULL,
    1, 39, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jsimeon', N'Zn5tMleMzQsGa9Wby', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Miguel', N'Simeón Esteban', NULL,
    1, 39, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'trodriguez', N'CpeQR3MekvZLKJbkB', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Trinidad', N'Rodríguez Rojas', N'trodriguez@inia.gob.pe',
    1, 34, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'URH09', N'aSg1JJZAXBpsa82Yr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Fátima Carnero', N'Rodríguez Rojas', NULL,
    1, 34, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'URH03', N'vXvkbdJDREGx4gMVh', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luis Darío', N'Loayza Mayorga', N'asistencia_rrhh@inia.gob.pe',
    1, 34, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'naquino', N'zm2jm4Gwk76SAkmJH', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Nancy', N'Aquino Céspedes', N'naquino@inia.gob.pe',
    1, 34, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'urh04', N'BXhi1WetFZwRBdG63', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edison', N'Sañudo Paculia', NULL,
    1, 34, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'urh14', N'QV9RznaUWg7vqNzEc', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sandra', N'Pardo', NULL,
    1, 34, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rborja', N'sW8I88ufjag6EHssz', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Reyda', N'Borja Huayta', N'rborja@inia.gob.pe',
    1, 34, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'srosario', N'extFERsi2cpq9ufFV', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sharon Rosario', N'Espinoza', N'sjurado@inia.gob.pe',
    1, 34, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'earango', N'kgiNYUyxXrE3cJ5Q9', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Elsa', N'Arango Vilcapuma', N'earango@inia.gob.pe',
    1, 34, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'emelo', N'6kVmKrkM4Mbj6ezV7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edith Gladys', N'Melo Pomacaja', N'emelo@inia.gob.pe',
    1, 34, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ptorresg', N'R6shB0H1vNJqJagYQ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Patricia', N'Torres Gutiérrez', N'ptorresg@inia.gob.pe',
    1, 34, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jjimenezc', N'ujWFs1yhLRRN26sXT', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Roman', N'Jimenez Carrillo', NULL,
    1, 34, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ogrh02', N'2i8nigkGN9ZZGxDn9', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Franco Enrique', N'Paucar Rios', NULL,
    1, 34, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ccayo', N'XS7KGxSmJ3rqQpb3Y', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Johnny César', N'Cayo Saravia', N'jcayo@inia.gob.pe',
    1, 35, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eamazonas', N'JvTlnhdH1GCxjf4E7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jesús', N'Mendoza Chávez', N'jmendozach@inia.gob.pe',
    3, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rmalqui', N'WNaTzZH9vZ7pMgTda', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Roiber Francisco', N'Malqui Ramos', N'rmalqui@inia.gob.pe',
    3, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'horoz', N'yevEN4Jm31Dkv9NHI', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Hugo', N'Oroz Gonzales', N'horoz@inia.gob.pe',
    4, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'amalaga', N'ErD7p3pz9Uw79puyA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Amparo', N'Malaga Carrasco', N'amalaga@inia.gob.pe',
    4, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'earequipa', N'HxexjbQ17MZeQL74Z', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Heradio Adolfo', N'Cruz Ponce', N'hcruz@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'usuario de red creado: evega', N'C8lpKTKlD6JaZu4DW', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edwin', N'Vega Mayta', N'evega@inia.gob.pe',
    5, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sapaza', N'VHsxQEHqY6ZM3cHUI', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Shirley Jenniffer', N'Apaza Canaza', N'sapaza@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'earequipa02', N'4G3r5t81kk3rPWeNM', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lucy del Rocío', N'Cuadros Revilla', N'lcuadros@inia.gob.pe',
    5, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eamezquita', N'6C84Ez6qcWxPZUdfg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Elsa Clementina', N'Amezquita Rodriguez', N'eamezquita@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ccutipa', N'S6AXc3MN2Vwheg3AX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Claudio', N'Cutipa Ccalla', N'ccutipa@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'hdadther', N'ULEva7zjZpcFJbX4i', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Hans Adams', N'Dadther Huaman', N'hdadther@inia.gob.pe',
    5, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jsalas', N'eak8vR6AQtjeXUMdj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jhouly Milagros', N'Salas Alfaro', N'jsalas@inia.gob.pe',
    5, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ivaldez', N'pe6pMTJYvR2Ncez9i', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ike Alan', N'Valdez Alfaro', N'ivaldez@inia.gob.pe',
    5, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sayqui', N'YAeEfU8ANy2FShrK2', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Silvia Elisa', N'Ayqui Vilca', N'sayqui@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ncalla', N'wrXH9upcxcDkyPmbr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Nancy Vanessa', N'Calla Cornejo', N'ncalla@inia.gob.pe',
    5, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gpacheco', N'pffoEnkCdaQikV54F', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gonzalo Antonio', N'Pacheco Lizarraga', N'gpacheco@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eulloa', N'b75SReuT4mR2UUxUZ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Evangelina Benedicta', N'Ulloa Chirinos', N'eulloa@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'svega', N'f73Z2tUeGPQF8XjoF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sergio Sebastián', N'Vega Herrera', N'svega@inia.gob.pe',
    5, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'bpacori', N'kwPN3vXkuBkhJVi4k', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Bacilio', N'Pacori Zevallos', N'bpacori@inia.gob.pe',
    5, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'wrodrigueze', N'7QtdhDJRR15J9dPmX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Wilmer David', N'Rodriguez Escobedo', N'wrodriguez@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'narias', N'iXtroqvy992hhDcQY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Nancy Esther', N'Arias Campos', N'narias@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ppenafiel', N'Aev56nn51tuQo37qX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Pamela', N'Peñafiel Zeballos', N'ppenafiel@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lbringas', N'DbTirm8ZTBrf8TLcd', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lucila', N'Bringas Valera', N'lbringas@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'aromero', N'fgcqs4SGg9mWsPR2p', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ana María', N'Romero de Bazàn', N'amromero@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'bvilchez', N'ZnRFmDUDDt6WzM4wx', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Billi Grahan Natanael', N'Vílchez Gutiérrez', N'bvilchez@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'fmarcelo', N'8kM4kriygDjWUBzec', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Fátima Elizabeth', N'Marcelo Bazan', N'fmarcelo@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'erojas', N'r9mp7GrZ54GBxYqw9', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Elton Jhon', N'Rojas Ocupa', N'erojaso@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jestela', N'xLZ7zi5RmCfijMkYr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Judith Raquel', N'Estela Manrique', N'jestela@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'hdelacruzf', N'xRKaJ9G4QUR2fSt2W', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Humberto Abel', N'De la Cruz Florian', N'hdelacruz@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'bsaldana', N'BqYpLr8SdoYD6T8bu', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Bety Carolina', N'Saldaña Pajares', N'bsaldana@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'svigo', N'tZGCG9qnN2EW8nj9g', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Silvia Violeta', N'Vigo Salazar', N'svigo@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mguillen', N'C6obDgeTyp98MffrX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Margot María', N'Guillen Jara', N'mguillen@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ttejada', N'5T6iRKz9nomaxQsMi', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Toribio Nolberto', N'Tejada Campos', N'ntejada@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'aheras', N'reQei5dMlYZKcNrrJ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Alberto Benjamín', N'Heras Ayay', N'aheras@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jvasquez', N'vm44iQQUZNy39rF8w', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Luis', N'Vásquez Orrillo', NULL,
    6, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'wcarrasco', N'toHBTdVrN6CZxqYof', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'William Leoncio', N'Carrasco Chilon', N'wcarrasco@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'walvarez', N'gZC7ApyLN2rSyXJU8', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Wuesley Yusmein', N'Alvarez García', N'walvarez@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gsanchez', N'RMVt82SnkYt63CQ9u', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gilberto', N'Sánchez Rudas', N'gsanchez@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'asilva', N'cBhTngve6EpusDM84', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Aland Horacio', N'Silva Chávez', N'asilva@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mcabrera', N'Zv9MHhmowkmBVrre8', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marco Antonio', N'Cabrera Gonzalez', N'mcabrera@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dchuquimia', N'EVC8F5DzuzUcT7KcL', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Dixie Szochova', N'Chuquimia Valdez', N'dchuquimia@inia.gob.pe',
    6, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'asanta', N'ey4MuAbt5rrUE7Bdq', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ángel Esteban', N'Santa Cruz Padilla', N'dcenteno@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mcervantes', N'9aBh5UY3UEgofD2ZM', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marieta Eliana', N'Cervantes Peralta', N'mcervantes@inia.gob.pe',
    6, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'vpalominoy', N'Xde01YNUzP8IKvB1c', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Víctor', N'Palomino Yauri', N'vpalomino@inia.gob.pe',
    7, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pchillcce', N'7kLPKWquSDiyQvcZj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Paulina Elizabeth', N'Chillcce Jayo', N'pchillcce@inia.gob.pe',
    7, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'yhuari', N'm7n8qT4mV7uQ6vdHi', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Yodel Cheldo', N'Huari Salazar', N'yhuari@inia.gob.pe',
    7, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jtaza', N'XdA2ZaBj8DA95n5ak', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan', N'Taza', N'jtaza@inia.gob.pe',
    8, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'echincha', N'7EHeCyl82ox2Fz35p', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Cronwell', N'Aguilar Gálvez', N'jaguilar@inia.gob.pe',
    9, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lhernandez', N'r6AHvgebYU2wswyzc', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luis Alberto', N'Hernández Lengua', N'lhernandez@inia.gob.pe',
    9, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ehuamania', N'F5zudERH9FXgCsRbe', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan Pablo', N'Pineda Huamanñahui', N'jpineda@inia.gob.pe',
    10, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ylindo', N'HkksHmivKZ43WcE32', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ysabel', N'Lindo Rondon', N'ylindo@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rporteros', N'ohoHnE735eJtHx7cD', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Raúl Roberto', N'Porteros Ames', N'rporteros@inia.gob.pe',
    11, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cgarrido', N'FcEZmkS93yJmR3uDj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carla Estefani', N'Garrido Sandoval', N'cgarrido@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'grivera', N'wf6hxdXNfUUC2CSFC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gloria Maricela', N'Rivera Peña', N'grivera@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jmelendez', N'AkCxKDjE6kWdhtTYL', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Josué Jonathan', N'Melendez Melgarejo', N'jmelendez@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'vmoreno', N'LTJXksUp27d87ESxV', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Victoria Angélica', N'Moreno Maguiño', N'vmoreno@inia.gob.pe',
    11, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'tmatta', N'Dfp2gvB6QU5mwWTkk', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Tránsito Rolando', N'Matta Bernaola', N'rmatta@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mmayhuay', N'BnPQnG6pWKB3V6Ae4', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Martha Celina', N'Mayhuay Caldas', N'mmayhuay@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pnicho', N'di5SaVvEPzSQX3y9l', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Pedro Eduardo', N'Nicho Salas', N'pnicho@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jcondor', N'e4cPwY2f8G5YhTTBG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Rolando', N'Condor Caro', N'jcondor@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'fcabrel', N'S9kCmS5gVxiJb2TVQ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Fanny Luz', N'Cabrel Bazalar', N'fcabrel@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gtorres', N'iP7AExYw9K4deBXzw', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gladys del Carmen', N'Torres Medrano', N'gtorres@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'avalencia', N'GmB87nfWYu5Y3KmZ6', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Armando', N'Valencia Legua', N'avalencia@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jloayza', N'Vc4EeUSwZmG7gBSxa', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan Álvaro', N'Loayza Valdivia', N'jloayza@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'hanzualdo', N'576jn2KpFU2Wk7SCs', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Helsyn Ivo', N'Anzualdo Macedo', N'hanzualdo@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dvilchez', N'4k7mmYKvYhdcvH6yu', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Dioliza', N'Vílchez Palomino', N'dvilchez@inia.gob.pe',
    11, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mmarcelo', N'9bfKeyD2HeYNeRDmW', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mavel Nansi', N'Marcelo Salvador', N'mmarcelo@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rcalderone', N'GNPac5wMBKNGqKgco', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rafael Juan', N'Calderón Espinoza', N'rcalderon@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'bsales', N'GXQDhw7V5wGHejwDv', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Beatriz', N'Sales Dávila', N'bsales@inia.gob.pe',
    11, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gurbina', N'HSPtSSOl5diQwKoUr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Giancarla', N'Urbina', NULL,
    12, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eeaelchira02', N'JeNSEUoJ3jnp2sQA2', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Renzo Yandir', N'Núñez Cruz', NULL,
    12, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eeaelchira03', N'CA3rqEtec2rUaGf6t', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jackeline Janet', N'Ramos Caycho', NULL,
    12, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'aportocarrero', N'BSvX9gPU1YwyojuDY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Adolfo', N'Portocarrero Chambergo', N'aportocarrero@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jbermudes', N'uEWPvH5N8mfGUR9Eg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Luis', N'Bermudes Valles', N'jbermudes@inia.gob.pe',
    13, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'onavarro', N'XXpwwR3a3Y5DBNJXZ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ofelia', N'Navarro Macedo', N'onavarro@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'raparcana', N'ViQNVW2rif3GsGgA2', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rosa Miriam', N'Aparcana García', N'raparcana@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jlopezu', N'7jHwcz8m6dBve7aCw', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan Carlos', N'López Ucariegue', N'jlopez@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lgarciab', N'aWJ6puhUVnQsgk3u5', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lucas Armando', N'García Bartha', N'lgarcia@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cbarrera', N'q6V6j4su8BarMJ8NP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Cicerón', N'Barrera Torres', N'cbarrera@inia.gob.pe',
    13, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'porihuela', N'enFNoRBpqt6dGQc5D', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Patricia del Carmen', N'Orihuela Pasquel', N'porihuela@inia.gob.pe',
    13, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eelporvenir02', N'R8gibA4AAzGXiaxrY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jesed', N'Huaman Fasabi', NULL,
    13, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'coliva', N'NRTSmd2jBvwZWevwv', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carlos Alberto', N'Oliva Cruz', N'coliva@inia.gob.pe',
    13, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ckoch', N'FGrrCHT8xM94KrWEB', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Christian', N'Koch Duarte', N'ckoch@inia.gob.pe',
    13, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jchupillon', N'7ZukLepJtcijBH3GS', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jimmy Wilquerson', N'Chupillon Cubas', N'jchupillon@inia.gob.pe',
    13, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ldurand', N'M9csUmb4xTTgnwnuy', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luz Marlene', N'Durand Chávez', N'ldurand@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'avalles', N'p4WYFJWaDs4ajYjsL', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ayda Karín', N'Valles Ramírez', N'avalles@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jrojas', N'5bgiS8rXR4rPfRoGi', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Ángel', N'Rojas Chávez', N'jarojas@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mgarate', N'ywrMRdpBu2vaym3HY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mar Asuncion', N'Garate Navarro', N'mgarate@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rgaray', N'w5qNyouDBHp5wHz4Y', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Richer', N'Garay Montes', N'rgaray@inia.gob.pe',
    13, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ralbarracin', N'iw9ZBeGKm6Smphz63', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rudy Shernell', N'Albarracin Machicado', N'ralbarracin@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rgalvez', N'BLUfs6XQTcQ5zGMt7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rubén Antonio', N'Gálvez Ilazaca', N'rgalvez@inia.gob.pe',
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ayujra', N'CyDH5tBsZTHYktBTi', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Adolfo Isidro', N'Yujra Mamani', N'ayujra@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rortega', N'vwVsUe7KY9zJBjdK9', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rubén', N'Ortega Mamani', N'rortega@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eillpa03', N'fGT5CwJNmfr3am2zP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Eliana', N'Flores Mamani', NULL,
    14, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jespinoza', N'Up9YmyYcYk3mh9rSC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Julia Isabel', N'Espinoza Anchapuri', N'jespinozaa@inia.gob.pe',
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rquispe', N'FyOsH3N74GJ23IPLw', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rufo Abel', N'Quispe Condori', NULL,
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'wbarreda', N'jEMj8JSztAWeVjNK8', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Wilfredo Lino', N'Barreda Quispe', N'wbarreda@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'amollinedo', N'DDeZJ825SSDjZz4bG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Aracely Mary', N'Mollinedo Cauna', NULL,
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'vretamozo', N'KujCeZQBxVWDTCC7B', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Virginia', N'Retamozo Torres', N'vretamozo@inia.gob.pe',
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mmamani', N'crWvrhUe5CosTuNLD', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mery Maribel', N'Mamani Aguilar', N'mmamani@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'fruelas', N'2T5E7LA9XoBFagndd', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Fernando', N'Ruelas Enríquez', N'fruelas@inia.gob.pe',
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'emamani', N'M8d4VunijfVj5m58b', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Edith', N'Mamani Fernández', N'emamani@inia.gob.pe',
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pmendoza', N'7AkAajsqrKyLxJJd2', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Paúl Pascual', N'Mendoza Coari', N'pmendoza@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jquilca', N'WMG3HFoXfe8Am4vRg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan José', N'Quilca Ilaquijo', N'jquilca@inia.gob.pe',
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rmamani', N'QTP36qn2xbX9ewJTs', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rubén Herberht', N'Mamani Cato', N'rmamani@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'epacheco', N'gTzG29DdWLfjj2SPY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Erika Samamtha', N'Pacheco Arenas', N'epachecoa@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eillpa04', N'AyCB5Kq79nD8ec5u6', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gladys Yris', N'Polanco Núñez', NULL,
    14, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'colarte', N'XAitJ6eEYDojLCVSB', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'César Ramiro', N'Olarte Zuñiga.', N'colarte@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eillpa05', N'W2NMhp9Ss6fgiebD5', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lina Maricel', N'Flores Flores', NULL,
    14, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mgonzalesc', N'HnptR53rXaju348RL', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mario Lino', N'Gonzales Castillo', N'lgonzales@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ranquise', N'hLM9r9WxFiGnPEaNT', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gilberto', N'Anquise Ticahuanca', NULL,
    14, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ssalcedo', N'5TgQX7wnYtpG3Fg6X', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Selima Milagros', N'Salcedo Mayta', N'ssalcedo@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dcenteno', N'4zN7p92DenCNRNtSW', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Diego', N'Centeno Illacutipa', N'asantacruz@inia.gob.pe',
    14, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'tchavez', N'BaVfMf3Mx2RHCPJpU', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Tulio Wilfredo', N'Chávez Espíritu', N'tchavez@inia.gob.pe',
    18, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'amacedao', N'UK5m9FjHGCi3kSn3', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Anyel Lizeth', N'Maceda Ortiz', NULL,
    15, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eeamoquegua05', N'FvhpaC4974790nQ6G', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Iris Marleny', N'Guerra Colana', NULL,
    16, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'bguzman', N'FGlDu9Xrii4HmJY3F', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Betty Karina', N'Guzman Valqui', N'bguzman@inia.gob.pe',
    16, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'uquispe', N'p82QwCcqAsRaHypNj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Urbano', N'Quispe Araujo', N'uquispe@inia.gob.pe',
    16, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jsanchez', N'HCbHtoAJfNyAe5dYX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jessica', N'Sánchez Larrañaga', N'jsanchez@inia.gob.pe',
    16, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lhermitanoj', N'AnFZMW6eSprjinJ6H', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lissett', N'Hermitaño Jaco', NULL,
    17, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'aalarcon', N'WqEWL9uNpcG5TI7EW', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Arturo', N'Alarcón Tanta', N'aalarcon@inia.gob.pe',
    18, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eyulgo', N'S2HNWJiHP7XJj8qhI', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Eunice', N'Yulgo Aguirre', NULL,
    18, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rramosp', N'LjiRuUe6xX3EjoW42', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Robert Edmundo', N'Ramos Porta', N'rramos@inia.gob.pe',
    19, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'epichanaki02', N'QtU8tEZidhuowRxZ5', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Thalia Cintia', N'Sáenz Valle', NULL,
    19, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'epichanaki03', N'zSdReh5hrjocN3nH9', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Kelly Fiorella', N'Carrillo Torres', NULL,
    19, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'itenazoa', N'tUsEFPsWLoqqrghm6', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ivan', N'Tenazoa Rios', N'itenazoa@inia.gob.pe',
    20, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gramirez', N'8UibMkGz8VGUWnsL3', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gabriela Ruby', N'Ramírez Uribe', N'gramirez@inia.gob.pe',
    20, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mtuesta', N'eBruqMkufYceKnZ4z', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mar y Estrella', N'Tuesta Vásquez', N'mtuesta@inia.gob.pe',
    20, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mquispe', N'U6W5ZNpvBjNj4mdKL', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marial del Carmen', N'Quispe Torres', N'mquispe@inia.gob.pe',
    20, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gcardenas', N'qCS35VTNkYbuobvEk', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gloria Patricia', N'Cárdenas Rengifo', N'gcardenas@inia.gob.pe',
    20, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'esbernardo', N'Yhsv6xyH4CFdA6HFP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Shefferson Gilbert W.', N'Feijoo Narvasta', N'sfeijoo@inia.gob.pe',
    21, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'shilares', N'MeUd8J25k4LicZ2ee', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sharmely', N'Hilares Vargas', N'shilares@inia.gob.pe',
    21, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'srodriguez', N'VIkt6ve2nYVDTkZQ7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sharlyn Kimberlyn', N'Rodriguez Limpias', N'srodriguez@inia.gob.pe',
    21, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'esramon', N'2qk5wCTU41z2nMZDG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marisol', N'Ruiz Calsin', N'mruiz@inia.gob.pe',
    22, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'arodriguez', N'3yKZ68vVtYfZVem3t', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ángel Martín', N'Rodríguez del Castillo', N'arodriguez@inia.gob.pe',
    22, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'hlopezr', N'7mdNUVm4C1R7UTwqI', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Héctor Alejandro', N'López Ruiz', N'hlopez@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jhernandez', N'4J3BX2jE6QKxCqkBu', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jimmy', N'Hernández Alegria', N'jhernandez@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gvalderramae', N'WeScQRJLm6Eq5NdAs', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gladis', N'Valderrama Eléspuru', N'gvalderrama@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ecelis', N'jmdJZ59fsKUvjxzMN', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Eloiza', N'Celis Morey', N'ecelis@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rferreyra', N'XTq9Z9esxoG8PRfxn', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Roner', N'Ferreyra Torres', N'rferreyra@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'afernandez', N'f8DmTHEcT2oWbunkx', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Andrés', N'Fernandez Sandoval', N'afernandez@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jbaselly', N'Tetg6Yssv4ezy3eVy', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan Rodrigo', N'Baselly Villanueva', N'jbaselly@inia.gob.pe',
    23, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jcampos', N'uVepssu4Q9NBWYNJY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Johnny Carlos', N'Campos Cedano', N'jcampos@inia.gob.pe',
    23, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rperez', N'Nwzi7QMDJTCm6z6dt', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Roberto Alonso', N'Pérez Vela', N'rperez@inia.gob.pe',
    23, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mtarazona', N'mbAqGDd8u2qzfeZuj', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'María de los Ángeles Cas', N'Tarazona Morales', N'mtarazona@inia.gob.pe',
    23, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jsaenz', N'ZzWzohipYGcY2EXPH', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jesús Martín', N'Sáenz Peña', N'jsaenz@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'bchuquizuta', N'D4jmonWKebf9Xaqx6', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Badys', N'Chuquizuta del Castillo', N'bchuquizuta@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rgonzalesv', N'7F6VxW5ccXQQ2pYUf', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rodrigo', N'Gonzales Vega', N'rgonzalesv@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'siman', N'8yWJhifnBSm9ibQAq', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sixto Alfredo', N'Imán Correa', N'siman@inia.gob.pe',
    23, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rdelaguila', N'JqBBqMWY67zckWzpZ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rosmery', N'Del Aguila Berrocal', N'rdelaguila@inia.gob.pe',
    23, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cvelasquezr', N'6mrEPmUeRofDVrkLr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Claudia Lucía', N'Velasquez Rosazza', N'cvelasquez@inia.gob.pe',
    24, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jsoto', N'96RgU5WBUDyRn3Q9Z', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jonell', N'Soto Jerí', N'jsoto@inia.gob.pe',
    24, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'esantaana01', N'9F1m7x0AWdAhRVfWF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Maribel', N'Cutti Medina', NULL,
    24, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jaliaga', N'BqomgfhatpcWT4e7g', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Arturo', N'Aliaga Cartolín', N'jaliaga@inia.gob.pe',
    24, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mnaveros', N'NCuYxKoQxxuBd7HnB', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Mary Luz', N'Naveros Flores', N'mnaveros@inia.gob.pe',
    24, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sticona', N'44WebbKuPaCb2GE4R', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Samir Saúl', N'Ticona Villalba', N'sticona@inia.gob.pe',
    25, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'eviru', N'UYndC6MmDJzM7ncfT', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Joselin', N'Llerena Paredes', NULL,
    26, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'equisper', N'2ZzDS5KSDLVT8xpft', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Elvia Nataly', N'Quispe Ruiz', N'equisper@inia.gob.pe',
    26, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'gclavo', N'vWYAy4Q0APKiL9S6x', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Gladys Yuliana', N'Clavo Guevara', N'gclavo@inia.gob.pe',
    26, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'clazaro', N'xy6vVuwDeejhjdmu9', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carlos Antonio', N'Lázaro Carrión', N'clazaro@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lguerrero', N'sC9uQf5UbmPN4ZFBm', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lito', N'Guerrero Facundo', N'lguerrero@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rvasquez', N'RLeQ8Big3DNwCiJum', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Richard Iván', N'Vásquez Rojas', N'rvasquezr@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jvaldiviar', N'8Q4AV4X2DhuRqq9aB', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Juan Miguel', N'Valdivia Ramírez', N'jvaldivia@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mchaponan', N'capm9Dc8usMWQRntq', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Miguel', N'Chapoñan Vásquez', N'mchaponan@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'pinjante', N'Yo4q4mBG3BcmhEcfG', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Pedro Hugo', N'Injante Silva', N'pinjante@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mgastelo', N'Jmg9uQYRVPHWhZezQ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'María Gladys', N'Gástelo Benavides', N'mgastelo@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'aquispere', N'nTh7JCBtAAYhyQVi7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Antonio', N'Quispe Reyes', N'aquisper@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cmalca', N'X55ittjLQQQAVsajr', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carlos Humberto', N'Malca Carbonel', N'cmalca@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lgarcia', N'xa55c7NxZugsu3mwu', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Lila', N'García Leveau', N'lgarcial@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'kpicce', N'7q3gpNFb48fvTfNkJ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Karen Gabriela', N'Picce Llaja', N'kpicce@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dmarin', N'XZNggsx5Xh8FsjDyE', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Delia Marleni', N'Marin Baca', N'dmarin@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cramirez', N'tQf6qykK5Ni3wNisn', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'César Augusto', N'Ramírez Apolitano', N'cramireza@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'fmontero', N'28DqSjeBTRFi969LH', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Fernando', N'Montero Bances', N'fmontero@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jbobadilla', N'3Xztj2PZM85aoYFuB', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jovany', N'Bobadilla Guadalupe', N'jbobadilla@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'smendez', N'vT2CLytUTjYCpfXQ3', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sandra Johana', N'Mendez Farroñan', N'smendez@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mnieves', N'9epfWkHEXvpGXXKU7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marite Yulisa', N'Nieves Rivera', N'mnieves@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lodar', N'NyoypX3e6TzuCogXA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luis Fernando', N'Odar Córdova', N'lodar@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ehernandez', N'MaAaiKi8qo56Xyqvp', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Eswin David', N'Hernández Obregón', N'ehernandez@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mgallardo', N'd6MGVD8eaG3RuRqAg', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'María Olinda', N'Gallardo Delgado', N'mgallardo@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'vramirezl', N'9YSRdJhRh5BHTQv6Z', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Víctor', N'Ramírez Lora', N'vramirezl@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'csatornicio', N'QEEZXxeFLwcFdof9t', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'César Humberto', N'Satornicio Mendoza', N'csatornicio@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jmontero', N'6W7BB6YtKiCtAwqDu', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José', N'Montero Bances', N'jmontero@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'cprimo', N'rwHzn6EbhdqhkAaxX', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carmen Julia', N'Primo Velasquez', N'cprimo@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'walarcon', N'SwiiV8Ajpvgp2BWF7', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Wilder Orlando', N'Alarcón Pérez', N'walarcon@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rcarrasco', N'7J74usbwpJJJZMCak', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Renato Francisco', N'Carrasco Calderón.', N'rcarrasco@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jfrancia', N'iSidLBNLjU2UunV32', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Polo', N'Francia Gonzales', N'jfrancia@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'dtejada', N'7xudQrT462GyVC3bB', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Dilma', N'Tejada Fernandez', N'dtejada@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jbolivia', N'5FYzXonuTBcz3RXJF', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'José Dante', N'Bolivia Díaz', N'jbolivia@inia.gob.pe',
    27, NULL, 2, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'laguinaga', N'sR7pCivFRC56VhJRJ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Leandro Egberto', N'Aguinaga Calderón', N'laguinaga@inia.gob.pe',
    27, NULL, 3, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica18', N'JF9z3CotgxAHu4fAq', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jeremy', N'Valdivia', NULL,
    1, NULL, 1, N'Profesional',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'apozo', N'5SutxGHQMK2HWyMyo', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Angelita Pozo', N'Pozo López', N'mpozo@inia.gob.pe',
    1, 1, 3, N'Gerente',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica29', N'1Ka3lgu65ZPGR6dYk', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jhordan Lee', N'Peralta Lozano', NULL,
    1, 1, 4, N'Practicante',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'informatica20', N'XvJQ6vcrhCsqIcL1w', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Sebastián Eduardo', N'Gallardo Cerna', NULL,
    1, 1, 4, N'Practicante',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'jganoza', N'xkoit5RmvFXn92mKY', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Jorge Juan', N'Ganoza Roncal', N'jganoza@inia.gob.pe',
    1, 36, 3, N'Presidente Ejecutivo',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'calbis', N'n7IvVy4LmL726wdPA', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Carolina', N'Albis', N'calbis@inia.gob.pe',
    1, 1, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'sdpa41', N'7kUqyrGjB2PguQzbZ', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'María', N'Mattos', NULL,
    1, 29, 1, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lvaldez', N'LPRHUYYuJORCf6Rht', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Laura Elizabeth', N'Valdez Castillo', N'lvaldez@inia.gob.pe',
    1, 28, 2, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'avilcherrez', N'4U8v5xvWLnknk1WZh', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Ana', N'Vilcherrez Acosta', N'avilcherrez@inia.gob.pe',
    1, 35, 2, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rgonzales', N'Wa5NplzlMhNvwuC', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rosa', N'Gonzales', N'rgonzales@inia.gob.pe',
    1, 1, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'zpacahuala', N'RQXQfleVTrN1ZWShu', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Zulema', N'Pacahuala Sánchez', N'zpacahuala@inia.gob.pe',
    1, 29, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'tsaavedra', N'wmb4IMQpTXJ7zW1nS', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Teresa', N'Saavedra Aguilar', N'tsaavedra@inia.gob.pe',
    1, 36, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'kcespedes', N'RPocFZRKZuJkbu83Z', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Karla Vicroria', N'Céspedes Rebatta', N'kcespedes@inia.gob.pe',
    9, NULL, 2, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'ehuamania', N'wtk4cX8XjVRebpavP', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Elizabeth', N'Huamani Alarcón', N'EEACHUBIBAMBA@INIA.GOB.PE',
    10, NULL, 1, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mescobar', N'Capm9Dc8usMWQRntq', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Miriam Rosario', N'Escobar Mora', N'mescobar@inia.gob.pe',
    11, NULL, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'rcalderon', N'v8Ce639KiDbVo53h8', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Rosario Nelly', N'Calderon Puchoc', N'rncalderon@inia.gob.pe',
    11, NULL, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'lguerra', N'8vAjQ65gLgRsnHaLH', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Luciola', N'Guerra Mendoza', N'lguerra@inia.gob.pe',
    13, NULL, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'fmartinez', N'tA9TaRFw7ijswDPF4', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Francis Elaine', N'Martínez Borbor', N'sroque@inia.gob.pe',
    23, NULL, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

INSERT INTO dbo.vpn (
    usuario_vpn, credencial_vpn, estado, estado_solicitud,
    titular_tipo, titular_nombre, titular_apellidos, titular_correo,
    titular_sede_id, titular_dependencia_id, titular_tipo_contrato_id, titular_cargo,
    solicitado_por, solicitado_por_nombre, fecha_solicitud,
    aprobado_por, aprobado_por_nombre, fecha_resolucion
) VALUES (
    N'mmontero', N'GechyUu9w2ZGEx5Lz', N'Activo', N'APROBADO',
    N'INTERNO_MANUAL', N'Marilú', N'Montero García', N'mmontero@inia.gob.pe',
    24, NULL, 3, N'Secretaria',
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE(),
    N'sistema-carga-2026', N'Carga histórica VPN 2026', GETDATE()
);

-- Verificacion
SELECT COUNT(*) AS filas_importadas FROM dbo.vpn WHERE solicitado_por = 'sistema-carga-2026';
GO
