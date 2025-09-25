#!/bin/bash

# Script de build para Cloudflare Pages
# Asegura que se use npm en lugar de pnpm

echo "🚀 Iniciando build para Cloudflare Pages..."
echo "📦 Usando npm como package manager"

# Cambiar al directorio del frontend
cd ai-gym-frontend

# Instalar dependencias con npm
echo "📥 Instalando dependencias..."
npm install

# Limpiar archivos temporales
echo "🧹 Limpiando archivos temporales..."
rm -rf node_modules/.vite-temp

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npx tsc -b

# Build de producción con Vite
echo "🏗️  Ejecutando build de producción..."
npm run build

echo "✅ Build completado exitosamente!"
echo "📁 Archivos de build en: dist/"
