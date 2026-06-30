param(
    [string]$ConfigPath = "$PSScriptRoot\soportedesk-agent.config.json",
    [string]$ApiUrl,
    [string]$AgentToken,
    [int]$TimeoutSeconds,
    [int]$MaxPrograms,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$ProgramDataDir = Join-Path $env:ProgramData "SoporteDesk"
$AgentIdPath = Join-Path $ProgramDataDir "agent.id"
$LogPath = Join-Path $ProgramDataDir "agent.log"

function Ensure-AgentDirectory {
    if (-not (Test-Path -LiteralPath $ProgramDataDir)) {
        New-Item -ItemType Directory -Path $ProgramDataDir -Force | Out-Null
    }
}

function Write-AgentLog {
    param([string]$Message, [string]$Level = "INFO")

    Ensure-AgentDirectory
    $line = "{0:u} [{1}] {2}" -f (Get-Date), $Level, $Message
    Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
}

function Read-AgentConfig {
    $config = @{
        ApiUrl = $ApiUrl
        AgentToken = $AgentToken
        TimeoutSeconds = $(if ($TimeoutSeconds -gt 0) { $TimeoutSeconds } else { 30 })
        MaxPrograms = $(if ($MaxPrograms -gt 0) { $MaxPrograms } else { 500 })
    }

    if (Test-Path -LiteralPath $ConfigPath) {
        $fileConfig = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
        if (-not $config.ApiUrl -and $fileConfig.ApiUrl) { $config.ApiUrl = [string]$fileConfig.ApiUrl }
        if (-not $config.AgentToken -and $fileConfig.AgentToken) { $config.AgentToken = [string]$fileConfig.AgentToken }
        if ($TimeoutSeconds -le 0 -and $fileConfig.TimeoutSeconds) { $config.TimeoutSeconds = [int]$fileConfig.TimeoutSeconds }
        if ($MaxPrograms -le 0 -and $fileConfig.MaxPrograms) { $config.MaxPrograms = [int]$fileConfig.MaxPrograms }
    }

    return $config
}

function Get-AgentId {
    Ensure-AgentDirectory

    if (Test-Path -LiteralPath $AgentIdPath) {
        $existing = (Get-Content -LiteralPath $AgentIdPath -Raw).Trim()
        if ($existing) {
            return $existing
        }
    }

    $newId = [guid]::NewGuid().ToString()
    Set-Content -LiteralPath $AgentIdPath -Value $newId -Encoding ASCII
    return $newId
}

function Get-SafeCimInstance {
    param([string]$ClassName, [string]$Filter)

    try {
        if ($Filter) {
            return Get-CimInstance -ClassName $ClassName -Filter $Filter -ErrorAction Stop
        }
        return Get-CimInstance -ClassName $ClassName -ErrorAction Stop
    } catch {
        Write-AgentLog "No se pudo leer ${ClassName}: $($_.Exception.Message)" "WARN"
        return $null
    }
}

function Get-ComputerOu {
    try {
        $computerName = $env:COMPUTERNAME
        $searcher = New-Object DirectoryServices.DirectorySearcher
        $searcher.Filter = "(&(objectCategory=computer)(name=$computerName))"
        $result = $searcher.FindOne()
        if ($result -and $result.Properties.distinguishedname.Count -gt 0) {
            return [string]$result.Properties.distinguishedname[0]
        }
    } catch {
        Write-AgentLog "No se pudo obtener OU de Active Directory: $($_.Exception.Message)" "WARN"
    }
    return $null
}

function Get-LoggedUser {
    try {
        $computer = Get-SafeCimInstance -ClassName "Win32_ComputerSystem"
        if ($computer.UserName) {
            return [string]$computer.UserName
        }
    } catch {
        Write-AgentLog "No se pudo obtener usuario actual: $($_.Exception.Message)" "WARN"
    }
    return $null
}

function Get-InstalledPrograms {
    param([int]$Limit)

    $paths = @(
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    $items = foreach ($path in $paths) {
        try {
            Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
                Where-Object { $_.DisplayName } |
                Select-Object DisplayName, DisplayVersion, Publisher, InstallDate
        } catch {
            Write-AgentLog "No se pudo leer programas desde $path`: $($_.Exception.Message)" "WARN"
        }
    }

    $items |
        Sort-Object DisplayName, DisplayVersion -Unique |
        Select-Object -First $Limit |
        ForEach-Object {
            @{
                nombre = [string]$_.DisplayName
                version = if ($_.DisplayVersion) { [string]$_.DisplayVersion } else { $null }
                fabricante = if ($_.Publisher) { [string]$_.Publisher } else { $null }
                fechaInstalacion = if ($_.InstallDate) { [string]$_.InstallDate } else { $null }
            }
        }
}

function Get-DiskInventory {
    $disks = Get-SafeCimInstance -ClassName "Win32_LogicalDisk" -Filter "DriveType=3"
    if (-not $disks) { return @() }

    return @($disks | ForEach-Object {
        @{
            letra = [string]$_.DeviceID
            nombre = if ($_.VolumeName) { [string]$_.VolumeName } else { $null }
            tipo = "Local"
            totalBytes = if ($_.Size) { [int64]$_.Size } else { $null }
            libreBytes = if ($_.FreeSpace) { [int64]$_.FreeSpace } else { $null }
        }
    })
}

function Get-NetworkInventory {
    $networks = Get-SafeCimInstance -ClassName "Win32_NetworkAdapterConfiguration"
    if (-not $networks) { return @() }

    return @($networks |
        Where-Object { $_.IPEnabled -eq $true } |
        ForEach-Object {
            @{
                descripcion = if ($_.Description) { [string]$_.Description } else { $null }
                macAddress = if ($_.MACAddress) { [string]$_.MACAddress } else { $null }
                ipAddresses = @($_.IPAddress | Where-Object { $_ })
            }
        })
}

function First-Value {
    param($Values)

    foreach ($value in $Values) {
        if ($value) { return $value }
    }
    return $null
}

function Build-InventoryPayload {
    param([string]$AgentId, [int]$MaxProgramsValue)

    $bios = Get-SafeCimInstance -ClassName "Win32_BIOS"
    $computer = Get-SafeCimInstance -ClassName "Win32_ComputerSystem"
    $os = Get-SafeCimInstance -ClassName "Win32_OperatingSystem"
    $processor = @(Get-SafeCimInstance -ClassName "Win32_Processor") | Select-Object -First 1
    $networks = Get-NetworkInventory
    $primaryNetwork = @($networks) | Select-Object -First 1

    return @{
        agentId = $AgentId
        hostname = [string]$env:COMPUTERNAME
        serialEquipo = if ($bios.SerialNumber) { [string]$bios.SerialNumber } else { $null }
        fabricante = if ($computer.Manufacturer) { [string]$computer.Manufacturer } else { $null }
        modelo = if ($computer.Model) { [string]$computer.Model } else { $null }
        dominio = if ($computer.Domain) { [string]$computer.Domain } else { $null }
        ou = Get-ComputerOu
        usuarioActual = Get-LoggedUser
        sistemaOperativo = if ($os.Caption) { [string]$os.Caption } else { $null }
        versionSistema = First-Value @($os.Version, $os.BuildNumber)
        arquitectura = if ($os.OSArchitecture) { [string]$os.OSArchitecture } else { $null }
        procesador = if ($processor.Name) { [string]$processor.Name } else { $null }
        ramTotalBytes = if ($computer.TotalPhysicalMemory) { [int64]$computer.TotalPhysicalMemory } else { $null }
        ipPrincipal = if ($primaryNetwork -and $primaryNetwork.ipAddresses.Count -gt 0) { [string]$primaryNetwork.ipAddresses[0] } else { $null }
        macPrincipal = if ($primaryNetwork) { [string]$primaryNetwork.macAddress } else { $null }
        discos = @(Get-DiskInventory)
        redes = @($networks)
        programas = @(Get-InstalledPrograms -Limit $MaxProgramsValue)
    }
}

function Send-Inventory {
    param($Payload, [hashtable]$Config)

    if (-not $Config.ApiUrl) {
        throw "ApiUrl no configurado."
    }
    if (-not $Config.AgentToken) {
        throw "AgentToken no configurado."
    }

    $headers = @{
        "X-SoporteDesk-Agent-Token" = ([string]$Config.AgentToken).Trim()
    }
    $body = $Payload | ConvertTo-Json -Depth 8 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

    return Invoke-RestMethod `
        -Method Post `
        -Uri $Config.ApiUrl `
        -Headers $headers `
        -ContentType "application/json; charset=utf-8" `
        -Body $bodyBytes `
        -TimeoutSec $Config.TimeoutSeconds
}

try {
    Ensure-AgentDirectory
    $config = Read-AgentConfig
    $agentId = Get-AgentId
    Write-AgentLog "Iniciando recoleccion de inventario. DryRun=$DryRun"

    $payload = Build-InventoryPayload -AgentId $agentId -MaxProgramsValue $config.MaxPrograms

    if ($DryRun) {
        $payload | ConvertTo-Json -Depth 8
        Write-AgentLog "DryRun completado. No se envio informacion."
        exit 0
    }

    $response = Send-Inventory -Payload $payload -Config $config
    $inventoryId = if ($response.id) { $response.id } else { "sin-id" }
    Write-AgentLog "Inventario enviado correctamente. InventarioId=$inventoryId Hostname=$($payload.hostname)"
    exit 0
} catch {
    Write-AgentLog "Error en agente: $($_.Exception.Message)" "ERROR"
    Write-Error $_
    exit 1
}
