# Requerimientos para el Backend - API de Clientes

## 📋 Resumen
Necesito implementar endpoints para que los clientes externos puedan ver la información de sus proyectos en tiempo real. Los datos deben incluir: información del proyecto, máquinas asignadas con horas trabajadas, y áridos utilizados con cantidades.

---

## 🎯 Endpoints Requeridos

### 1. Obtener Todos los Proyectos Activos
```
GET /api/v1/client/proyectos
```

**Headers requeridos:**
```
Authorization: Bearer {jwt_token}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Proyectos obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "La Quinta Livetti",
      "estado": "EN PROGRESO",
      "descripcion": "Demoler casa retirar escombro extraer arboles tapar sangría y cámara séptica",
      "fecha_inicio": "2026-03-09",
      "ubicacion": "estancia vieja",
      "maquinas_asignadas": [
        {
          "nombre": "BOBCAT 2018 S650",
          "horas_trabajadas": 13.0
        },
        {
          "nombre": "EXCAVADORA 2023 XCMG E60",
          "horas_trabajadas": 15.0
        }
      ],
      "total_horas_maquinas": 28.0,
      "aridos_utilizados": [
        {
          "tipo": "Relleno",
          "cantidad": 80.00,
          "unidad": "m³",
          "cantidad_registros": 3
        }
      ],
      "total_aridos": 80.00
    }
  ],
  "total": 1
}
```

### 2. Obtener Proyecto Específico por ID
```
GET /api/v1/client/proyectos/{id}
```

**Headers requeridos:**
```
Authorization: Bearer {jwt_token}
```

**Parámetros de ruta:**
- `id` (integer): ID del proyecto

**Respuesta esperada:** (mismo formato que el array de proyectos, pero con un solo objeto en `data`)

---

## 📊 Estructura de Datos

### Proyecto (ClientProjectView)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | ID único del proyecto |
| `nombre` | string | Nombre del proyecto |
| `estado` | string | Estado del proyecto: "EN PROGRESO", "COMPLETADO", "PENDIENTE" |
| `descripcion` | string | Descripción detallada del trabajo |
| `fecha_inicio` | string (YYYY-MM-DD) | Fecha de inicio del proyecto |
| `ubicacion` | string | Ubicación física del proyecto |
| `maquinas_asignadas` | array | Lista de máquinas con horas trabajadas |
| `total_horas_maquinas` | float | Suma total de horas de todas las máquinas |
| `aridos_utilizados` | array | Lista de áridos utilizados agrupados por tipo |
| `total_aridos` | float | Suma total de áridos (en m³) |

### Máquina Asignada (ClientMaquinaView)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre/modelo de la máquina |
| `horas_trabajadas` | float | Total de horas trabajadas en el proyecto |

### Árido Utilizado (ClientAridoView)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tipo` | string | Tipo de árido (ej: "Relleno", "Arena", etc.) |
| `cantidad` | float | Cantidad total utilizada |
| `unidad` | string | Unidad de medida (ej: "m³", "kg", etc.) |
| `cantidad_registros` | integer | Número de registros/entregas de este árido |

---

## 🔍 Lógica de Negocio

### Para el endpoint GET /api/v1/client/proyectos

1. **Filtrar proyectos activos**: `WHERE proyectos.estado = true`

2. **Obtener máquinas asignadas**:
   - JOIN entre tablas: `proyectos` → `proyecto_maquina` → `maquinas`
   - Agrupar por máquina y sumar horas: `SUM(proyecto_maquina.horas_uso)`
   - Formato: `{ nombre: "BOBCAT 2018 S650", horas_trabajadas: 13.0 }`

3. **Calcular total de horas**:
   - Sumar todas las `horas_trabajadas` de las máquinas asignadas

4. **Obtener áridos utilizados**:
   - JOIN entre tablas: `proyectos` → `proyecto_arido` → `aridos`
   - Agrupar por tipo de árido: `GROUP BY aridos.tipo_arido, aridos.unidad`
   - Sumar cantidades: `SUM(proyecto_arido.cantidad)`
   - Contar registros: `COUNT(proyecto_arido.id)`
   - Formato: `{ tipo: "Relleno", cantidad: 80.0, unidad: "m³", cantidad_registros: 3 }`

5. **Calcular total de áridos**:
   - Sumar todas las `cantidad` de los áridos utilizados

6. **Mapear estado del proyecto**:
   - Si `proyecto.estado == true` → "EN PROGRESO"
   - Si `proyecto.estado == false` → "COMPLETADO"

### Para el endpoint GET /api/v1/client/proyectos/{id}

La misma lógica que el endpoint anterior, pero filtrando por un proyecto específico:
- `WHERE proyectos.id = {id} AND proyectos.estado = true`
- Devolver error 404 si no se encuentra el proyecto

---

## 🗄️ Consultas SQL de Referencia

### Obtener máquinas por proyecto
```sql
SELECT
    m.nombre,
    SUM(pm.horas_uso) as horas_trabajadas
FROM maquinas m
INNER JOIN proyecto_maquina pm ON pm.maquina_id = m.id
WHERE pm.proyecto_id = ?
GROUP BY m.id, m.nombre
```

