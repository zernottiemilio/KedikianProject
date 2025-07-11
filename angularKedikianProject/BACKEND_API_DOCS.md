# Documentación de Integración Backend OAuth2

## Endpoint de Login

### URL
```
POST http://localhost:8000/api/v1/login
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
```

### Body (OAuth2PasswordRequestForm con Base64)
```
username=YWRtaW4=&password=MTIzNDU2
```

**Nota:** El usuario y contraseña se envían codificados en base64.
- `usuario` → `YWRtaW4=`
- `contraseña` → `MTIzNDU2`

### Respuesta Exitosa (200 OK)
```json
{
  "id": "1",
  "nombreUsuario": "usuario",
  "rol": "administrador",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Respuesta de Error (401 Unauthorized)
```json
{
  "detail": "Incorrect username or password"
}
```

## Estructura de Usuario Esperada

El frontend espera que el backend devuelva un objeto con la siguiente estructura:

```typescript
interface Usuario {
  id: string;
  nombreUsuario: string;
  rol: 'administrador' | 'operario';
  token?: string;
}
```

## Implementación en Backend (Python/FastAPI)

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

app = FastAPI()

class Usuario(BaseModel):
    id: str
    nombreUsuario: str
    rol: str
    token: str

import base64

@app.post("/api/v1/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Decodificar usuario y contraseña de base64
    try:
        username = base64.b64decode(form_data.username).decode('utf-8')
        password = base64.b64decode(form_data.password).decode('utf-8')
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 encoding"
        )
    
    # Validar credenciales
    if not validar_credenciales(username, password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Obtener usuario de la base de datos
    usuario = obtener_usuario(username)
    
    # Generar token
    token = generar_token(usuario)
    
    return Usuario(
        id=usuario.id,
        nombreUsuario=usuario.nombreUsuario,
        rol=usuario.rol,
        token=token
    )
```

## Flujo de Autenticación

1. El usuario ingresa sus credenciales en el formulario de login
2. El frontend envía los datos como `application/x-www-form-urlencoded`
3. El backend valida las credenciales usando OAuth2PasswordRequestForm
4. Si son válidas, devuelve el usuario con su token
5. El frontend guarda el usuario en localStorage y actualiza el estado
6. El usuario es redirigido según su rol

## Manejo de Errores

- **401**: Credenciales incorrectas
- **0**: Error de conexión (servidor no disponible)
- **500**: Error interno del servidor

## Headers de Autorización

Para requests posteriores que requieran autenticación, el frontend enviará:

```
Authorization: Bearer <token>
```

El token se obtiene del usuario almacenado en localStorage. 