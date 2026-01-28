export class Usuario {
  id: number = 0;
  nombre: string = '';
  email: string = '';
  hash_contrasena: string = '';
  estado: boolean = true;
  roles: string = '';
  fecha_creacion: Date = new Date();
}
