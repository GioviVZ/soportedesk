<#
.SYNOPSIS
  Repara cuentas "huérfanas" de AdminSDHolder en la OU de INIA para que SoporteDesk pueda administrarlas.

.DESCRIPTION
  Una cuenta que alguna vez perteneció a un grupo protegido (Domain Admins, Account Operators, etc.) queda con
  adminCount=1 y con la herencia de permisos bloqueada, aunque ya no esté en ese grupo. Por eso los permisos que
  la cuenta de servicio de SoporteDesk tiene delegados en la OU no le aplican, y Active Directory responde
  "INSUFF_ACCESS_RIGHTS" al eliminarla o modificarla (caso detectado: flopez, 2026-10-15).

  Para cada cuenta con adminCount=1 que YA NO pertenece a ningún grupo protegido, el script:
    1. Restablece la herencia de permisos (conservando los permisos explícitos actuales).
    2. Limpia el atributo adminCount.
  Las cuentas que SÍ siguen en un grupo protegido se omiten (AdminSDHolder las volvería a bloquear; y es correcto
  que SoporteDesk no pueda modificarlas).

  Por defecto solo muestra lo que haría. Use -Aplicar para ejecutar los cambios.

.REQUIREMENTS
  Ejecutar como administrador del dominio (o con permiso de modificar permisos en esas cuentas).

.EXAMPLE
  .\ad-reparar-adminsdholder-huerfanas.ps1              # simulación: solo lista
  .\ad-reparar-adminsdholder-huerfanas.ps1 -Aplicar     # aplica los cambios
  .\ad-reparar-adminsdholder-huerfanas.ps1 -Aplicar -Usuarios flopez   # solo una cuenta
#>
param(
    [string]$OuBase = 'OU=INIA,DC=inia,DC=local',
    [string[]]$Usuarios,
    [switch]$Aplicar
)

$ErrorActionPreference = 'Stop'

# Grupos protegidos por AdminSDHolder (nombres en inglés y en español).
$gruposProtegidos = @(
    'Domain Admins', 'Admins. del dominio', 'Enterprise Admins', 'Administradores de empresas',
    'Schema Admins', 'Administradores de esquema', 'Administrators', 'Administradores',
    'Account Operators', 'Opers. de cuentas', 'Server Operators', 'Opers. de servidores',
    'Backup Operators', 'Opers. de copia de seguridad', 'Print Operators', 'Opers. de impresión',
    'Replicator', 'Duplicadores', 'Domain Controllers', 'Controladores de dominio',
    'Read-only Domain Controllers', 'Controladores de dominio de sólo lectura',
    'Enterprise Key Admins', 'Key Admins'
)

$searcher = [adsisearcher]'(&(objectCategory=person)(objectClass=user)(adminCount=1))'
$searcher.SearchRoot = [adsi]"LDAP://$OuBase"
$searcher.PageSize = 500
[void]$searcher.PropertiesToLoad.AddRange(@('sAMAccountName', 'distinguishedName', 'memberOf'))

$reparadas = 0
foreach ($r in $searcher.FindAll()) {
    $sam = [string]$r.Properties['samaccountname'][0]
    if ($Usuarios -and ($Usuarios -notcontains $sam)) { continue }

    $grupos = @($r.Properties['memberof'] | ForEach-Object { (($_ -split ',')[0]) -replace '^CN=' })
    $protegido = @($grupos | Where-Object { $gruposProtegidos -contains $_ })
    if ($protegido.Count -gt 0) {
        Write-Host ("OMITIDA  {0,-16} sigue en grupo protegido: {1}" -f $sam, ($protegido -join ', ')) -ForegroundColor DarkGray
        continue
    }

    if (-not $Aplicar) {
        Write-Host ("SIMULADO {0,-16} se restablecería la herencia y se limpiaría adminCount" -f $sam) -ForegroundColor Yellow
        continue
    }

    $entry = $r.GetDirectoryEntry()
    $entry.ObjectSecurity.SetAccessRuleProtection($false, $true)   # habilita herencia, conserva reglas explícitas
    $entry.CommitChanges()
    $entry.Properties['adminCount'].Clear()
    $entry.CommitChanges()
    $reparadas++
    Write-Host ("REPARADA {0,-16} herencia restablecida y adminCount limpiado" -f $sam) -ForegroundColor Green
}

if ($Aplicar) {
    Write-Host "`nCuentas reparadas: $reparadas"
} else {
    Write-Host "`nSimulación terminada. Ejecute con -Aplicar para realizar los cambios."
}
