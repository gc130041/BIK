# BIK API Project

Documentación oficial para el backend del proyecto BIK. Esta API gestiona los recursos principales de la aplicación.

## 🚀 Setup Inicial

Sigue estos pasos para levantar el proyecto en tu entorno local.

### Prerrequisitos
*   [Node.js](https://nodejs.org/) (v14+) o [Python](https://www.python.org/) (3.8+)
*   Base de datos (MySQL/PostgreSQL/MongoDB) - *<Especificar aquí>*

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/gc130041/BIK.git
    cd BIK
    ```

2.  **Instalar dependencias:**
    
    *Para Node.js:*
    ```bash
    npm install
    ```
    *Para Python:*
    ```bash
    pip install -r requirements.txt
    ```

3.  **Variables de Entorno:**
    Crea un archivo `.env` en la raíz basado en el ejemplo (si existe) y configura:
    ```env
    PORT=3000
    DB_URI=tu_cadena_de_conexion
    JWT_SECRET=tu_secreto
    ```

4.  **Ejecutar el servidor:**
    ```bash
    # Modo desarrollo
    npm run dev  # o python main.py
    ```

---

## 📡 Documentación de Endpoints

URL Base: `http://localhost:3000/api`

### 🟢 Estado del Sistema
| Método | Endpoint | Descripción | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Verifica si el servidor está activo | No |

### 🔐 Autenticación (Auth)
| Método | Endpoint | Descripción | Body (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Iniciar sesión | `{ "email": "user@test.com", "password": "123" }` |
| `POST` | `/auth/register` | Registrar usuario | `{ "name": "User", "email": "...", "password": "..." }` |

### 📦 Recursos Principales (Ej. Productos/Items)
| Método | Endpoint | Descripción | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/items` | Listar todos los items | No |
| `GET` | `/items/:id` | Obtener un item por ID | No |
| `POST` | `/items` | Crear un nuevo item | **Sí** |
| `PUT` | `/items/:id` | Actualizar item | **Sí** |
| `DELETE`| `/items/:id` | Eliminar item | **Sí** |