## Banco Informático Kinal (BIK)

Esta documentación detalla la estructura, configuración y endpoints implementados en el ecosistema BIK. El sistema utiliza una arquitectura de microservicios distribuidos, comunicando un backend principal en **Node.js** con motores financieros y de auditoría en **C# .NET Core**.

---

## Requisitos del Sistema

Antes de comenzar, asegúrate de tener instalado lo siguiente:

* **Node.js:** v18+
* **MongoDB:** Última versión estable (Local o Atlas)
* **Docker y Docker Compose:** (Opcional, para contenerización)
* **pnpm:** 10.28.1 (Gestor de paquetes)
* **C# .NET Core SDK:** 8.0+ (Para servicios de core-banking y auditoría)
* **PostgreSQL:** (Motor de base de datos relacional para C#)

---

## 1. Stack Tecnológico y Dependencias

El proyecto distribuye sus responsabilidades en diferentes tecnologías:

* **Server Admin (Node.js / Express):** Actúa como API Gateway, gestiona usuarios, roles, seguridad (JWT, Argon2, Helmet), valida la lógica de negocio y se conecta a **MongoDB**.
* **Core Banking (.NET Core 8 / Entity Framework):** Motor financiero puro. Recibe instrucciones de Node.js, realiza los cálculos transaccionales y guarda los balances de forma relacional en **PostgreSQL**.
* **Audit Service (.NET Core 8):** Microservicio inmutable que registra la actividad crítica (quién, qué y cuándo) en su propia base de datos **PostgreSQL**.

---

## 2. Estructura de Carpetas del Proyecto

```text
BIK/
├── services/
│   ├── server-admin/              # Servidor administrativo y seguridad (Node.js)
│   ├── core-banking/              # Motor de transacciones y cuentas (.NET)
│   ├── currency-service/          # Microservicio de conversiones (Node.js)
│   ├── audit-service/             # Registro inmutable de eventos (.NET)
├── Postman/                       # Colección BIK-Postman_Collection.json
├── docker-compose.yml             # Orquestación
└── README.md                      # Documentación

```
---

## 3. Guía de Ejecución: Levantando el Ecosistema

Dado que el ecosistema se basa en microservicios, el orden de arranque y **la configuración exacta de los puertos es crítica** para que se comuniquen entre sí. Debes mantener 3 terminales abiertas.

### Paso 1: Variables de Entorno y Base de Datos

1. Asegúrate de que tus instancias de MongoDB y PostgreSQL estén corriendo.
2. Crea el archivo `.env` dentro de `services/server-admin/`:
```env
URI_MONGODB=mongodb://127.0.0.1:27017/bik_db
SECRET_KEY=TuClaveSuperSecretaBIK2026
PORT=3001
```



### Paso 2: Iniciar el Audit Service (.NET)

Este servicio debe estar escuchando para cuando el Core Banking quiera reportar un log.

1. Abre una terminal y dirígete a `services/audit-service`.
2. Aplica las migraciones: `dotnet ef database update`
3. Ejecuta el servidor: `dotnet run`
4. **⚠️ ATENCIÓN AL PUERTO:** Observa en la consola qué puerto asignó .NET (Por ejemplo, `http://localhost:5297`). Debes copiar ese puerto.

### Paso 3: Iniciar el Core Banking (.NET)

1. Abre una segunda terminal en `services/core-banking`.
2. Abre el archivo `appsettings.json` de esta carpeta y asegúrate de que la URL de auditoría tenga el puerto exacto del paso anterior (Ej: `"AuditServiceUrl": "http://localhost:5297/BIK/v1/Audit"`).
3. Aplica las migraciones: `dotnet ef database update`
4. Ejecuta el motor financiero: `dotnet run`
5. **⚠️ ATENCIÓN AL PUERTO:** Revisa en la consola en qué puerto levantó (usualmente `5000` o `5045`).

### Paso 4: Iniciar el Server Admin (Node.js)

Node.js enviará las peticiones HTTP a C#, por lo que necesita saber el puerto del Core Banking.

1. Abre una tercera terminal en `services/server-admin`.
2. Instala dependencias: `pnpm install`
3. Busca en tu código (`account.controller.js`, `deposit.controller.js`, `transaction.controller.js`) las llamadas a `axios.post()` y asegúrate de que apuntan al puerto de tu Core Banking (Ej: `http://localhost:5045/...`).
4. Levanta el servidor principal: `pnpm dev` (correrá en el puerto 3001).

---

## 4. API Endpoints y Flujo de Pruebas

El sistema BIK expone sus funcionalidades a través de dos servidores principales. Todas las operaciones de clientes y cajeros pasan por el **Server Admin (Node.js)**, el cual retransmite y sincroniza internamente con el Core Banking (.NET). Además, existe un acceso directo al **Audit Service (.NET)** para revisión de logs.

### 📋 Información General

* **Base URL Principal (Node.js):** `http://localhost:3001/BIK/v1`
* **Base URL Auditoría (C#):** `http://localhost:5297/BIK/v1` *(Nota: El puerto 5297 puede variar según tu entorno local, revisa tu terminal).*
* **Headers Comunes:**
  * `Content-Type`: `application/json`
  * `Authorization`: `Bearer <TU_TOKEN_JWT>` (Para todas las rutas marcadas con ✅ Token o ✅ Admin).

---

### 🔐 1. Autenticación (`/auth`)
*Gestión de acceso y perfiles. El sistema inicia con el usuario base `ADMINB`.*

| Método | Endpoint | Auth? | Descripción | Body (JSON) Sugerido |
|---|---|---|---|---|
| **POST** | `/auth/login` | ❌ No | Iniciar sesión y obtener Token JWT. | `{"email": "correo@mail.com", "password": "123"}` |
| **POST** | `/auth/register` | ❌ No | Registrar un nuevo usuario en el sistema. | `{"username": "cliente", "password": "123", "role": "USER_ROLE"}` |
| **GET** | `/auth/me` | ✅ Token | Obtener los datos del perfil actualmente logueado. | *N/A* |

---

### 👤 2. Usuarios (`/users`)
*Gestión de usuarios del sistema. **Todas** estas rutas requieren un token con rol de Administrador.*

| Método | Endpoint | Auth? | ¿Qué es el `:id`? | Descripción |
|---|---|---|---|---|
| **GET** | `/users` | ✅ Admin | N/A | Listar todos los usuarios registrados. |
| **GET** | `/users/:id` | ✅ Admin | **ID de Mongo** del usuario | Ver detalles de un usuario específico. |
| **PUT** | `/users/:id` | ✅ Admin | **ID de Mongo** del usuario | Actualizar la información del usuario. |
| **DELETE** | `/users/:id` | ✅ Admin | **ID de Mongo** del usuario | Eliminar (desactivar lógicamente) un usuario. |

---

### 💳 3. Cuentas (`/accounts`)
*Gestión de cuentas bancarias. Al crear una cuenta, Node.js la sincroniza automáticamente con el motor relacional de C#.*

| Método | Endpoint | Auth? | ¿Qué es el `:id`? | Descripción |
|---|---|---|---|---|
| **GET** | `/accounts` | ✅ Token | N/A | Listar todas las cuentas. |
| **GET** | `/accounts/:id` | ✅ Token | **ID de Mongo** de la cuenta | Ver detalles de una cuenta específica. |
| **POST** | `/accounts/:id` | ✅ Token | **ID de Mongo** del USUARIO | Crear y sincronizar una cuenta para ese usuario. |
| **PUT** | `/accounts/:id` | ✅ Token | **ID de Mongo** de la cuenta | Actualizar información de la cuenta. |
| **PUT** | `/accounts/:id/activate` | ✅ Token | **ID de Mongo** de la cuenta | Cambiar el estado de la cuenta a Activa. |
| **PUT** | `/accounts/:id/desactivate`| ✅ Token | **ID de Mongo** de la cuenta | Cambiar el estado de la cuenta a Inactiva. |

---

### 💰 4. Depósitos (`/deposits`)
*Inyección y consulta de ingresos. Dependiendo del rol, Node.js lo procesa como un ingreso en ventanilla (C# `deposit`) o como una transferencia local (C# `transfer`).*

| Método | Endpoint | Auth? | ¿Qué es el `:id` o `:accountId`? | Descripción |
|---|---|---|---|---|
| **POST** | `/deposits` | ✅ Token | N/A | Realizar un depósito hacia una cuenta. |
| **GET** | `/deposits/history/:accountId`| ✅ Token | **ID de Mongo** de la cuenta | Consultar el historial de depósitos recibidos. |
| **GET** | `/deposits/:id` | ✅ Token | **ID de Mongo** del depósito | Ver el detalle de un depósito específico. |

---

### 💸 5. Transacciones (`/transactions`)
*Movimientos de capital entre cuentas y pagos. Estas rutas evalúan los saldos y límites diarios antes de notificar al Core Banking en C#.*

| Método | Endpoint | Auth? | ¿Qué es el `:id` o `:accountId`? | Descripción |
|---|---|---|---|---|
| **POST** | `/transactions/transfer` | ✅ Token | N/A | Realizar una transferencia entre cuentas (P2P). |
| **POST** | `/transactions/pay-service` | ✅ Token | N/A | Pagar un servicio y descontar el saldo (Retiro). |
| **GET** | `/transactions/history/:accountId`|✅ Token| **ID de Mongo** de la cuenta | Historial de transacciones (entradas y salidas).|
| **GET** | `/transactions/:id` | ✅ Token | **ID de Mongo** de la transacc.| Ver detalle de una transacción individual. |

---

### 🛠️ 6. Servicios (`/services`)
*Catálogo de servicios pagables (Luz, Agua, Telefonía, etc.).*

| Método | Endpoint | Auth? | ¿Qué es el `:id` o `:status`? | Descripción |
|---|---|---|---|---|
| **GET** | `/services` | ❌ No | N/A | Listar todos los servicios disponibles. |
| **GET** | `/services/:id` | ❌ No | **ID de Mongo** del servicio | Ver detalles de un servicio específico. |
| **POST** | `/services` | ❌ No | N/A | Crear un nuevo servicio en el catálogo. |
| **PUT** | `/services/:id` | ❌ No | **ID de Mongo** del servicio | Actualizar la información del servicio. |
| **PUT** | `/services/:id/:status` | ❌ No | **ID** y **Estado** (`PENDING`, `COMPLETED`, `CANCELED`) | Cambiar el estado de pago/vigencia del servicio. |

---

### 📋 7. Auditoría Interna (Audit Service)
*Microservicio independiente en C#. Recibe reportes internos de forma automática, pero expone sus propios endpoints para consultar los logs de manera directa.*

* **Base URL:** `http://localhost:5297/BIK/v1/Audit` *(Puerto de ejemplo)*

| Método | Endpoint Completo | Descripción |
|---|---|---|
| **POST** | `/BIK/v1/Audit` | (Uso Interno) Recibe un log financiero e inserta el registro inmutable en PostgreSQL. |
| **GET** | `/BIK/v1/Audit` | Retorna el historial completo de eventos del ecosistema (hasta 100 registros, ordenados por fecha). |

---

## 5. Docker y Docker Compose

El proyecto cuenta con contenedores preconfigurados. Para levantar la base de datos PostgreSQL y otros servicios aislados sin instalarlos en tu máquina:

1. Levantar contenedores en segundo plano: `docker compose up -d`
2. Revisar logs: `docker compose logs -f`
3. Detener y borrar datos: `docker compose down -v`

---