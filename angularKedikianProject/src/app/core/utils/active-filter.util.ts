/**
 * Filtra colección para dropdowns: solo elementos activos.
 * Convención backend: `estado === true` = activo. Fallback a `activo`, `oculto` (invertido).
 */
export function onlyActive<T extends Record<string, any>>(items: T[] | null | undefined): T[] {
  if (!items) return [];
  return items.filter(item => {
    if ('estado' in item) return item.estado === true;
    if ('activo' in item) return item.activo === true;
    if ('oculto' in item) return item.oculto !== true;
    return true;
  });
}
