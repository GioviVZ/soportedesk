# Sistema Gestión de Soporte Informático Inventory Agent

Agente PowerShell para recolectar inventario de equipos Windows unidos a Active Directory y enviarlo al Sistema Gestión de Soporte Informático.

## Archivos

- `soportedesk-agent.ps1`: agente principal.
- `soportedesk-agent.config.example.json`: ejemplo de configuracion.

## Instalacion piloto

1. Copiar `soportedesk-agent.config.example.json` como `soportedesk-agent.config.json`.
2. Configurar:

```json
{
  "ApiUrl": "https://servidor-soportedesk/api/agente/inventario",
  "AgentToken": "TOKEN-SEGURO",
  "TimeoutSeconds": 30,
  "MaxPrograms": 500
}
```

3. Probar sin enviar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\soportedesk-agent.ps1 -DryRun
```

4. Probar enviando:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\soportedesk-agent.ps1
```

## Datos locales

El agente crea:

```text
C:\ProgramData\SoporteDesk\agent.id
C:\ProgramData\SoporteDesk\agent.log
```

## Despliegue por GPO

Crear una tarea programada por GPO:

- Ejecutar como `NT AUTHORITY\SYSTEM`.
- Trigger: al iniciar el equipo.
- Repetir cada 6 horas.
- Comando:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "\\servidor\soportedesk-agent\soportedesk-agent.ps1"
```

Para produccion se recomienda firmar el script y usar `ExecutionPolicy AllSigned`.

## Seguridad

- El token se envia en el header `X-SoporteDesk-Agent-Token`.
- El token no se escribe en logs.
- El backend debe tener configurado `AGENTE_INVENTARIO_TOKEN`.
