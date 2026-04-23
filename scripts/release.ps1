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
git add android/app/build.gradle src/config/version.ts
git commit -m "chore: bump version to $Version"
git tag "v$Version"
git push origin HEAD
git push origin "v$Version"

Write-Host "Release v$Version iniciado. Ver progreso en GitHub Actions."
