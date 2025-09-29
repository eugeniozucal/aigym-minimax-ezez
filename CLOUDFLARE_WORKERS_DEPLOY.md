# 🚀 Despliegue en Cloudflare Workers

## ✅ **Configuración Completa**
Tu aplicación está configurada para desplegarse automáticamente en Cloudflare Workers cuando hagas push a la branch `cloudflare`.

> **Nota**: Hemos configurado Cloudflare Workers (no Pages) según tu solicitud. Workers es ideal para aplicaciones serverless, mientras que Pages es más apropiado para aplicaciones frontend estáticas. Si prefieres Pages, podemos cambiar la configuración fácilmente.

## 📋 **Configuración Inicial**

### **1. Configurar Secrets en GitHub**
Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions y agrega:

```
CLOUDFLARE_API_TOKEN=tu_api_token_de_cloudflare
CLOUDFLARE_ACCOUNT_ID=tu_account_id_de_cloudflare
```

### **2. Variables de Entorno en Cloudflare Workers**
Configura las siguientes variables en tu Cloudflare Workers dashboard:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_supabase
VITE_ENVIRONMENT=production
```

## 🔧 **Comandos de Despliegue**

### **Desarrollo Local**
```bash
cd ai-gym-frontend
npm run dev
```

### **Build Local**
```bash
cd ai-gym-frontend
npm run build
```

### **Despliegue Manual**
```bash
cd ai-gym-frontend
npm run deploy        # Despliegue a desarrollo
npm run deploy:prod   # Despliegue a producción
```

### **Despliegue Automático**
El despliegue se activa automáticamente cuando haces push a la branch `cloudflare`.

## 📁 **Estructura de Archivos**

```
.github/
├── workflows/
│   └── deploy-cloudflare.yml    # Workflow de GitHub Actions

ai-gym-frontend/
├── wrangler.toml               # Configuración de Cloudflare Workers
├── workers-site/
│   └── index.js               # Handler para SPA routing
├── package.json               # Scripts de despliegue
├── dist/                      # Build de producción
└── src/                       # Código fuente
```

## 🔑 **Obtener las Credenciales de Cloudflare**

### **API Token**
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Crea un nuevo token con permisos para Workers
3. Copia el token generado

### **Account ID**
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Tu Account ID aparece en la parte inferior izquierda del dashboard

## 🌐 **URLs de la Aplicación**

Después del despliegue, tu aplicación estará disponible en:
- **URL de Workers**: `https://aigym-minimax-ezez-prod.tu-subdominio.workers.dev`
- **Login**: `/login`
- **Dashboard**: `/dashboard`
- **Training Zone**: `/training-zone`

## 🔄 **Flujo de Trabajo**

1. **Desarrollo**: Trabaja en tu branch local
2. **Testing**: Prueba localmente con `npm run dev`
3. **Push**: Cuando estés listo, haz push a la branch `cloudflare`
4. **Despliegue**: GitHub Actions desplegará automáticamente

## 🐛 **Solución de Problemas**

### **Error de Autenticación**
- Verifica que los secrets de GitHub estén configurados correctamente
- Asegúrate de que el API token tenga permisos para Workers

### **Error de Build**
- Ejecuta `npm run build` localmente para verificar
- Revisa los logs del workflow en GitHub Actions

### **Error de Variables de Entorno**
- Configura las variables en el dashboard de Cloudflare Workers
- Reinicia el worker después de cambiar variables

## ✅ **Verificación Post-Despliegue**

Después del despliegue, verifica:
- [ ] La página carga correctamente
- [ ] La conexión con Supabase funciona
- [ ] Las rutas protegidas funcionan
- [ ] El Training Zone es accesible

---

**¡Tu aplicación está lista para desplegarse automáticamente! 🎉**
