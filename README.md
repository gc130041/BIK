## Banco Informático Kinal (BIK)

Esta documentación detalla la estructura, configuración y endpoints implementados hasta la fecha en el servidor administrativo (`server-admin`). El sistema está construido sobre **Node.js** con **Express** y **MongoDB**.

## 1. Stack Tecnológico y Dependencias

El proyecto utiliza las siguientes tecnologías clave para su funcionamiento:

* **Runtime:** Node.js
* **Framework:** Express.js
* **Base de Datos:** MongoDB (con Mongoose como ODM)
* **Seguridad:**
* `argon2`: Para el hashing y verificación de contraseñas.
* `jsonwebtoken`: Para la generación y validación de tokens de sesión (JWT).
* `helmet`: Para la protección de cabeceras HTTP.


* **Validación:** `express-validator` para la sanitización y validación de datos de entrada.
* **Utilidades:** `cors`, `dotenv`, `morgan`.

## 2. Configuración y Base de Datos

### Conexión a Base de Datos (`configs/db.js`)

El sistema gestiona la conexión a MongoDB con manejo de eventos para monitorear el estado (conectado, desconectado, error). Incluye una función de cierre controlado (`gracefulShutdown`) para terminar conexiones correctamente al cerrar el servidor.

### Seeding Inicial (`configs/admin.seed.js`)

Al iniciar la aplicación, se ejecuta un script automático que verifica la existencia de un administrador. Si no existe, crea el usuario base:

* **Username:** ADMINB
* **Password:** ADMINB (Cifrada con Argon2)
* **Rol:** ADMIN_ROLE

## 3. Módulos de Seguridad (Middleware y Utils)

### Utilidades

* **Encriptación (`src/utils/encrypt.js`):** Contiene funciones para `encrypt` (hash) y `verifyPassword` (comprobación) usando Argon2.
* **JWT (`src/utils/jwt.js`):** Genera tokens firmados con una clave secreta, incluyendo el `uid`, `username` y `role` en el payload. Expiración configurada a 4 horas.

### Middlewares

* **Validar JWT (`middlewares/validate-jwt.js`):** Intercepta las peticiones, extrae el token del header `Authorization`, lo verifica y adjunta el usuario correspondiente a la `request`.
* **Validar Roles (`middlewares/validate-roles.js`):** Verifica si el usuario autenticado posee uno de los roles permitidos para acceder a la ruta.
* **Validar Campos (`middlewares/check-validators.js`):** Recolecta los errores generados por `express-validator` y responde con un estatus 400 si la validación falla.

---

## 4. API Endpoints (Rutas y Funciones)


### 📋 Información General

* **Base URL:** `http://localhost:3001/BIK/v1`
* **Headers Comunes:**
* `Content-Type`: `application/json`
* `Authorization`: `Bearer <TU_TOKEN_JWT>` (Solo para rutas privadas)
---

Para obtener y aplicar el token de autenticación en Postman y así poder realizar peticiones a las rutas protegidas, sigue estos pasos:

### 1. Obtención del Token (Login)

Para generar un token válido, primero debes autenticarte con un usuario existente.

* **Método:** `POST`
* **URL:** `http://localhost:3001/BIK/v1/auth/login`
* **Body (JSON):** Envía las credenciales del usuario.
```json
{
    "email": "tu-correo@ejemplo.com",
    "password": "tu-password"
}

```


* **Respuesta:** El servidor te devolverá un objeto JSON que contiene una propiedad llamada `token`. **Copia ese valor** (sin las comillas).

---

### 2. Aplicación del Token en Peticiones Protegidas

Una vez que tengas el token, debes incluirlo en cada petición que lo requiera (marcadas con "✅ Token" en la documentación).

#### Opción A: Pestaña "Authorization" (Recomendado)

1. En Postman, selecciona la pestaña **Auth** o **Authorization**.
2. En el menú desplegable **Type**, selecciona **Bearer Token**.
3. En el campo de la derecha llamado **Token**, pega el código que copiaste anteriormente.

#### Opción B: Pestaña "Headers" (Manual)

Si prefieres hacerlo manualmente, ve a la pestaña **Headers** y agrega la siguiente entrada:

* **Key:** `Authorization`
* **Value:** `TU_TOKEN_AQUÍ`

---

### 3. Verificación

Si el token se aplicó correctamente, al intentar acceder a una ruta protegida como `/auth/me`, el servidor te devolverá la información del usuario en lugar de un error `401 Unauthorized` o `500`.

---

### 🔐 1. Autenticación (Auth)

*Gestión de acceso y perfiles.*

| Método | Endpoint Completo | Auth? | ¿Qué es el `:id`? | Descripción | Body (JSON) Sugerido |
| --- | --- | --- | --- | --- | --- |
| **POST** | `/auth/register` | ❌ No | N/A | Registrar un nuevo cliente. | `{"name": "Ana", "surname": "Lopez", "username": "analo", "email": "ana@mail.com", "password": "123456", "phone": "55554444"}` |
| **POST** | `/auth/login` | ❌ No | N/A | Iniciar sesión y obtener Token. | `{"email": "ana@mail.com", "password": "123456"}` |
| **GET** | `/auth/me` | ✅ Token | N/A | Obtener datos del perfil logueado. | *N/A* |

---

### 👤 2. Usuarios (Users)

*Gestión de usuarios del sistema (Requiere Rol ADMIN).*