### Obtener áridos por proyecto
```sql
SELECT
    a.tipo_arido as tipo,
    SUM(pa.cantidad) as cantidad,
    a.unidad,
    COUNT(pa.id) as cantidad_registros
FROM aridos a
INNER JOIN proyecto_arido pa ON pa.arido_id = a.id
WHERE pa.proyecto_id = ?
GROUP BY a.tipo_arido, a.unidad
```

---

## 🔐 Seguridad

1. **Autenticación JWT**: Todos los endpoints requieren token válido
2. **Autorización**: Los clientes solo deben ver proyectos asignados a ellos
3. **Validación**: Validar que el `id` del proyecto sea un número entero positivo
4. **Rate Limiting**: Implementar límite de peticiones (ej: 100 req/min por token)

---

## ✅ Criterios de Aceptación

- [ ] Los endpoints devuelven el formato JSON exacto especificado
- [ ] Las máquinas se agrupan correctamente y suman las horas totales
- [ ] Los áridos se agrupan por tipo y suman las cantidades correctamente
- [ ] El campo `estado` devuelve texto legible ("EN PROGRESO", "COMPLETADO")
- [ ] La fecha está en formato YYYY-MM-DD
- [ ] Los totales (`total_horas_maquinas`, `total_aridos`) se calculan correctamente
- [ ] Se valida el token JWT en cada petición
- [ ] Devuelve error 401 si el token es inválido
- [ ] Devuelve error 404 si el proyecto no existe
- [ ] Devuelve error 403 si el cliente no tiene permisos para ver el proyecto

---

## 🧪 Casos de Prueba

### Caso 1: Obtener todos los proyectos (exitoso)
```bash
curl -X GET "http://localhost:8000/api/v1/client/proyectos" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Resultado esperado:** Status 200, array de proyectos con todos los campos

### Caso 2: Obtener proyecto específico (exitoso)
```bash
curl -X GET "http://localhost:8000/api/v1/client/proyectos/1" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Resultado esperado:** Status 200, objeto de proyecto con todos los campos

### Caso 3: Sin token de autenticación
```bash
curl -X GET "http://localhost:8000/api/v1/client/proyectos"
```

**Resultado esperado:** Status 401 Unauthorized

### Caso 4: Proyecto no existe
```bash
curl -X GET "http://localhost:8000/api/v1/client/proyectos/99999" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Resultado esperado:** Status 404 Not Found

---

## 📦 Dependencias Sugeridas (FastAPI/Python)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
```

---

## 💡 Ejemplo de Implementación (FastAPI)

```python
@router.get("/client/proyectos/{proyecto_id}")
async def get_client_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_jwt_token)
):
    # 1. Buscar proyecto
    proyecto = db.query(Proyecto).filter(
        Proyecto.id == proyecto_id,
        Proyecto.estado == True
    ).first()

    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # 2. Obtener máquinas con horas
    maquinas = db.query(
        Maquina.nombre,
        func.sum(ProyectoMaquina.horas_uso).label('horas_trabajadas')
    ).join(ProyectoMaquina).filter(
        ProyectoMaquina.proyecto_id == proyecto_id
    ).group_by(Maquina.nombre).all()

    maquinas_list = [
        {"nombre": m.nombre, "horas_trabajadas": float(m.horas_trabajadas or 0)}
        for m in maquinas
    ]

    total_horas = sum(m["horas_trabajadas"] for m in maquinas_list)

    # 3. Obtener áridos agrupados
    aridos = db.query(
        Arido.tipo_arido,
        func.sum(ProyectoArido.cantidad).label('cantidad'),
        Arido.unidad,
        func.count(ProyectoArido.id).label('registros')
    ).join(ProyectoArido).filter(
        ProyectoArido.proyecto_id == proyecto_id
    ).group_by(Arido.tipo_arido, Arido.unidad).all()

    aridos_list = [
        {
            "tipo": a.tipo_arido,
            "cantidad": float(a.cantidad or 0),
            "unidad": a.unidad,
            "cantidad_registros": int(a.registros)
        }
        for a in aridos
    ]

    total_aridos = sum(a["cantidad"] for a in aridos_list)

    # 4. Construir respuesta
    return {
        "success": True,
        "message": "Proyecto obtenido exitosamente",
        "data": {
            "id": proyecto.id,
            "nombre": proyecto.nombre,
            "estado": "EN PROGRESO" if proyecto.estado else "COMPLETADO",
            "descripcion": proyecto.descripcion or "",
            "fecha_inicio": proyecto.fecha_inicio.strftime("%Y-%m-%d"),
            "ubicacion": proyecto.ubicacion or "",
            "maquinas_asignadas": maquinas_list,
            "total_horas_maquinas": total_horas,
            "aridos_utilizados": aridos_list,
            "total_aridos": total_aridos
        }
    }
```

---

## 🚀 Orden de Implementación Sugerido

1. Crear modelos Pydantic para las respuestas
2. Implementar endpoint GET /api/v1/client/proyectos/{id} (más simple)
3. Probar con datos reales
4. Implementar endpoint GET /api/v1/client/proyectos (similar pero con array)
5. Agregar validaciones y manejo de errores
6. Implementar rate limiting
7. Documentar en Swagger
8. Agregar tests unitarios

---

## 📞 Contacto
Si tienes dudas sobre la estructura de datos o necesitas más ejemplos, por favor pregunta.
