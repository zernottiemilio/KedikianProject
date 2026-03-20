# Endpoints para Vista de Clientes

Este documento describe los endpoints necesarios para mostrar la información de proyectos a los clientes.

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante JWT Token.

### 1. Generar Token
```http
POST /api/v1/auth/token?system_name={nombre_sistema}&secret={secreto_compartido}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

## 📊 Endpoints de Proyectos para Clientes

### 2. Obtener Todos los Proyectos Activos
```http
GET /api/v1/client/proyectos
Authorization: Bearer {token}
```

**Respuesta:**
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
          "horas_trabajadas": 13
        },
        {
          "nombre": "EXCAVADORA 2023 XCMG E60",
          "horas_trabajadas": 15
        }
      ],
      "total_horas_maquinas": 28,
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

### 3. Obtener Proyecto Específico
```http
GET /api/v1/client/proyectos/{id}
Authorization: Bearer {token}
```

**Parámetros:**
- `id`: ID del proyecto (número)

**Respuesta:**
```json
{
  "success": true,
  "message": "Proyecto obtenido exitosamente",
  "data": {
    "id": 1,
    "nombre": "La Quinta Livetti",
    "estado": "EN PROGRESO",
    "descripcion": "Demoler casa retirar escombro extraer arboles tapar sangría y cámara séptica",
    "fecha_inicio": "2026-03-09",
    "ubicacion": "estancia vieja",
    "maquinas_asignadas": [
      {
        "nombre": "BOBCAT 2018 S650",
        "horas_trabajadas": 13
      },
      {
        "nombre": "EXCAVADORA 2023 XCMG E60",
        "horas_trabajadas": 15
      }
    ],
    "total_horas_maquinas": 28,
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
}
```

---

## 🔧 Implementación en el Backend (FastAPI/Python)

### Modelo de datos para la respuesta

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ClientMaquinaView(BaseModel):
    nombre: str
    horas_trabajadas: float

class ClientAridoView(BaseModel):
    tipo: str
    cantidad: float
    unidad: str
    cantidad_registros: int

class ClientProjectView(BaseModel):
    id: int
    nombre: str
    estado: str  # "EN PROGRESO", "COMPLETADO", "PENDIENTE"
    descripcion: str
    fecha_inicio: str
    ubicacion: str
    maquinas_asignadas: List[ClientMaquinaView]
    total_horas_maquinas: float
    aridos_utilizados: List[ClientAridoView]
    total_aridos: float
```

### Endpoint para obtener todos los proyectos

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

router = APIRouter(prefix="/api/v1/client", tags=["Client API"])

@router.get("/proyectos", response_model=dict)
async def get_client_proyectos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_external_user)
):
    """
    Obtiene todos los proyectos activos con información resumida para clientes
    """
    try:
        # Obtener proyectos activos
        proyectos = db.query(Proyecto).filter(Proyecto.estado == True).all()

        proyectos_data = []
        for proyecto in proyectos:
            # Obtener máquinas asignadas
            maquinas = db.query(
                Maquina.nombre,
                func.sum(ProyectoMaquina.horas_uso).label('horas_trabajadas')
            ).join(
                ProyectoMaquina, ProyectoMaquina.maquina_id == Maquina.id
            ).filter(
                ProyectoMaquina.proyecto_id == proyecto.id
            ).group_by(Maquina.id, Maquina.nombre).all()

            maquinas_list = [
                {
                    "nombre": m.nombre,
                    "horas_trabajadas": float(m.horas_trabajadas or 0)
                }
                for m in maquinas
            ]

            total_horas = sum(m["horas_trabajadas"] for m in maquinas_list)

            # Obtener áridos utilizados
            aridos = db.query(
                Arido.tipo_arido,
                func.sum(ProyectoArido.cantidad).label('cantidad_total'),
                Arido.unidad,
                func.count(ProyectoArido.id).label('cantidad_registros')
            ).join(
                ProyectoArido, ProyectoArido.arido_id == Arido.id
            ).filter(
                ProyectoArido.proyecto_id == proyecto.id
            ).group_by(Arido.tipo_arido, Arido.unidad).all()

            aridos_list = [
                {
                    "tipo": a.tipo_arido,
                    "cantidad": float(a.cantidad_total or 0),
                    "unidad": a.unidad,
                    "cantidad_registros": int(a.cantidad_registros)
                }
                for a in aridos
            ]

            total_aridos = sum(a["cantidad"] for a in aridos_list)

            # Determinar estado legible
            if proyecto.estado:
                estado_texto = "EN PROGRESO"
            else:
                estado_texto = "COMPLETADO"

            proyectos_data.append({
                "id": proyecto.id,
                "nombre": proyecto.nombre,
                "estado": estado_texto,
                "descripcion": proyecto.descripcion or "",
                "fecha_inicio": proyecto.fecha_inicio.strftime("%Y-%m-%d") if proyecto.fecha_inicio else "",
                "ubicacion": proyecto.ubicacion or "",
                "maquinas_asignadas": maquinas_list,
                "total_horas_maquinas": total_horas,
                "aridos_utilizados": aridos_list,
                "total_aridos": total_aridos
            })

        return {
            "success": True,
            "message": "Proyectos obtenidos exitosamente",
            "data": proyectos_data,
            "total": len(proyectos_data)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/proyectos/{proyecto_id}", response_model=dict)
async def get_client_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_external_user)
):
    """
    Obtiene un proyecto específico con toda su información para clientes
    """
    try:
        # Obtener proyecto
        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()

        if not proyecto:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")

        # Obtener máquinas asignadas
        maquinas = db.query(
            Maquina.nombre,
            func.sum(ProyectoMaquina.horas_uso).label('horas_trabajadas')
        ).join(
            ProyectoMaquina, ProyectoMaquina.maquina_id == Maquina.id
        ).filter(
            ProyectoMaquina.proyecto_id == proyecto.id
        ).group_by(Maquina.id, Maquina.nombre).all()

        maquinas_list = [
            {
                "nombre": m.nombre,
                "horas_trabajadas": float(m.horas_trabajadas or 0)
            }
            for m in maquinas
        ]

        total_horas = sum(m["horas_trabajadas"] for m in maquinas_list)

        # Obtener áridos utilizados
        aridos = db.query(
            Arido.tipo_arido,
            func.sum(ProyectoArido.cantidad).label('cantidad_total'),
            Arido.unidad,
            func.count(ProyectoArido.id).label('cantidad_registros')
        ).join(
            ProyectoArido, ProyectoArido.arido_id == Arido.id
        ).filter(
            ProyectoArido.proyecto_id == proyecto.id
        ).group_by(Arido.tipo_arido, Arido.unidad).all()

        aridos_list = [
            {
                "tipo": a.tipo_arido,
                "cantidad": float(a.cantidad_total or 0),
                "unidad": a.unidad,
                "cantidad_registros": int(a.cantidad_registros)
            }
            for a in aridos
        ]

        total_aridos = sum(a["cantidad"] for a in aridos_list)

        # Determinar estado legible
        if proyecto.estado:
            estado_texto = "EN PROGRESO"
        else:
            estado_texto = "COMPLETADO"

        proyecto_data = {
            "id": proyecto.id,
            "nombre": proyecto.nombre,
            "estado": estado_texto,
            "descripcion": proyecto.descripcion or "",
            "fecha_inicio": proyecto.fecha_inicio.strftime("%Y-%m-%d") if proyecto.fecha_inicio else "",
            "ubicacion": proyecto.ubicacion or "",
            "maquinas_asignadas": maquinas_list,
            "total_horas_maquinas": total_horas,
            "aridos_utilizados": aridos_list,
            "total_aridos": total_aridos
        }

        return {
            "success": True,
            "message": "Proyecto obtenido exitosamente",
            "data": proyecto_data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 💻 Uso en Angular (Frontend para Clientes)

### Ejemplo de componente para mostrar un proyecto

```typescript
import { Component, OnInit } from '@angular/core';
import { ExternalApiService } from './core/services/external-api.service';
import { ClientProjectView } from './core/models/external-api.models';

@Component({
  selector: 'app-client-project-view',
  template: `
    <div class="project-card" *ngIf="proyecto">
      <!-- Header -->
      <div class="project-header">
        <h1>{{ proyecto.nombre }}</h1>
        <span class="status-badge" [class.en-progreso]="proyecto.estado === 'EN PROGRESO'">
          {{ proyecto.estado }}
        </span>
      </div>

      <!-- Descripción -->
      <div class="section">
        <h3>DESCRIPCIÓN</h3>
        <p>{{ proyecto.descripcion }}</p>
      </div>

      <!-- Máquinas Asignadas -->
      <div class="section">
        <h3>🚜 MÁQUINAS ASIGNADAS</h3>
        <div class="maquinas-list">
          <div class="maquina-item" *ngFor="let maquina of proyecto.maquinas_asignadas">
            <span class="maquina-nombre">{{ maquina.nombre }}</span>
            <span class="maquina-horas">{{ maquina.horas_trabajadas }}h</span>
          </div>
        </div>
        <div class="total-box">
          <strong>Total horas registradas: {{ proyecto.total_horas_maquinas }}h</strong>
        </div>
      </div>

      <!-- Fecha de Inicio -->
      <div class="section">
        <h3>📅 INICIO</h3>
        <p>{{ proyecto.fecha_inicio | date:'dd/MM/yyyy' }}</p>
      </div>

      <!-- Ubicación -->
      <div class="section">
        <h3>📍 UBICACIÓN</h3>
        <p>{{ proyecto.ubicacion }}</p>
      </div>

      <!-- Áridos Utilizados -->
      <div class="section">
        <h3>🏔️ ÁRIDOS UTILIZADOS</h3>
        <div class="aridos-list">
          <div class="arido-item" *ngFor="let arido of proyecto.aridos_utilizados">
            <span class="arido-tipo">{{ arido.tipo }}</span>
            <span class="arido-cantidad">
              {{ arido.cantidad | number:'1.2-2' }} {{ arido.unidad }}
              <small>({{ arido.cantidad_registros }} registros)</small>
            </span>
          </div>
        </div>
        <div class="total-box">
          <strong>Total áridos: {{ proyecto.total_aridos | number:'1.2-2' }} m³</strong>
        </div>
      </div>
    </div>
  `
})
export class ClientProjectViewComponent implements OnInit {
  proyecto: ClientProjectView | null = null;
  loading = false;
  error = '';

  constructor(private externalApiService: ExternalApiService) {}

  ngOnInit(): void {
    this.loadProjecto(1); // Cargar proyecto con ID 1
  }

  loadProjecto(id: number): void {
    this.loading = true;
    this.externalApiService.getClientProyecto(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.proyecto = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar el proyecto';
        this.loading = false;
        console.error(error);
      }
    });
  }
}
```

---

## 🔑 Flujo de Autenticación

1. **Cliente solicita token**:
   ```typescript
   this.externalApiService.generateToken('nombre_sistema', 'secreto').subscribe(
     response => {
       // Token guardado automáticamente en el servicio
       console.log('Token generado:', response.access_token);
     }
   );
   ```

2. **Cliente consulta proyectos**:
   ```typescript
   this.externalApiService.getClientProyectos().subscribe(
     response => {
       console.log('Proyectos:', response.data);
     }
   );
   ```

---

## 📝 Notas Importantes

1. **Seguridad**: Los tokens tienen una expiración (expires_in). Implementar renovación automática.

2. **Datos en tiempo real**: Considera implementar WebSockets o polling para actualizaciones automáticas.

3. **Permisos**: Los clientes solo deben ver proyectos asociados a su cuenta (implementar filtrado por cliente en el backend).

4. **Caché**: El servicio ExternalApiService mantiene un log de llamadas para debugging.

5. **Estados del proyecto**:
   - `EN PROGRESO`: proyecto.estado === true
   - `COMPLETADO`: proyecto.estado === false
   - `PENDIENTE`: (si se implementa)

---

## ✅ Checklist de Implementación Backend

- [ ] Crear modelos de datos (ClientProjectView, ClientMaquinaView, ClientAridoView)
- [ ] Implementar endpoint GET /api/v1/client/proyectos
- [ ] Implementar endpoint GET /api/v1/client/proyectos/{id}
- [ ] Agregar middleware de autenticación JWT
- [ ] Filtrar proyectos por cliente (si aplica)
- [ ] Agregar tests unitarios
- [ ] Documentar API con Swagger/OpenAPI
- [ ] Implementar rate limiting
- [ ] Configurar CORS para el dominio del cliente

---

## 🎨 Ejemplo de Estilos CSS

```css
.project-card {
  max-width: 900px;
  margin: 20px auto;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.status-badge.en-progreso {
  background-color: #d4edda;
  color: #155724;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  color: #333;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 15px;
  text-transform: uppercase;
}

.maquina-item, .arido-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.total-box {
  margin-top: 15px;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 8px;
  text-align: center;
  font-size: 18px;
}
```
