ej# Script para actualizar automaticamente el cache-bust del CSS y hacer deploy
# Uso: .\update-cache.ps1

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  AUTO-DEPLOY CON CACHE-BUST" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Obtener la version actual del primer archivo HTML
$firstHtmlFile = Get-ChildItem "*.html" | Select-Object -First 1
$content = Get-Content $firstHtmlFile.FullName
$versionMatch = $content | Select-String 'styles\.css\?v=([\d.]+)' -AllMatches

$currentVersion = "2.1"
if ($versionMatch.Matches.Count -gt 0) {
    $currentVersion = $versionMatch.Matches[0].Groups[1].Value
}

# Incrementar la version (X.Y -> X.Y+1)
$versionParts = $currentVersion -split '\.'
[int]$minor = $versionParts[1]
$newVersion = "$($versionParts[0]).$($minor + 1)"

Write-Host "`nVersion anterior: $currentVersion" -ForegroundColor Yellow
Write-Host "Nueva version: $newVersion" -ForegroundColor Green

# Actualizar todos los archivos HTML
Write-Host "`nActualizando archivos HTML..." -ForegroundColor Cyan
$htmlFiles = Get-ChildItem "*.html"
$htmlFiles | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Encoding UTF8
    $updated = $content -replace "href=`"styles\.css\?v=[\d.]+`"", "href=`"styles.css?v=$newVersion`""
    $updated | Set-Content $filePath -Encoding UTF8
    Write-Host "  OK $($_.Name)" -ForegroundColor Green
}

# Hacer commit y push
Write-Host "`nHaciendo commit y push a GitHub..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Archivos agregados" -ForegroundColor Green
}

git commit -m "Update CSS cache to v$newVersion"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Commit realizado" -ForegroundColor Green
}

git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Push realizado" -ForegroundColor Green
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "OK DESPLEGADO EXITOSAMENTE A GITHUB PAGES" -ForegroundColor Green
Write-Host "  Los cambios estaran disponibles en 1-2 minutos" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "`nPresiona Ctrl+Shift+R en tu navegador para limpiar el cache" -ForegroundColor Cyan
