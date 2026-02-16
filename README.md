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

A continuación se listan las rutas disponibles, organizadas por módulo.

### A. Autenticación (`/auth`)

Controlador: `src/auth/auth.controller.js`

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| **POST** | `/auth/login` | Inicia sesión y devuelve un token JWT. Requiere `username` y `password`. | Público |
| **POST** | `/auth/register` | Registra un nuevo usuario cliente. Cifra la contraseña antes de guardar. | Público |
| **GET** | `/auth/me` | Devuelve la información del usuario autenticado actual. | Privado (Token) |

### B. Gestión de Usuarios (`/users`)

Controlador: `src/Users/user.controller.js`
*Nota: Este módulo permite la administración completa de perfiles.*

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| **GET** | `/users/` | Lista todos los usuarios activos del sistema con paginación. | Admin |
| **GET** | `/users/:id` | Obtiene los detalles de un usuario específico por su ID. | Admin |
| **PUT** | `/users/:id` | Actualiza la información de un usuario. Si se envía contraseña, la vuelve a cifrar. | Admin |
| **DELETE** | `/users/:id` | Realiza un eliminado lógico (soft delete) cambiando el estado del usuario a inactivo. | Admin |

### C. Transacciones y Operaciones (`/transactions`)

Controlador: `src/Transactions/transaction.controller.js`
*Nota: Implementa atomicidad en base de datos para garantizar la integridad financiera.*

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| **POST** | `/transactions/transfer` | Realiza una transferencia monetaria entre cuentas. Valida fondos, límites (Max Q2000/envío, Max Q100/día acumulado) y actualiza saldos atómicamente. | Privado |
| **POST** | `/transactions/pay-service` | Procesa el pago de un servicio. Descuenta el saldo y genera el registro del servicio y la transacción. | Privado |
| **GET** | `/transactions/history/:accountId` | Obtiene el historial de transacciones (entrantes y salientes) de una cuenta específica. | Privado |
| **GET** | `/transactions/:id` | Obtiene el detalle de una transacción específica por su ID. | Privado |

### D. Otros Módulos (Estructura Base)

El proyecto cuenta con la estructura para los siguientes módulos, los cuales se integran con las operaciones principales:

* **Cuentas (`/accounts`):** Modelos definidos para manejar número de cuenta, saldo (`earningsM`) y propietario.
* **Servicios (`/services`):** Estructura para registrar los tipos de servicios pagados.
* **Depósitos (`/deposits`):** Controladores base para la gestión de ingresos de capital.

---

## 5. Modelos de Datos (Schemas Principales)

Breve descripción de los campos clave en la base de datos:

* **User:** `username`, `password` (hash), `role` (ADMIN_ROLE/USER_ROLE), `status`.
* **Account:** `numberAccount` (único), `nameAccount`, `earningsM` (saldo), `user` (referencia), `isActive`.
* **Transaction:** `sourceAccount`, `destinationAccount`, `amount`, `transactionType` (TRANSFERENCIA/PAGO_SERVICIO), `date`, `status`.
* **Service:** `nameService`, `typeService`, `amount`, `status`.
