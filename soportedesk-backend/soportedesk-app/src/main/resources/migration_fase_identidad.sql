-- =====================================================================
-- Fase Identidad del Plan de Normalizacion (docs/plan-normalizacion-base-datos.docx,
-- seccion 4.1). Prerrequisito tecnico de Equipos y VPN (persona_id).
--
-- 100% ADITIVO: crea tablas nuevas y copia datos, no borra ni modifica
-- ninguna tabla existente. core.Personas, core.PersonaAsignaciones y
-- ad_usuarios_cache siguen intactas y en uso hasta que el equipo valide
-- el nuevo dominio (regla de "tablas viejas en paralelo" del plan).
--
-- PRERREQUISITO: correr solo despues del backup completo verificado
-- (ssti_prenormalizacion_20260724_171842.bak).
--
-- Nota sobre subdependencia_id en persona_asignacion: queda NULL en esta
-- migracion porque requiere el mapeo org.*Mapeo -> GestionOficinaID que
-- todavia no es 1 a 1 confiable. Se completa en la Fase de Organizacion.
--
-- Formato de fecha verificado en ad_usuarios_cache: dd/mm/yyyy HH:mm
-- (estilo 103), TRY_CONVERT sin fallos sobre las 1,215 filas actuales.
-- account_expires: hoy el 100% de las filas tiene el valor literal
-- 'Nunca' (sin fecha real de expiracion), se mapea a NULL.
-- =====================================================================

