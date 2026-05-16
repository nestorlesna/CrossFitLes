# Uso: .\scripts\release.ps1 1.0.8
param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$GradlePath    = "android/app/build.gradle"
$VersionTsPath = "src/config/version.ts"

# ── 1. build.gradle ────────────────────────────────────────────────────────────
$Content = Get-Content $GradlePath -Raw

$CurrentCode = [regex]::Match($Content, 'versionCode\s+(\d+)').Groups[1].Value
$NewCode     = [int]$CurrentCode + 1

Write-Host "Bumping build.gradle: versionCode $CurrentCode → $NewCode, versionName → $Version"

$Content = $Content -replace "versionCode\s+$CurrentCode", "versionCode $NewCode"
$Content = $Content -replace 'versionName\s+"[^"]*"',      "versionName `"$Version`""
Set-Content $GradlePath $Content -NoNewline

# ── 2. src/config/version.ts ───────────────────────────────────────────────────
# APP_VERSION debe coincidir con versionName para que el sistema de actualización
# automática compare correctamente la versión instalada contra la del servidor.
$VTs = Get-Content $VersionTsPath -Raw
$VTs = $VTs -replace "APP_VERSION = '[^']*'", "APP_VERSION = '$Version'"
Set-Content $VersionTsPath $VTs -NoNewline
Write-Host "Bumped src/config/version.ts: APP_VERSION → '$Version'"

# ── 3. Commit y tag ────────────────────────────────────────────────────────────
# Incluir TODOS los cambios locales (nuevos archivos, modificaciones, imágenes, etc.)
# para que el APK generado refleje exactamente el estado del working tree.
# Se excluyen explícitamente archivos sensibles típicos.
$SensitivePatterns = @('.env', '.env.local', '.env.production', 'credentials.json', 'serviceAccountKey.json')
$Staged = git status --porcelain | Where-Object { $_ -match '\S' }

if ($Staged) {
    Write-Host "`nArchivos detectados para incluir en el release:"
    $Staged | ForEach-Object { Write-Host "  $_" }

    $Sensitive = $Staged | Where-Object {
        $line = $_
        $SensitivePatterns | Where-Object { $line -match [regex]::Escape($_) }
    }
    if ($Sensitive) {
        Write-Host "`n⚠️  Detectados posibles archivos sensibles:" -ForegroundColor Yellow
        $Sensitive | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        $Confirm = Read-Host "`n¿Continuar de todas formas? (s/N)"
        if ($Confirm -ne 's' -and $Confirm -ne 'S') {
            Write-Host "Abortado por el usuario." -ForegroundColor Red
            exit 1
        }
    }
}

git add -A
git commit -m "chore: bump version to $Version"
git tag "v$Version"
git push origin HEAD
git push origin "v$Version"

Write-Host "Release v$Version iniciado. Ver progreso en GitHub Actions."
