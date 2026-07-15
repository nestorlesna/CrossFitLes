# Uso: .\scripts\release.ps1 1.0.8
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    # Rama principal a la que se hace merge del release.
    [string]$MainBranch = "master"
)

$ErrorActionPreference = "Stop"
# Los comandos nativos (git) NO deben lanzar excepción por exit code distinto de
# cero: el manejo de errores de git se hace explícitamente con $LASTEXITCODE
# (ver el merge más abajo). Sin esto, un conflicto abortaría el script antes de
# poder ejecutar `git merge --abort`.
$PSNativeCommandUseErrorActionPreference = $false

# Rama actual de trabajo (típicamente "develop"). El commit y el tag del
# release se crean aquí y luego se fusionan a $MainBranch.
$CurrentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($CurrentBranch -eq $MainBranch) {
    Write-Host "Ya estás en la rama principal '$MainBranch'. Ejecutá el release desde una rama de trabajo (ej: develop)." -ForegroundColor Red
    exit 1
}

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

# Push de la rama de trabajo con el commit del release.
Write-Host "`nPush de '$CurrentBranch'..."
git push origin $CurrentBranch

# ── 4. Merge a la rama principal ─────────────────────────────────────────────────
# Se trae lo último de $MainBranch y se fusiona la rama de trabajo con --no-ff
# para dejar un merge commit explícito del release. Ante cualquier error
# (conflicto, etc.) se aborta el merge y se vuelve a la rama original.
Write-Host "`nMerge de '$CurrentBranch' → '$MainBranch'..."
git checkout $MainBranch
git pull origin $MainBranch

git merge --no-ff $CurrentBranch -m "chore: release v$Version"
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Conflicto al fusionar en '$MainBranch'. Abortando el merge." -ForegroundColor Red
    git merge --abort
    git checkout $CurrentBranch
    Write-Host "Se volvió a '$CurrentBranch'. Resolvé los conflictos manualmente y reintentá." -ForegroundColor Red
    exit 1
}

Write-Host "Push de '$MainBranch'..."
git push origin $MainBranch

# Volver a la rama de trabajo original.
git checkout $CurrentBranch

# ── 5. Push del tag ──────────────────────────────────────────────────────────────
# El push del tag es lo que dispara el workflow de GitHub Actions, por eso va
# al final, una vez que ambas ramas ya están actualizadas en el remoto.
Write-Host "`nPush del tag 'v$Version'..."
git push origin "v$Version"

Write-Host "`nRelease v$Version completado: fusionado a '$MainBranch' y de vuelta en '$CurrentBranch'." -ForegroundColor Green
Write-Host "Ver progreso del build en GitHub Actions."
