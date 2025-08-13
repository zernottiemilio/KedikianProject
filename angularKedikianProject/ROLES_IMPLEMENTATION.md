# Sistema de Roles Implementado

## Descripción General

Se ha implementado un sistema completo de validación de roles para el sistema de Retroexcavadoras y Áridos. El sistema ahora valida que los usuarios tengan los permisos adecuados antes de acceder a las funcionalidades.

## Roles Disponibles

### 1. Administrador (`administrador`)
- **Acceso completo** a todas las funcionalidades del sistema
- **Puede gestionar** proyectos, máquinas, operarios, inventario, balance, áridos, informes
- **Puede importar** datos desde Excel
- **Acceso al dashboard** principal

### 2. Operario (`operario`)
- **Acceso limitado** solo al dashboard principal
- **No puede acceder** a funciones de gestión administrativa
- **Puede ver** información básica del sistema

## Componentes Implementados

### Guards de Seguridad

#### `AuthRoleGuard` (Principal)
- Valida tanto autenticación como roles
- Se usa en todas las rutas protegidas
- Redirige automáticamente según el rol del usuario

#### `RoleGuard` (Específico para roles)
- Solo valida roles (asume que el usuario ya está autenticado)
- Útil para validaciones adicionales en componentes

#### `AuthGuard` (Legacy)
- Solo valida autenticación
- Mantenido para compatibilidad

### Servicios

#### `NavigationService`
- Maneja la navegación basada en roles
- Proporciona métodos para verificar permisos
- Obtiene rutas disponibles según el rol

#### `AuthService` (Modificado)
- Ahora obtiene información real del usuario desde el backend
- Valida roles durante el login
- Maneja tokens de autenticación

### Componentes de UI

#### `SidebarComponent` (Modificado)
- Muestra solo las opciones disponibles según el rol
- Filtra elementos de navegación automáticamente
- Adapta la interfaz según los permisos del usuario

#### `AccessDeniedComponent` (Nuevo)
- Muestra mensajes de acceso denegado
- Proporciona opciones de navegación alternativa
- Interfaz amigable para el usuario

## Configuración de Rutas

### Rutas Públicas
```typescript
{ path: 'login', component: LoginComponent }
```

### Rutas Protegidas (Solo Autenticados)
```typescript
{ path: 'dashboard', component: MainContentComponent }
```

### Rutas Solo para Administradores
```typescript
{ 
  path: 'gestion-proyectos', 
  component: ProjectGestionComponent,
  data: { role: 'administrador' }
}
```

## Flujo de Autenticación

1. **Login**: Usuario ingresa credenciales
2. **Validación Backend**: Se verifica usuario/contraseña
3. **Obtención de Rol**: Se obtiene el rol real del usuario
4. **Validación de Rol**: Se verifica que el rol sea válido
5. **Redirección**: Se redirige según el rol y permisos
6. **Navegación**: Solo se muestran opciones permitidas

## Uso en Componentes

### Verificar Permisos
```typescript
constructor(
  private authService: AuthService,
  private navigationService: NavigationService
) {}

// Verificar si puede acceder a una funcionalidad
canAccessFeature(): boolean {
  return this.authService.hasRole('administrador');
}

// Obtener rutas disponibles
getAvailableRoutes(): string[] {
  return this.navigationService.getAvailableRoutes();
}
```

### Proteger Contenido en Templates
```html
<div *ngIf="authService.esAdministrador()">
  <!-- Contenido solo para administradores -->
</div>

<div *ngIf="authService.esOperario()">
  <!-- Contenido solo para operarios -->
</div>
```

## Configuración del Backend

Para que el sistema funcione completamente, el backend debe implementar:

### Endpoint de Login
```
POST /auth/login
Body: username (base64), password (base64)
Response: { access_token: string, token_type: string }
```

### Endpoint de Información del Usuario
```
GET /auth/me
Headers: Authorization: Bearer {token}
Response: { id: string, nombreUsuario: string, rol: 'administrador' | 'operario' }
```

## Seguridad

- **Validación en Frontend**: Interfaz adaptativa según permisos
- **Validación en Backend**: Verificación de tokens y roles
- **Guards de Ruta**: Protección a nivel de navegación
- **Interceptores**: Validación automática de autenticación

## Mantenimiento

### Agregar Nuevos Roles
1. Actualizar la interfaz `Usuario` en `auth.service.ts`
2. Agregar métodos de validación en `AuthService`
3. Configurar rutas con nuevos roles
4. Actualizar el sidebar y navegación

### Agregar Nuevas Funcionalidades
1. Definir el rol requerido en la configuración de la ruta
2. Actualizar el sidebar si es necesario
3. Verificar permisos en el componente
4. Probar con diferentes roles de usuario

## Testing

Para probar el sistema:

1. **Login como Administrador**: Debe ver todas las opciones
2. **Login como Operario**: Debe ver solo el dashboard
3. **Acceso Directo a URLs**: Debe ser redirigido según permisos
4. **Logout**: Debe limpiar sesión y redirigir al login

## Logs y Debugging

El sistema incluye logs detallados para debugging:
- 🔒 Verificación de guards
- 🎯 Roles requeridos
- 👤 Usuario actual
- ✅/❌ Resultados de validación

Revisar la consola del navegador para información detallada del flujo de autenticación.
