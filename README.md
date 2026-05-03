# 🚀 Wuepa Jewerly Backend (API REST)
Backend del proyecto de Gestion de Proyectos Para Wuepa Jewerly

**Desarrollado por: IntegraSoft**

Este repositorio contiene el backend de **Wuepa**, una API REST construida con Node.js, Express y TypeScript que gestiona autenticación, usuarios y servicios para la tienda de accesorios.

El backend está diseñado para integrarse con Firebase Authentication y proveer una capa segura de lógica de negocio y persistencia de datos.

---

# 🧩 Funcionalidades principales

### 🔐 Autenticación (Firebase + Backend)

* Validación de tokens de Firebase (`verify-token`)
* Registro de usuarios en base de datos
* Creación automática de usuario si no existe
* Middleware de autenticación con JWT de Firebase

---

### 👤 Gestión de usuarios

* Obtener perfil (`GET /me`)
* Actualizar perfil (`PUT /me`)
* Eliminar cuenta (`DELETE /me`)

---

### 📧 Recuperación de contraseña

* Endpoint para envío de correo (Brevo)
* Generación de token de recuperación (opcional si no usas Firebase directo)

---

### 🛡️ Seguridad

* Middleware de autenticación (`authMiddleware`)
* Validación de headers Bearer Token
* Manejo centralizado de errores

---

### 🌐 API REST estructurada

* Arquitectura modular (controllers, routes, middlewares, dao)
* Separación clara de responsabilidades

---

# ⚙️ Tecnologías

* Node.js
* Express
* TypeScript
* Firebase Admin SDK
* Firestore
* JSON Web Tokens
* Brevo (envío de emails)

---

# 📁 Estructura del proyecto

```bash
api/
 ├── config/          # Configuración (Firebase, etc.)
 ├── controllers/     # Lógica de negocio
 ├── dao/             # Acceso a datos (Firestore)
 ├── middlewares/     # Auth, CORS, errores
 ├── routes/          # Rutas de la API
 ├── services/        # Servicios externos (email, etc.)
 └── index.ts         # Entry point
```

---

# 🔗 Endpoints principales

## 🔐 Auth

| Método | Endpoint                    | Descripción                    |
| ------ | --------------------------- | ------------------------------ |
| POST   | `/api/auth/register`        | Registro de usuario            |
| POST   | `/api/auth/verify-token`    | Login con token Firebase       |
| POST   | `/api/auth/forgot-password` | Envío de email de recuperación |

---

## 👤 Usuario (protegidas)

Requieren header:

```bash
Authorization: Bearer <token>
```

| Método | Endpoint        | Descripción       |
| ------ | --------------- | ----------------- |
| GET    | `/api/users/me` | Obtener perfil    |
| PUT    | `/api/users/me` | Actualizar perfil |
| DELETE | `/api/users/me` | Eliminar cuenta   |

---

## 🧪 Otros

| Endpoint | Descripción                         |
| -------- | ----------------------------------- |
| `/`      | Health check                        |
| `/debug` | Estado de variables y configuración |

---

# 🔐 Autenticación (flujo real)

### 1. Frontend (Firebase)

```ts
const token = await user.getIdToken();
```

### 2. Enviar al backend

```ts
Authorization: Bearer <token>
```

### 3. Backend

```ts
auth.verifyIdToken(token);
```

✔ Usuario validado
✔ Acceso autorizado

---

# ⚙️ Variables de entorno

Ejemplo `.env`:

```env
# Firebase
FIREBASE_PROJECT_ID=tu_proyecto
FIREBASE_SERVICE_ACCOUNT_KEY={JSON_COMPLETO}

# Backend
PORT=3000
NODE_ENV=production

# URLs
FRONTEND_URL=https://tu-frontend
BACKEND_URL=https://tu-backend

# Email (Brevo)
BREVO_API_KEY=tu_api_key
EMAIL_SENDER=tu_email

# JWT
JWT_SECRET=tu_secret
```

---

# 🚀 Cómo ejecutar (desarrollo)

### 1. Instalar dependencias

```bash
npm install
```
Build de producción
### 2. Build de producción

```bash
npm run build
```

### 3. Ejecutar build

```bash
npm run dev
```

---

# 🌍 Deploy

El proyecto está configurado para desplegarse en **Render**:

* Build Command:

```bash
npm install && npm run build
```

* Start Command:

```bash
node dist/index.js
```

⚠️ Importante:

* Configurar variables de entorno en Render
* Especialmente `FIREBASE_SERVICE_ACCOUNT_KEY`

---

# 🔗 Integración con frontend

El frontend:

* Usa Firebase Auth
* Obtiene el `idToken`
* Lo envía al backend

👉 Este backend:

* Valida el token
* Gestiona usuarios
* Protege rutas

---

# 🧪 Estado actual del proyecto

✔ Backend desplegado
✔ Firebase Admin configurado
✔ Autenticación funcional
✔ Endpoints listos
✔ Integración lista para frontend




# 📜 Scripts útiles

```bash
npm run dev       # Desarrollo
npm run build     # Compilar TypeScript
npm start         # Ejecutar producción
```

---

# 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama
3. Realiza cambios pequeños y claros
4. Envía un PR

---

# 📄 Licencia

MIT
