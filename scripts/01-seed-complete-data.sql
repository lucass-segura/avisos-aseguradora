-- Datos completos de ejemplo para GestorPólizas
-- Ejecutar después del script de configuración

-- Insertar compañías
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
  ('Fernández', 'Diego Alejandro', '+54 351 456-7890', 'diego.fernandez@email.com', 'Villa Carlos Paz, Córdoba'),
  ('Pérez', 'Juan Carlos', '+54 299 555-0123', 'juan.perez@email.com', 'Plottier, Neuquén'),
  ('Sánchez', 'Laura María', '+54 11 555-0456', 'laura.sanchez@email.com', 'La Plata, Buenos Aires'),
  ('Ruiz', 'Carmen Rosa', '+54 261 555-0789', 'carmen.ruiz@email.com', 'San Rafael, Mendoza')
ON CONFLICT DO NOTHING;

-- Insertar pólizas con fechas de vencimiento
DO $$
DECLARE
    cliente_carlos_id INTEGER;
    cliente_maria_id INTEGER;
    cliente_ana_id INTEGER;
    cliente_roberto_id INTEGER;
    cliente_laura_id INTEGER;
    cliente_diego_id INTEGER;
    cliente_juan_id INTEGER;
    cliente_laura2_id INTEGER;
    cliente_carmen_id INTEGER;
    compania_allianz_id INTEGER;
    compania_orbiz_id INTEGER;
    compania_lacaja_id INTEGER;
    compania_sancor_id INTEGER;
BEGIN
    -- Obtener IDs de clientes
    SELECT id INTO cliente_carlos_id FROM clientes WHERE apellido = 'González' AND nombre = 'Carlos Alberto' LIMIT 1;
    SELECT id INTO cliente_maria_id FROM clientes WHERE apellido = 'Rodríguez' AND nombre = 'María Elena' LIMIT 1;
    SELECT id INTO cliente_ana_id FROM clientes WHERE apellido = 'López' AND nombre = 'Ana Sofía' LIMIT 1;
    SELECT id INTO cliente_roberto_id FROM clientes WHERE apellido = 'Martínez' AND nombre = 'Roberto José' LIMIT 1;
    SELECT id INTO cliente_laura_id FROM clientes WHERE apellido = 'García' AND nombre = 'Laura Patricia' LIMIT 1;
    SELECT id INTO cliente_diego_id FROM clientes WHERE apellido = 'Fernández' AND nombre = 'Diego Alejandro' LIMIT 1;
    SELECT id INTO cliente_juan_id FROM clientes WHERE apellido = 'Pérez' AND nombre = 'Juan Carlos' LIMIT 1;
    SELECT id INTO cliente_laura2_id FROM clientes WHERE apellido = 'Sánchez' AND nombre = 'Laura María' LIMIT 1;
    SELECT id INTO cliente_carmen_id FROM clientes WHERE apellido = 'Ruiz' AND nombre = 'Carmen Rosa' LIMIT 1;
    
    -- Obtener IDs de compañías
    SELECT id INTO compania_allianz_id FROM companias WHERE nombre = 'Allianz' LIMIT 1;
    SELECT id INTO compania_orbiz_id FROM companias WHERE nombre = 'Orbiz' LIMIT 1;
    SELECT id INTO compania_lacaja_id FROM companias WHERE nombre = 'La Caja' LIMIT 1;
    SELECT id INTO compania_sancor_id FROM companias WHERE nombre = 'Sancor Seguros' LIMIT 1;
    
    -- Insertar pólizas que vencen pronto (para columna "Por Vencer")
    IF cliente_carlos_id IS NOT NULL AND compania_allianz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-001234', compania_allianz_id, cliente_carlos_id, '2024-01-15', CURRENT_DATE + INTERVAL '3 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_maria_id IS NOT NULL AND compania_orbiz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-005678', compania_orbiz_id, cliente_maria_id, '2024-03-10', CURRENT_DATE + INTERVAL '4 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_ana_id IS NOT NULL AND compania_lacaja_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-009012', compania_lacaja_id, cliente_ana_id, '2023-12-05', CURRENT_DATE + INTERVAL '2 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_roberto_id IS NOT NULL AND compania_sancor_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-003456', compania_sancor_id, cliente_roberto_id, '2024-02-20', CURRENT_DATE + INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Insertar pólizas para estados "avisado" y "pagado"
    IF cliente_laura_id IS NOT NULL AND compania_allianz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-007890', compania_allianz_id, cliente_laura_id, '2024-01-10', CURRENT_DATE + INTERVAL '7 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_diego_id IS NOT NULL AND compania_orbiz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-001122', compania_orbiz_id, cliente_diego_id, '2024-02-15', CURRENT_DATE + INTERVAL '10 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_juan_id IS NOT NULL AND compania_lacaja_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-003344', compania_lacaja_id, cliente_juan_id, '2024-03-01', CURRENT_DATE + INTERVAL '15 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_carmen_id IS NOT NULL AND compania_sancor_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-004455', compania_sancor_id, cliente_carmen_id, '2024-01-20', CURRENT_DATE + INTERVAL '20 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Pólizas insertadas correctamente';
END $$;

-- Actualizar algunos avisos para tener datos en diferentes estados
UPDATE avisos SET estado = 'avisado', fecha_aviso = NOW() - INTERVAL '2 days' 
WHERE poliza_id IN (
  SELECT id FROM polizas WHERE numero IN ('POL-007890', 'POL-001122', 'POL-003344')
);

UPDATE avisos SET estado = 'pagado', fecha_aviso = NOW() - INTERVAL '5 days', fecha_pago = NOW() - INTERVAL '1 day'
WHERE poliza_id IN (
  SELECT id FROM polizas WHERE numero = 'POL-004455'
);

-- Verificar que los datos se insertaron correctamente
SELECT 'Compañías: ' || COUNT(*) FROM companias;
SELECT 'Clientes: ' || COUNT(*) FROM clientes;
SELECT 'Pólizas: ' || COUNT(*) FROM polizas;
SELECT 'Avisos: ' || COUNT(*) FROM avisos;
SELECT 'Avisos por vencer: ' || COUNT(*) FROM avisos WHERE estado = 'por_vencer';
SELECT 'Avisos avisados: ' || COUNT(*) FROM avisos WHERE estado = 'avisado';
SELECT 'Avisos pagados: ' || COUNT(*) FROM avisos WHERE estado = 'pagado';
