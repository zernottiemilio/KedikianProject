# Especificaciones para Implementación Backend - Notas y Próximo Mantenimiento

## Resumen

Este documento describe la implementación necesaria en el backend para soportar las funcionalidades de **Notas de Máquinas** y **Próximo Mantenimiento** que actualmente están en localStorage en el frontend.

---

## 1. Cambios en Base de Datos

### 1.1 Nueva Tabla: `notas_maquinas`

Crear una nueva tabla para almacenar las notas asociadas a cada máquina.

```sql
CREATE TABLE notas_maquinas (
    id SERIAL PRIMARY KEY,
    maquina_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    usuario VARCHAR(100) DEFAULT 'Usuario',
    fecha TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_nota_maquina
        FOREIGN KEY (maquina_id)
        REFERENCES maquinas(id)
        ON DELETE CASCADE
);

-- Índice para mejorar consultas por máquina
CREATE INDEX idx_notas_maquina_id ON notas_maquinas(maquina_id);

-- Índice para ordenar por fecha
CREATE INDEX idx_notas_fecha ON notas_maquinas(fecha DESC);
```

**Campos:**
- `id`: Identificador único de la nota (PK, auto-increment)
- `maquina_id`: ID de la máquina (FK a tabla maquinas, con CASCADE DELETE)
- `texto`: Contenido de la nota (TEXT, NOT NULL)
- `usuario`: Usuario que creó la nota (VARCHAR, DEFAULT 'Usuario')
- `fecha`: Fecha y hora de creación de la nota (TIMESTAMP, NOT NULL)
- `created_at`: Timestamp de creación del registro
- `updated_at`: Timestamp de última actualización

### 1.2 Modificar Tabla: `maquinas`

Agregar un nuevo campo a la tabla de máquinas para almacenar las horas del próximo mantenimiento personalizado.

```sql
ALTER TABLE maquinas
ADD COLUMN proximo_mantenimiento INTEGER NULL;
```

**Campo:**
- `proximo_mantenimiento`: Horas para el próximo mantenimiento (INTEGER, NULLABLE)
  - `NULL` significa que se usa el cálculo automático (última_hora_mantenimiento + 250)
  - Si tiene valor, es el valor personalizado por el usuario

---

## 2. Modelos/ORM

### 2.1 Modelo `NotaMaquina`

Crear un nuevo modelo para la tabla `notas_maquinas`:

```python
# Ejemplo en Python/SQLAlchemy
class NotaMaquina(Base):
    __tablename__ = 'notas_maquinas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    maquina_id = Column(Integer, ForeignKey('maquinas.id', ondelete='CASCADE'), nullable=False)
    texto = Column(Text, nullable=False)
    usuario = Column(String(100), default='Usuario')
    fecha = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con Maquina
    maquina = relationship("Maquina", back_populates="notas")
```

### 2.2 Actualizar Modelo `Maquina`

Agregar el campo `proximo_mantenimiento` al modelo existente:

```python
class Maquina(Base):
    __tablename__ = 'maquinas'

    id = Column(Integer, primary_key=True)
    codigo = Column(String(50))
    nombre = Column(String(200))
    horas_uso = Column(Integer, default=0)
    proximo_mantenimiento = Column(Integer, nullable=True)  # NUEVO CAMPO

    # Relación con notas
    notas = relationship("NotaMaquina", back_populates="maquina", cascade="all, delete-orphan")
```

---

## 3. Endpoints a Crear

### 3.1 Listar Notas de una Máquina

**Endpoint:** `GET /api/v1/maquinas/{maquina_id}/notas`

**Descripción:** Obtiene todas las notas de una máquina específica, ordenadas por fecha descendente (más recientes primero).

**Parámetros:**
- `maquina_id` (path): ID de la máquina

**Response 200 OK:**
```json
[
  {
    "id": 123,
    "maquina_id": 5,
    "texto": "Se realizó cambio de aceite",
    "fecha": "2025-11-07T10:30:00Z",
    "usuario": "Usuario"
  },
  {
    "id": 122,
    "maquina_id": 5,
    "texto": "Revisar nivel de refrigerante",
    "fecha": "2025-11-05T15:20:00Z",
    "usuario": "Usuario"
  }
]
```

**Response 404 Not Found:**
```json
{
  "message": "Máquina no encontrada"
}
```

**Lógica:**
1. Verificar que la máquina existe
2. Buscar todas las notas con `maquina_id` igual al parámetro
3. Ordenar por `fecha` descendente
4. Retornar array (puede estar vacío si no hay notas)

---

### 3.2 Crear Nota

**Endpoint:** `POST /api/v1/maquinas/{maquina_id}/notas`

**Descripción:** Crea una nueva nota para una máquina específica.

**Parámetros:**
- `maquina_id` (path): ID de la máquina

**Request Body:**
```json
{
  "texto": "Se realizó mantenimiento preventivo completo"
}
```

**Response 201 Created:**
```json
{
  "id": 124,
  "maquina_id": 5,
  "texto": "Se realizó mantenimiento preventivo completo",
  "fecha": "2025-11-07T14:25:30Z",
  "usuario": "Usuario"
}
```

