#!/usr/bin/env node

// Script para build específico de Cloudflare Pages
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build para Cloudflare Pages...');

try {
  // 1. Limpiar archivos problemáticos temporalmente
  const problematicFiles = [
    'src/components/shared/NewPageBuilder.tsx',
    'src/components/shared/PageBuilder',
    'src/contexts/AuthContext.tsx',
    'src/pages/AnalyticsDashboard.tsx',
    'src/pages/EnhancedCommunitiesPage.tsx'
  ];

  const backupDir = 'temp-backup';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Hacer backup de archivos problemáticos
  problematicFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const backupPath = path.join(backupDir, path.basename(file));
      fs.copyFileSync(file, backupPath);
      console.log(`📦 Backup creado: ${file} -> ${backupPath}`);
    }
  });

  // 2. Ejecutar build
  console.log('🔨 Ejecutando build...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. Restaurar archivos
  console.log('🔄 Restaurando archivos...');
  problematicFiles.forEach(file => {
    const backupPath = path.join(backupDir, path.basename(file));
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, file);
      console.log(`↩️  Restaurado: ${file}`);
    }
  });

  // 4. Limpiar backup
  fs.rmSync(backupDir, { recursive: true, force: true });

  console.log('✅ Build completado exitosamente para Cloudflare Pages!');
  console.log('📁 Archivos de build en: dist/');

} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}
