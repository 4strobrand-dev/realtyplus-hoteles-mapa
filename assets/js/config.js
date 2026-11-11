// Conexión con Supabase (proyecto "realtyplus-hoteles").
// La clave anon es pública por diseño: la seguridad la ponen las políticas RLS de la tabla
// (lectura pública solo de activos publicados; crear/editar/borrar solo con login).
// Si se dejan vacías, el mapa usa la copia local assets/data/activos_publicos.json (modo demostración).
window.RP_CONFIG = {
  supabaseUrl: 'https://vugcfuhzspexscfsomdb.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Z2NmdWh6c3BleHNjZnNvbWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDMzNjcsImV4cCI6MjEwOTk3OTM2N30.4gk46bsFFgJtTjgzKYONPR9Tl83FibxPDZ1ACPe-PH0'
};