**Response 400 Bad Request:**
```json
{
  "message": "El campo 'texto' es requerido"
}
```

**Response 404 Not Found:**
```json
{
  "message": "Máquina no encontrada"
}
```

**Lógica:**
1. Verificar que la máquina existe
2. Validar que el campo `texto` no esté vacío
3. Crear nota con:
   - `maquina_id`: del path param
   - `texto`: del request body
   - `usuario`: 'Usuario' (hardcoded por ahora)
   - `fecha`: timestamp actual del servidor
4. Guardar en base de datos
5. Retornar la nota creada con todos los campos

---

### 3.3 Eliminar Nota

**Endpoint:** `DELETE /api/v1/maquinas/notas/{nota_id}`

**Descripción:** Elimina una nota específica.

**Parámetros:**
- `nota_id` (path): ID de la nota a eliminar

**Response 204 No Content:**
(Sin body, solo status code)

**Response 404 Not Found:**
```json
{
  "message": "Nota no encontrada"
}
```

**Lógica:**
1. Buscar la nota por `id`
2. Si no existe, retornar 404
3. Si existe, eliminarla
4. Retornar 204 (sin contenido)

---

### 3.4 Actualizar Próximo Mantenimiento

**Endpoint:** `PUT /api/v1/maquinas/{maquina_id}/proximo-mantenimiento`

**Descripción:** Actualiza las horas del próximo mantenimiento de una máquina.

**Parámetros:**
- `maquina_id` (path): ID de la máquina

**Request Body:**
```json
{
  "horas": 3500
}
```

**Response 200 OK:**
```json
{
  "id": 5,
  "codigo": "MAQ-005",
  "nombre": "Excavadora CAT 320",
  "horas_uso": 3250,
  "proximo_mantenimiento": 3500
}
```

**Response 400 Bad Request:**
```json
{
  "message": "El campo 'horas' debe ser un número positivo"
}
```

**Response 404 Not Found:**
```json
{
  "message": "Máquina no encontrada"
}
```

**Lógica:**
1. Verificar que la máquina existe
2. Validar que `horas` sea un número entero positivo
3. Actualizar el campo `proximo_mantenimiento` de la máquina
4. Retornar la máquina actualizada con todos sus campos

**Nota:** Si se quiere resetear al cálculo automático, enviar `null`:
```json
{
  "horas": null
}
```

---

## 4. Modificar Endpoints Existentes

### 4.1 GET /api/v1/maquinas

**Cambio:** Incluir el campo `proximo_mantenimiento` en la respuesta.

**Response Antes:**
```json
[
  {
    "id": 1,
    "codigo": "MAQ-001",
    "nombre": "Excavadora CAT 320",
    "horas_uso": 1250
  }
]
```

**Response Después:**
```json
[
  {
    "id": 1,
    "codigo": "MAQ-001",
    "nombre": "Excavadora CAT 320",
    "horas_uso": 1250,
    "proximo_mantenimiento": 2500
  },
  {
    "id": 2,
    "codigo": "MAQ-002",
    "nombre": "Pala Cargadora",
    "horas_uso": 800,
    "proximo_mantenimiento": null
  }
]
```

### 4.2 GET /api/v1/maquinas/{id}

**Cambio:** Incluir el campo `proximo_mantenimiento` en la respuesta.

**Response:**
```json
{
  "id": 1,
  "codigo": "MAQ-001",
  "nombre": "Excavadora CAT 320",
  "horas_uso": 1250,
  "proximo_mantenimiento": 2500
}
```

---

## 5. Validaciones Necesarias

### 5.1 Para Notas

1. **Texto requerido:** El campo `texto` no puede estar vacío
2. **Longitud mínima:** El texto debe tener al menos 3 caracteres
3. **Máquina existente:** La `maquina_id` debe corresponder a una máquina existente
4. **Eliminación:** Solo se puede eliminar una nota que existe

### 5.2 Para Próximo Mantenimiento

1. **Valor positivo:** Si se proporciona un valor, debe ser un número entero positivo mayor a 0
2. **Máquina existente:** La `maquina_id` debe corresponder a una máquina existente
3. **Lógica de negocio (opcional):** Puede validar que el próximo mantenimiento sea mayor a las horas actuales de uso (esto lo hace el frontend, pero se puede agregar en backend como seguridad adicional)

---

## 6. Comportamiento del Sistema

### 6.1 Cálculo de Próximo Mantenimiento

El frontend calcula el próximo mantenimiento con la siguiente lógica:

```
SI maquina.proximo_mantenimiento NO es NULL:
    usar maquina.proximo_mantenimiento
SINO:
    usar (última_hora_mantenimiento + 250)
```

Por lo tanto:
- Si `proximo_mantenimiento` es `NULL` → El frontend calcula automáticamente
- Si `proximo_mantenimiento` tiene un valor → El frontend usa ese valor (personalizado por el usuario)

### 6.2 Eliminación en Cascada

Cuando se elimina una máquina, todas sus notas deben eliminarse automáticamente (CASCADE DELETE en la FK).

### 6.3 Ordenamiento de Notas