| Método | Endpoint Completo | Auth? | ¿Qué es el `:id`? | Descripción | Body (JSON) Sugerido |
| --- | --- | --- | --- | --- | --- |
| **GET** | `/users` | ✅ Admin | N/A | Listar todos los usuarios. | *N/A* |
| **GET** | `/users/:id` | ✅ Admin | **ID del Usuario** | Ver detalle de un usuario. | *N/A* |
| **PUT** | `/users/:id` | ✅ Admin | **ID del Usuario** | Actualizar datos de usuario. | `{"name": "Ana María", "phone": "11223344"}` |
| **DELETE** | `/users/:id` | ✅ Admin | **ID del Usuario** | Eliminar (desactivar) usuario. | *N/A* |

---

### 💳 3. Cuentas (Accounts)

*Gestión de cuentas bancarias.*

| Método | Endpoint Completo | Auth? | ¿Qué es el `:id`? | Descripción | Body (JSON) Sugerido |
| --- | --- | --- | --- | --- | --- |
| **GET** | `/accounts` | ✅ Token | N/A | Listar todas las cuentas. | *N/A* |
| **GET** | `/accounts/:id` | ✅ Token | **ID de Cuenta** | Ver detalle de una cuenta. | *N/A* |
| **POST** | `/accounts/:id` | ✅ Token | **ID del Usuario** (Dueño) | Crear cuenta a un usuario específico. | `{"dpi": "1234567890101", "typeAcount": "Ahorro", "nameAccount": "Ahorro Navidad", "email": "ana@mail.com", "phoneNumber": "55554444"}` |
| **PUT** | `/accounts/:id` | ✅ Token | **ID de Cuenta** | Actualizar info de la cuenta. | `{"nameAccount": "Cuenta Principal"}` |
| **PUT** | `/accounts/:id/activate` | ✅ Token | **ID de Cuenta** | Activar una cuenta. | *N/A* |
| **PUT** | `/accounts/:id/desactivate` | ✅ Token | **ID de Cuenta** | Desactivar una cuenta. | *N/A* |

---

### 🛠️ 4. Servicios (Services)

*Catálogo de servicios pagables (Luz, Agua, etc.).*

| Método | Endpoint Completo | Auth? | ¿Qué es el `:id`? | Descripción | Body (JSON) Sugerido |
| --- | --- | --- | --- | --- | --- |
| **GET** | `/services` | ✅ Token | N/A | Listar servicios disponibles. | *N/A* |
| **POST** | `/services` | ✅ Token | N/A | Crear nuevo servicio en el sistema. | `{"nameService": "Pago de servicios", "typeService": "Internet", "numberAccountPay": "INT-9988", "methodPayment": "Bancaria", "amounth": 250}` |
| **GET** | `/services/:id` | ✅ Token | **ID de Servicio** | Ver un servicio específico. | *N/A* |
| **PUT** | `/services/:id` | ✅ Token | **ID de Servicio** | Editar servicio. | `{"amounth": 300}` |
| **PUT** | `/services/:id/:status` | ✅ Token | **ID de Servicio** y **Estado** | Cambiar estado (PENDING, COMPLETED, CANCELED). | *N/A* (El estado va en la URL, ej: `/services/ID/CANCELED`) |

---

### 💰 5. Depósitos (Deposits)

*Ingreso de dinero a cuentas.*

| Método | Endpoint Completo | Auth? | ¿Qué es el `:id`? | Descripción | Body (JSON) Sugerido |
|--------|------------------|-------|------------------|------------|----------------------|
| **POST** | `/deposits` | ✅ Token | N/A | **ADMIN:** Suma dinero (Ventanilla).<br>**CLIENT:** Transfiere de su cuenta a destino. | `{"accountId":"ID_CUENTA_DESTINO","amount":500,"description":"Abono"}` |
| **GET** | `/deposits/history/:accountId` | ✅ Token | ID de Cuenta | Ver historial de depósitos recibidos. | N/A |
| **GET** | `/deposits/:id` | ✅ Token | ID de Depósito | Ver detalle de un depósito. | N/A |

---

### 💸 6. Transacciones (Transactions)

*Movimientos de dinero (Transferencias y Pagos).*

| Método | Endpoint Completo | Auth? | ¿Qué es el `:id`? | Descripción | Body (JSON) Sugerido |
| --- | --- | --- | --- | --- | --- |
| **POST** | `/transactions/transfer` | ✅ Token | N/A | Transferencia entre cuentas. | `{"sourceAccount": "ID_CUENTA_ORIGEN", "destinationAccount": "ID_CUENTA_DESTINO", "amount": 100, "description": "Regalo"}` |
| **POST** | `/transactions/pay-service` | ✅ Token | N/A | Pagar un servicio del catálogo. | `{"sourceAccount": "ID_CUENTA_ORIGEN", "serviceId": "ID_DEL_SERVICIO", "amount": 250}` |
| **GET** | `/transactions/history/:accountId` | ✅ Token | **ID de Cuenta** | Historial de transacciones de una cuenta. | *N/A* |
| **GET** | `/transactions/:id` | ✅ Token | **ID de Transacción** | Ver detalle de una transacción. | *N/A* |

---

### 💡 Notas Importantes para el Frontend/QA

1. **IDs:** Cuando dice "ID", se refiere siempre al **`_id` de MongoDB** (cadena de 24 caracteres, ej: `65d1f2a...`), NO al número de cuenta o DPI.
2. **Roles:**
* Si usas el endpoint `/deposits` con un token de **ADMIN**, el dinero se crea.
* Si lo usas con token de **CLIENTE**, el dinero se descuenta de la cuenta del usuario logueado.


3. **Fechas:** Todas las fechas se generan automáticamente en el servidor.