USE ssti;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION FaseIdentidad;

    CREATE TABLE dbo.persona (
        persona_id              BIGINT NOT NULL PRIMARY KEY,
        tipo_documento          VARCHAR(20) NULL,
        numero_documento        VARCHAR(20) NULL,
        nombres                 NVARCHAR(150) NOT NULL,
        apellidos               NVARCHAR(200) NOT NULL,
        sam_account_name        NVARCHAR(120) NULL,
        correo_institucional    NVARCHAR(250) NULL,
        telefono                NVARCHAR(50) NULL,
        celular                 NVARCHAR(50) NULL,
        empresa                 NVARCHAR(250) NULL,
        estado_persona          VARCHAR(30) NOT NULL CONSTRAINT DF_persona_estado DEFAULT ('ACTIVO'),
        activo                  BIT NOT NULL CONSTRAINT DF_persona_activo DEFAULT (1),
        tipo_cuenta_id          INT NULL,
        fecha_registro          DATETIME2 NOT NULL CONSTRAINT DF_persona_fecha_registro DEFAULT (SYSUTCDATETIME()),
        fecha_actualizacion     DATETIME2 NULL,
        creado_por              NVARCHAR(100) NULL,
        actualizado_por         NVARCHAR(100) NULL,
        CONSTRAINT UQ_persona_sam_account_name UNIQUE (sam_account_name),
        CONSTRAINT FK_persona_tipo_cuenta FOREIGN KEY (tipo_cuenta_id) REFERENCES core.TiposCuentaDirectorio(TipoCuentaID)
    );

    CREATE TABLE dbo.persona_asignacion (
        persona_asignacion_id   BIGINT NOT NULL PRIMARY KEY,
        persona_id               BIGINT NOT NULL,
        subdependencia_id        BIGINT NULL,
        cargo                     NVARCHAR(250) NULL,
        fecha_inicio              DATE NULL,
        fecha_fin                 DATE NULL,
        es_actual                 BIT NOT NULL,
        fuente                    VARCHAR(30) NOT NULL,
        fecha_registro            DATETIME2 NOT NULL,
        creado_por                NVARCHAR(150) NULL,
        CONSTRAINT FK_persona_asignacion_persona FOREIGN KEY (persona_id) REFERENCES dbo.persona(persona_id),
        CONSTRAINT FK_persona_asignacion_subdep FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias(id)
    );

    CREATE TABLE dbo.persona_contrato (
        persona_contrato_id      BIGINT NOT NULL PRIMARY KEY,
        persona_id                BIGINT NOT NULL,
        tipo_contrato_id          BIGINT NOT NULL,
        cargo                     NVARCHAR(250) NULL,
        fecha_inicio              DATE NULL,
        fecha_fin                 DATE NULL,
        activo                    BIT NULL,
        numero_contrato           NVARCHAR(100) NULL,
        empresa_contratante       NVARCHAR(250) NULL,
        observacion               NVARCHAR(500) NULL,
        fecha_registro            DATETIME2 NULL,
        creado_por                NVARCHAR(150) NULL,
        CONSTRAINT FK_persona_contrato_persona FOREIGN KEY (persona_id) REFERENCES dbo.persona(persona_id),
        CONSTRAINT FK_persona_contrato_tipo FOREIGN KEY (tipo_contrato_id) REFERENCES dbo.tipos_contrato(id)
    );

    CREATE TABLE dbo.ad_cuenta (
        sam_account_name         NVARCHAR(120) NOT NULL PRIMARY KEY,
        persona_id                BIGINT NULL,
        display_name               NVARCHAR(255) NULL,
        given_name                 NVARCHAR(255) NULL,
        surname                    NVARCHAR(255) NULL,
        mail                       NVARCHAR(255) NULL,
        department                 NVARCHAR(255) NULL,
        company                    NVARCHAR(255) NULL,
        title                      NVARCHAR(255) NULL,
        telephone_number           NVARCHAR(100) NULL,
        mobile                     NVARCHAR(100) NULL,
        office                     NVARCHAR(255) NULL,
        description                NVARCHAR(MAX) NULL,
        distinguished_name         NVARCHAR(MAX) NULL,
        user_principal_name        NVARCHAR(255) NULL,
        enabled                    BIT NOT NULL,
        locked                     BIT NOT NULL,
        organizational_unit        NVARCHAR(500) NULL,
        when_created               DATETIME2 NULL,
        when_changed               DATETIME2 NULL,
        pwd_last_set               DATETIME2 NULL,
        last_logon_timestamp       DATETIME2 NULL,
        account_expires            DATETIME2 NULL,
        bad_pwd_count              INT NULL,
        lockout_time               BIGINT NULL,
        groups_text                NVARCHAR(MAX) NULL,
        synced_at                  DATETIME2 NOT NULL,
        CONSTRAINT FK_ad_cuenta_persona FOREIGN KEY (persona_id) REFERENCES dbo.persona(persona_id)
    );

    -- persona_id explicito (no IDENTITY): se preserva PersonaID de core.Personas
    INSERT INTO dbo.persona
        (persona_id, tipo_documento, numero_documento, nombres, apellidos,
         sam_account_name, correo_institucional, telefono, celular, empresa,
         estado_persona, activo, tipo_cuenta_id, fecha_registro, fecha_actualizacion,
         creado_por, actualizado_por)
    SELECT
        PersonaID, TipoDocumento, NumeroDocumento, Nombres, Apellidos,
        SamAccountName, CorreoInstitucional, Telefono, Celular, Empresa,
        ISNULL(EstadoPersona, 'ACTIVO'), ISNULL(Activo, 1), TipoCuentaID,
        ISNULL(FechaRegistro, SYSUTCDATETIME()), FechaActualizacion,
        CreadoPor, ActualizadoPor
    FROM core.Personas;

    INSERT INTO dbo.persona_asignacion
        (persona_asignacion_id, persona_id, subdependencia_id, cargo, fecha_inicio,
         fecha_fin, es_actual, fuente, fecha_registro, creado_por)
    SELECT
        PersonaAsignacionID, PersonaID, NULL, Cargo, FechaInicio, FechaFin,
        EsActual, ISNULL(Fuente, 'MANUAL'), ISNULL(FechaRegistro, SYSUTCDATETIME()), CreadoPor
    FROM core.PersonaAsignaciones;

    -- core.PersonaContratos esta vacia hoy (0 filas) -- nada que migrar

    INSERT INTO dbo.ad_cuenta
        (sam_account_name, persona_id, display_name, given_name, surname, mail,
         department, company, title, telephone_number, mobile, office, description,
         distinguished_name, user_principal_name, enabled, locked, organizational_unit,
         when_created, when_changed, pwd_last_set, last_logon_timestamp, account_expires,
         bad_pwd_count, lockout_time, groups_text, synced_at)
    SELECT
        a.sam_account_name, p.persona_id, a.display_name, a.given_name, a.surname, a.mail,
        a.department, a.company, a.title, a.telephone_number, a.mobile, a.office, a.description,
        a.distinguished_name, a.user_principal_name, a.enabled, a.locked, a.organizational_unit,
        TRY_CONVERT(datetime2, a.when_created, 103),
        TRY_CONVERT(datetime2, a.when_changed, 103),
        TRY_CONVERT(datetime2, a.pwd_last_set, 103),
        TRY_CONVERT(datetime2, a.last_logon_timestamp, 103),
        CASE WHEN a.account_expires = N'Nunca' THEN NULL ELSE TRY_CONVERT(datetime2, a.account_expires, 103) END,
        TRY_CONVERT(int, a.bad_pwd_count),
        a.lockout_time, a.groups_text, a.synced_at
    FROM dbo.ad_usuarios_cache a
    LEFT JOIN dbo.persona p ON p.sam_account_name = a.sam_account_name;

COMMIT TRANSACTION FaseIdentidad;
GO

PRINT 'Fase Identidad aplicada: persona, persona_asignacion, persona_contrato, ad_cuenta creadas y pobladas.';
GO