Las notas deben retornarse ordenadas por fecha descendente (más recientes primero) para que el frontend las muestre correctamente.

---

## 7. Ejemplos de Uso Completo

### Ejemplo 1: Crear y listar notas

```bash
# 1. Crear una nota
POST /api/v1/maquinas/5/notas
{
  "texto": "Se cambió el filtro de aceite"
}

# 2. Listar notas de la máquina
GET /api/v1/maquinas/5/notas
Response:
[
  {
    "id": 125,
    "maquina_id": 5,
    "texto": "Se cambió el filtro de aceite",
    "fecha": "2025-11-07T15:00:00Z",
    "usuario": "Usuario"
  }
]

# 3. Eliminar la nota
DELETE /api/v1/maquinas/notas/125
Response: 204 No Content
```

### Ejemplo 2: Actualizar próximo mantenimiento

```bash
# 1. Obtener máquina actual
GET /api/v1/maquinas/5
Response:
{
  "id": 5,
  "codigo": "MAQ-005",
  "nombre": "Excavadora",
  "horas_uso": 3200,
  "proximo_mantenimiento": null
}

# 2. Actualizar próximo mantenimiento a 3500 horas
PUT /api/v1/maquinas/5/proximo-mantenimiento
{
  "horas": 3500
}

Response:
{
  "id": 5,
  "codigo": "MAQ-005",
  "nombre": "Excavadora",
  "horas_uso": 3200,
  "proximo_mantenimiento": 3500
}

# 3. Resetear a cálculo automático (opcional)
PUT /api/v1/maquinas/5/proximo-mantenimiento
{
  "horas": null
}

Response:
{
  "id": 5,
  "codigo": "MAQ-005",
  "nombre": "Excavadora",
  "horas_uso": 3200,
  "proximo_mantenimiento": null
}
```

---

## 8. Checklist de Implementación

### Base de Datos
- [ ] Crear tabla `notas_maquinas` con los campos especificados
- [ ] Agregar FK con CASCADE DELETE a la tabla `maquinas`
- [ ] Crear índices en `maquina_id` y `fecha`
- [ ] Agregar campo `proximo_mantenimiento` a tabla `maquinas`

### Modelos
- [ ] Crear modelo `NotaMaquina`
- [ ] Actualizar modelo `Maquina` con campo `proximo_mantenimiento`
- [ ] Configurar relaciones entre modelos (si aplica)

### Endpoints - Notas
- [ ] Implementar `GET /api/v1/maquinas/{maquina_id}/notas`
- [ ] Implementar `POST /api/v1/maquinas/{maquina_id}/notas`
- [ ] Implementar `DELETE /api/v1/maquinas/notas/{nota_id}`
- [ ] Agregar validaciones para cada endpoint

### Endpoints - Próximo Mantenimiento
- [ ] Implementar `PUT /api/v1/maquinas/{maquina_id}/proximo-mantenimiento`
- [ ] Agregar validaciones

### Endpoints Existentes
- [ ] Actualizar `GET /api/v1/maquinas` para incluir `proximo_mantenimiento`
- [ ] Actualizar `GET /api/v1/maquinas/{id}` para incluir `proximo_mantenimiento`

### Testing
- [ ] Probar creación de notas
- [ ] Probar listado de notas
- [ ] Probar eliminación de notas
- [ ] Probar eliminación en cascada (al eliminar máquina)
- [ ] Probar actualización de próximo mantenimiento
- [ ] Probar validaciones
- [ ] Probar casos edge (máquina sin notas, valores NULL, etc.)

---

## 9. Notas Técnicas Adicionales

### Timestamps
- Todas las fechas deben estar en formato ISO 8601 (UTC)
- El backend debe generar automáticamente el timestamp al crear notas
- Ejemplo: `"2025-11-07T15:30:00Z"`

### CORS
- Asegurarse de que los nuevos endpoints permitan solicitudes desde el frontend Angular
- Los endpoints deben aceptar: GET, POST, PUT, DELETE según corresponda

### Errores
- Usar códigos HTTP estándar:
  - 200: OK (GET, PUT exitosos)
  - 201: Created (POST exitoso)
  - 204: No Content (DELETE exitoso)
  - 400: Bad Request (validación fallida)
  - 404: Not Found (recurso no encontrado)
  - 500: Internal Server Error (error del servidor)

### Seguridad
- Validar que la `maquina_id` en los endpoints de notas corresponda a una máquina existente
- Prevenir inyección SQL usando ORM o prepared statements
- Validar longitud máxima de texto en notas (por ejemplo, 5000 caracteres)

---

## 10. Migración de Datos Existentes (Opcional)

Si hay datos en localStorage que se quieren migrar al backend:

1. El usuario puede exportar los datos de localStorage desde la consola del navegador:
```javascript
console.log(localStorage.getItem('notas_maquinas'));
console.log(localStorage.getItem('proximos_mantenimientos'));
```

2. Procesar estos datos y crear un script de migración para insertarlos en la base de datos

**Nota:** Esto es opcional, ya que los datos de localStorage son locales a cada navegador/dispositivo.
