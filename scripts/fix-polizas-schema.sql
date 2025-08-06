-- Corregir el esquema de la tabla polizas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polizas' 
ORDER BY ordinal_position;

-- 2. Eliminar columnas obsoletas si existen
ALTER TABLE polizas DROP COLUMN IF EXISTS fecha_inicio;
ALTER TABLE polizas DROP COLUMN IF EXISTS fecha_vencimiento;

-- 3. Asegurar que existe la columna fecha_vigencia
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS fecha_vigencia DATE;

-- 4. Verificar la estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polizas' 
ORDER BY ordinal_position;

-- 5. Mostrar algunas pólizas de ejemplo para verificar
SELECT id, numero, fecha_vigencia, cliente_id, compania_id 
FROM polizas 
LIMIT 5;
