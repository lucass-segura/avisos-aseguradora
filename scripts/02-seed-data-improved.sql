-- Limpiar datos existentes (opcional, comentar si no quieres borrar datos)
-- DELETE FROM polizas;
-- DELETE FROM clientes;
-- DELETE FROM companias;

-- Insertar compañías iniciales
INSERT INTO companias (nombre) VALUES 
  ('Allianz'),
  ('Orbiz'),
  ('La Caja'),
  ('Sancor Seguros'),
  ('Federación Patronal'),
  ('Rivadavia Seguros'),
  ('Mapfre'),
  ('Zurich')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar clientes de ejemplo
INSERT INTO clientes (apellido, nombre, telefono, email, localidad) VALUES 
  ('González', 'Carlos Alberto', '+54 299 123 4567', 'carlos.gonzalez@email.com', 'Neuquén, Neuquén'),
  ('Rodríguez', 'María Elena', '+54 11 4567-8901', 'maria.rodriguez@email.com', 'Buenos Aires, CABA'),
  ('López', 'Ana Sofía', '+54 11 8765-4321', 'ana.lopez@email.com', 'Córdoba, Córdoba'),
  ('Martínez', 'Roberto José', '+54 11 5432-1098', 'roberto.martinez@email.com', 'Rosario, Santa Fe'),
  ('García', 'Laura Patricia', '+54 261 987-6543', 'laura.garcia@email.com', 'Mendoza, Mendoza'),
  ('Fernández', 'Diego Alejandro', '+54 351 456-7890', 'diego.fernandez@email.com', 'Villa Carlos Paz, Córdoba')
ON CONFLICT DO NOTHING;

-- Insertar pólizas de ejemplo (solo si las tablas y datos existen)
DO $$
DECLARE
    cliente_carlos_id INTEGER;
    cliente_maria_id INTEGER;
    cliente_ana_id INTEGER;
    compania_allianz_id INTEGER;
    compania_orbiz_id INTEGER;
    compania_lacaja_id INTEGER;
BEGIN
    -- Obtener IDs de clientes
    SELECT id INTO cliente_carlos_id FROM clientes WHERE apellido = 'González' AND nombre = 'Carlos Alberto' LIMIT 1;
    SELECT id INTO cliente_maria_id FROM clientes WHERE apellido = 'Rodríguez' AND nombre = 'María Elena' LIMIT 1;
    SELECT id INTO cliente_ana_id FROM clientes WHERE apellido = 'López' AND nombre = 'Ana Sofía' LIMIT 1;
    
    -- Obtener IDs de compañías
    SELECT id INTO compania_allianz_id FROM companias WHERE nombre = 'Allianz' LIMIT 1;
    SELECT id INTO compania_orbiz_id FROM companias WHERE nombre = 'Orbiz' LIMIT 1;
    SELECT id INTO compania_lacaja_id FROM companias WHERE nombre = 'La Caja' LIMIT 1;
    
    -- Insertar pólizas solo si encontramos los IDs
    IF cliente_carlos_id IS NOT NULL AND compania_allianz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio) VALUES 
        ('POL-001234', compania_allianz_id, cliente_carlos_id, '2024-01-15')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_carlos_id IS NOT NULL AND compania_orbiz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio) VALUES 
        ('POL-005678', compania_orbiz_id, cliente_carlos_id, '2024-03-10')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_maria_id IS NOT NULL AND compania_lacaja_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio) VALUES 
        ('POL-009012', compania_lacaja_id, cliente_maria_id, '2023-12-05')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Datos de ejemplo insertados correctamente';
END $$;

-- Verificar que los datos se insertaron correctamente
SELECT 'Compañías insertadas: ' || COUNT(*) FROM companias;
SELECT 'Clientes insertados: ' || COUNT(*) FROM clientes;
SELECT 'Pólizas insertadas: ' || COUNT(*) FROM polizas;
