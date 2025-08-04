# 📊 Technical Assessment Backend

Una API REST completa para gestión de pronósticos, alertas y notificaciones desarrollada con Node.js, TypeScript, Express y Prisma.

## 🚀 Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución
- **TypeScript** - Lenguaje de programación
- **Express.js** - Framework web
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos (via Docker)
- **JWT** - Autenticación
- **Swagger** - Documentación de API
- **Docker** - Contenedorización

## 📁 Estructura del Proyecto

```
julianpinto15-technical-assessment/
├── app.ts                    # Configuración principal de Express
├── docker-compose.yml        # Configuración de Docker
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración de TypeScript
├── prisma/                  # Configuración de base de datos
│   ├── schema.prisma        # Esquema de la base de datos
│   └── migrations/          # Migraciones de BD
├── public/                  # Archivos estáticos
├── routes/                  # Definición de rutas
├── src/
│   ├── config/             # Configuraciones (JWT, etc.)
│   ├── controllers/        # Controladores de la API
│   ├── services/           # Lógica de negocio
│   ├── middlewares/        # Middlewares personalizados
│   ├── models/             # DTOs y modelos
│   ├── interface/          # Interfaces TypeScript
│   ├── types/              # Definiciones de tipos
│   └── utils/              # Utilidades y helpers
```

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/julianpinto15-technical-assessment.git
cd julianpinto15-technical-assessment
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/technical_assessment"
JWT_SECRET="tu_jwt_secret_key"
JWT_REFRESH_SECRET="tu_jwt_refresh_secret_key"
PORT=3000
```

### 4. Ejecutar migraciones de Prisma

```bash
# Generar el cliente de Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# (Opcional) Seed de datos iniciales
npx prisma db seed
```

### 6. Iniciar el servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 🧪 Pruebas con Postman

### 1. Autenticación

**POST** `http://localhost:3000/api/auth/login`

**Cuerpo de la petición:**
```json
{
  "email": "santiago@gmail.com",
  "password": "password123"
}
```

**Respuesta esperada (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> ⚠️ **Importante:** Copia el `accessToken` y agrégalo como Bearer Token en todas las siguientes peticiones.

### 2. Configuración de Pronósticos

**POST** `http://localhost:3000/api/forecast/config`

**Headers:**
```
Authorization: Bearer tu_access_token_aquí
```

**Cuerpo de la petición:**
```json
{
  "forecastHorizon": [1, 2, 3],
  "confidenceLevels": [0.90],
  "alertThresholds": {
    "minThreshold": 50,
    "maxThreshold": 150,
    "metric": "precision",
    "condition": "below"
  },
  "notificationSettings": {
    "email": true,
    "sms": true
  }
}
```

> 💡 **Tip:** Puedes modificar `minThreshold`, `maxThreshold` y `metric` según tus necesidades.

### 3. Simulación de Pronósticos

**POST** `http://localhost:3000/api/forecast/simulate`

**Headers:**
```
Authorization: Bearer tu_access_token_aquí
```

**Cuerpo de la petición:**
```json
{
  "sku": "PR0D008"
}
```

> 📝 Puedes usar cualquier SKU para la simulación.

### 4. Gestión de Alertas

#### Crear Alerta
**POST** `http://localhost:3000/api/alerts`

**Headers:**
```
Authorization: Bearer tu_access_token_aquí
```

**Cuerpo de la petición:**
```json
{
  "sku": "PR0D008",
  "metric": "precision",
  "minThreshold": 0.5,
  "maxThreshold": 0.8,
  "condition": "above"
}
```

#### Obtener Alertas
**GET** `http://localhost:3000/api/alerts`

**Headers:**
```
Authorization: Bearer tu_access_token_aquí
```

### 5. Dashboard y Métricas

#### Notificaciones
**GET** `http://localhost:3000/api/dashboard/notifications`

#### Historial de Pronósticos
**GET** `http://localhost:3000/api/forecast/history?sku=PR0D008`

#### Métricas de Pronósticos
**GET** `http://localhost:3000/api/forecast/metrics?sku=PR0D008`

#### Dashboard General
**GET** `http://localhost:3000/api/dashboard?startDate=2024-01-01&endDate=2024-01-31`

**Respuesta esperada:**
```json
{
  "userCount": 4,
  "forecastCount": 12,
  "alertCount": 3,
  "avgPrecision": 0.9
}
```

## 📚 Documentación de API

Una vez que el servidor esté en funcionamiento, puedes acceder a la documentación interactiva de Swagger en:

```
http://localhost:3000/api-docs
```

## 🛠️ Scripts Disponibles

- `npm start` - Ejecuta la aplicación en modo producción
- `npm run dev` - Ejecuta la aplicación en modo desarrollo con hot-reload
- `npm run build` - Compila el proyecto TypeScript


## 📋 Características Principales

- ✅ **Autenticación JWT** - Sistema seguro de autenticación
- ✅ **Gestión de Pronósticos** - Simulación y configuración de pronósticos
- ✅ **Sistema de Alertas** - Creación y gestión de alertas personalizadas
- ✅ **Dashboard** - Métricas y estadísticas en tiempo real
- ✅ **Validación de Datos** - Validación robusta con express-validator
- ✅ **Documentación Swagger** - API completamente documentada
- ✅ **Base de Datos** - Persistencia con PostgreSQL y Prisma
- ✅ **TypeScript** - Tipado estático para mayor robustez

---

**Desarrollado por:** Julián Pinto  
**Versión:** 1.0.0
