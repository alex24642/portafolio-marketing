#!/bin/bash
# Script para actualizar automáticamente el cache-bust del CSS y hacer push
# Uso en Windows PowerShell: .\deploy.ps1
# Uso en Mac/Linux: ./deploy.sh

# Obtener la versión actual
currentVersion=$(grep -oP 'styles\.css\?v=\K[\d.]+' index.html | head -1)

# Si no encuentra versión, usar 2.1 por defecto
if [ -z "$currentVersion" ]; then
    currentVersion="2.1"
fi

# Incrementar la versión
IFS='.' read -r major minor <<< "$currentVersion"
newVersion="$major.$((minor + 1))"

echo "Actualizando cache-bust de CSS..."
echo "Versión anterior: $currentVersion"
echo "Nueva versión: $newVersion"

# Actualizar todos los archivos HTML
for file in *.html; do
    sed -i "s/styles\.css?v=[0-9.]\+/styles.css?v=$newVersion/g" "$file"
    echo "✓ Actualizado: $file"
done

echo ""
echo "Haciendo commit y push..."

git add -A
git commit -m "Update CSS cache to v$newVersion"
git push origin main

echo "✓ Desplegado exitosamente a GitHub Pages"
