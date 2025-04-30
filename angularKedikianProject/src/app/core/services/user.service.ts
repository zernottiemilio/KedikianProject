import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // Adjust this URL according to your backend
};

interface User {
  id: number;
  nombre: string;
  email: string;
  hash_contrasena?: string;
  estado: boolean;
  roles: string;
  fecha_creacion: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    // Por ahora, mientras no tienes la DB conectada, puedes usar datos de prueba
    // Cuando conectes la DB, descomenta la línea que sigue y elimina los datos de prueba
    // return this.http.get<User[]>(this.apiUrl);

    // Datos de prueba para desarrollo sin backend
    const mockUsers: User[] = [
      {
        id: 1,
        nombre: 'Admin Usuario',
        email: 'admin@example.com',
        estado: true,
        roles: 'admin',
        fecha_creacion: new Date('2024-04-15'),
      },
      {
        id: 2,
        nombre: 'Usuario Estándar',
        email: 'usuario@example.com',
        estado: true,
        roles: 'user',
        fecha_creacion: new Date('2024-04-16'),
      },
      {
        id: 3,
        nombre: 'Editor Contenido',
        email: 'editor@example.com',
        estado: false,
        roles: 'editor',
        fecha_creacion: new Date('2024-04-17'),
      },
    ];

    return new Observable<User[]>((observer) => {
      // Simular retraso de red
      setTimeout(() => {
        observer.next(mockUsers);
        observer.complete();
      }, 500);
    });
  }

  getUserById(id: number): Observable<User> {
    // return this.http.get<User>(`${this.apiUrl}/${id}`);

    // Mock para desarrollo
    return new Observable<User>((observer) => {
      setTimeout(() => {
        const user = {
          id: id,
          nombre: `Usuario ${id}`,
          email: `user${id}@example.com`,
          estado: true,
          roles: 'user',
          fecha_creacion: new Date(),
        };
        observer.next(user);
        observer.complete();
      }, 300);
    });
  }

  createUser(user: any): Observable<any> {
    // return this.http.post<any>(this.apiUrl, user);

    // Mock para desarrollo
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Usuario creado exitosamente',
        });
        observer.complete();
      }, 800);
    });
  }

  updateUser(user: any): Observable<any> {
    // return this.http.put<any>(`${this.apiUrl}/${user.id}`, user);

    // Mock para desarrollo
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Usuario actualizado exitosamente',
        });
        observer.complete();
      }, 800);
    });
  }

  updateUserStatus(userId: number, status: boolean): Observable<any> {
    // return this.http.patch<any>(`${this.apiUrl}/${userId}/status`, { estado: status });

    // Mock para desarrollo
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: `Estado del usuario cambiado a ${
            status ? 'activo' : 'inactivo'
          }`,
        });
        observer.complete();
      }, 500);
    });
  }

  deleteUser(id: number): Observable<any> {
    // return this.http.delete<any>(`${this.apiUrl}/${id}`);

    // Mock para desarrollo
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Usuario eliminado exitosamente',
        });
        observer.complete();
      }, 700);
    });
  }

  // Método adicional para validación de email
  checkEmailExists(email: string): Observable<boolean> {
    // const params = new HttpParams().set('email', email);
    // return this.http.get<boolean>(`${this.apiUrl}/check-email`, { params });

    // Mock para desarrollo
    return new Observable<boolean>((observer) => {
      setTimeout(() => {
        // Simular que el email ya existe si contiene "admin"
        const exists = email.includes('admin');
        observer.next(exists);
        observer.complete();
      }, 300);
    });
  }
}
