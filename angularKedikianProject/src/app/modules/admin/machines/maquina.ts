export class Maquina {
  id: number = 0;
  codigo: string = '';
  nombre: string = '';
  estado: boolean = true; // true = activo, false = inactivo
  horas_uso: number = 0;
  proyectos: [] = []; // Proyectos asignados a la máquina
}
