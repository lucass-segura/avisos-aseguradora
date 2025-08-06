-- =====================================================
-- DATOS DE EJEMPLO PARA GESTORPÓLIZAS
-- Ejecutar DESPUÉS del script setup-database.sql
-- =====================================================

-- =====================================================
-- INSERTAR COMPAÑÍAS DE SEGUROS
-- =====================================================

INSERT INTO companias (nombre) VALUES 
  ('Allianz'),
  ('Orbiz'),
  ('La Caja'),
  ('Sancor Seguros'),
  ('Federación Patronal'),
  ('Rivadavia Seguros'),
  ('Mapfre'),
  ('Zurich'),
  ('San Cristóbal'),
  ('Provincia Seguros')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- INSERTAR CLIENTES DE EJEMPLO
-- =====================================================

INSERT INTO clientes (apellido, nombre, telefono, email, localidad) VALUES 
  -- Clientes para avisos "por vencer"
  ('González', 'Carlos Alberto', '+54 299 123 4567', 'carlos.gonzalez@email.com', 'Neuquén, Neuquén'),
  ('Rodríguez', 'María Elena', '+54 11 4567-8901', 'maria.rodriguez@email.com', 'Buenos Aires, CABA'),
  ('López', 'Ana Sofía', '+54 11 8765-4321', 'ana.lopez@email.com', 'Córdoba, Córdoba'),
  ('Martínez', 'Roberto José', '+54 11 5432-1098', 'roberto.martinez@email.com', 'Rosario, Santa Fe'),
  
  -- Clientes para avisos "avisados"
  ('García', 'Laura Patricia', '+54 261 987-6543', 'laura.garcia@email.com', 'Mendoza, Mendoza'),
  ('Fernández', 'Diego Alejandro', '+54 351 456-7890', 'diego.fernandez@email.com', 'Villa Carlos Paz, Córdoba'),
  ('Pérez', 'Juan Carlos', '+54 299 555-0123', 'juan.perez@email.com', 'Plottier, Neuquén'),
  
  -- Clientes para avisos "pagados"
  ('Sánchez', 'Laura María', '+54 11 555-0456', 'laura.sanchez@email.com', 'La Plata, Buenos Aires'),
  ('Ruiz', 'Carmen Rosa', '+54 261 555-0789', 'carmen.ruiz@email.com', 'San Rafael, Mendoza'),
  
  -- Clientes adicionales
  ('Torres', 'Miguel Ángel', '+54 351 555-1234', 'miguel.torres@email.com', 'Río Cuarto, Córdoba'),
  ('Morales', 'Patricia Isabel', '+54 299 555-5678', 'patricia.morales@email.com', 'Cipolletti, Río Negro'),
  ('Silva', 'Eduardo Daniel', '+54 11 555-9012', 'eduardo.silva@email.com', 'Mar del Plata, Buenos Aires')
ON CONFLICT DO NOTHING;

-- =====================================================
-- INSERTAR PÓLIZAS CON FECHAS ESTRATÉGICAS
-- =====================================================

DO $$
DECLARE
    -- Variables para IDs de clientes
    cliente_carlos_id INTEGER;
    cliente_maria_id INTEGER;
    cliente_ana_id INTEGER;
    cliente_roberto_id INTEGER;
    cliente_laura_id INTEGER;
    cliente_diego_id INTEGER;
    cliente_juan_id INTEGER;
    cliente_laura2_id INTEGER;
    cliente_carmen_id INTEGER;
    cliente_miguel_id INTEGER;
    cliente_patricia_id INTEGER;
    cliente_eduardo_id INTEGER;
    
    -- Variables para IDs de compañías
    compania_allianz_id INTEGER;
    compania_orbiz_id INTEGER;
    compania_lacaja_id INTEGER;
    compania_sancor_id INTEGER;
    compania_federacion_id INTEGER;
    compania_rivadavia_id INTEGER;
    compania_mapfre_id INTEGER;
    compania_zurich_id INTEGER;
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
    SELECT id INTO cliente_miguel_id FROM clientes WHERE apellido = 'Torres' AND nombre = 'Miguel Ángel' LIMIT 1;
    SELECT id INTO cliente_patricia_id FROM clientes WHERE apellido = 'Morales' AND nombre = 'Patricia Isabel' LIMIT 1;
    SELECT id INTO cliente_eduardo_id FROM clientes WHERE apellido = 'Silva' AND nombre = 'Eduardo Daniel' LIMIT 1;
    
    -- Obtener IDs de compañías
    SELECT id INTO compania_allianz_id FROM companias WHERE nombre = 'Allianz' LIMIT 1;
    SELECT id INTO compania_orbiz_id FROM companias WHERE nombre = 'Orbiz' LIMIT 1;
    SELECT id INTO compania_lacaja_id FROM companias WHERE nombre = 'La Caja' LIMIT 1;
    SELECT id INTO compania_sancor_id FROM companias WHERE nombre = 'Sancor Seguros' LIMIT 1;
    SELECT id INTO compania_federacion_id FROM companias WHERE nombre = 'Federación Patronal' LIMIT 1;
    SELECT id INTO compania_rivadavia_id FROM companias WHERE nombre = 'Rivadavia Seguros' LIMIT 1;
    SELECT id INTO compania_mapfre_id FROM companias WHERE nombre = 'Mapfre' LIMIT 1;
    SELECT id INTO compania_zurich_id FROM companias WHERE nombre = 'Zurich' LIMIT 1;
    
    -- =====================================================
    -- PÓLIZAS QUE VENCEN PRONTO (Estado: por_vencer)
    -- =====================================================
    
    -- Póliza que vence en 1 día (URGENTE)
    IF cliente_carlos_id IS NOT NULL AND compania_allianz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-001234', compania_allianz_id, cliente_carlos_id, '2024-01-15', CURRENT_DATE + INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Póliza que vence en 2 días
    IF cliente_maria_id IS NOT NULL AND compania_orbiz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-005678', compania_orbiz_id, cliente_maria_id, '2024-03-10', CURRENT_DATE + INTERVAL '2 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Póliza que vence en 3 días
    IF cliente_ana_id IS NOT NULL AND compania_lacaja_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-009012', compania_lacaja_id, cliente_ana_id, '2023-12-05', CURRENT_DATE + INTERVAL '3 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Póliza que vence en 4 días
    IF cliente_roberto_id IS NOT NULL AND compania_sancor_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-003456', compania_sancor_id, cliente_roberto_id, '2024-02-20', CURRENT_DATE + INTERVAL '4 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- =====================================================
    -- PÓLIZAS PARA ESTADO "AVISADO"
    -- =====================================================
    
    -- Pólizas que vencen en una semana (para marcar como avisadas)
    IF cliente_laura_id IS NOT NULL AND compania_federacion_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-007890', compania_federacion_id, cliente_laura_id, '2024-01-10', CURRENT_DATE + INTERVAL '7 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_diego_id IS NOT NULL AND compania_rivadavia_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-001122', compania_rivadavia_id, cliente_diego_id, '2024-02-15', CURRENT_DATE + INTERVAL '10 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_juan_id IS NOT NULL AND compania_mapfre_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-003344', compania_mapfre_id, cliente_juan_id, '2024-03-01', CURRENT_DATE + INTERVAL '12 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- =====================================================
    -- PÓLIZAS PARA ESTADO "PAGADO"
    -- =====================================================
    
    -- Pólizas que vencen más adelante (para marcar como pagadas)
    IF cliente_laura2_id IS NOT NULL AND compania_zurich_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-004455', compania_zurich_id, cliente_laura2_id, '2024-01-20', CURRENT_DATE + INTERVAL '20 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_carmen_id IS NOT NULL AND compania_allianz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-006677', compania_allianz_id, cliente_carmen_id, '2024-02-01', CURRENT_DATE + INTERVAL '25 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- =====================================================
    -- PÓLIZAS ADICIONALES (SIN VENCIMIENTO PRÓXIMO)
    -- =====================================================
    
    -- Pólizas que vencen en varios meses
    IF cliente_miguel_id IS NOT NULL AND compania_orbiz_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-008899', compania_orbiz_id, cliente_miguel_id, '2024-01-01', CURRENT_DATE + INTERVAL '3 months')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_patricia_id IS NOT NULL AND compania_lacaja_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-011223', compania_lacaja_id, cliente_patricia_id, '2024-02-15', CURRENT_DATE + INTERVAL '4 months')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF cliente_eduardo_id IS NOT NULL AND compania_sancor_id IS NOT NULL THEN
        INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
        ('POL-013345', compania_sancor_id, cliente_eduardo_id, '2024-03-01', CURRENT_DATE + INTERVAL '6 months')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE '✓ Pólizas insertadas correctamente';
END $$;

-- =====================================================
-- CONFIGURAR ESTADOS DE AVISOS
-- =====================================================

-- Esperar un momento para que se ejecuten los triggers
SELECT pg_sleep(1);

-- Actualizar algunos avisos para tener datos en estado "avisado"
UPDATE avisos SET 
  estado = 'avisado', 
  fecha_aviso = NOW() - INTERVAL '2 days' 
WHERE poliza_id IN (
  SELECT id FROM polizas WHERE numero IN ('POL-007890', 'POL-001122', 'POL-003344')
);

-- Actualizar algunos avisos para tener datos en estado "pagado"
UPDATE avisos SET 
  estado = 'pagado', 
  fecha_aviso = NOW() - INTERVAL '5 days', 
  fecha_pago = NOW() - INTERVAL '1 day'
WHERE poliza_id IN (
  SELECT id FROM polizas WHERE numero IN ('POL-004455', 'POL-006677')
);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== RESUMEN DE DATOS INSERTADOS ===';
  RAISE NOTICE 'Compañías: %', (SELECT COUNT(*) FROM companias);
  RAISE NOTICE 'Clientes: %', (SELECT COUNT(*) FROM clientes);
  RAISE NOTICE 'Pólizas: %', (SELECT COUNT(*) FROM polizas);
  RAISE NOTICE 'Avisos: %', (SELECT COUNT(*) FROM avisos);
  RAISE NOTICE '';
  RAISE NOTICE '=== DISTRIBUCIÓN DE AVISOS ===';
  RAISE NOTICE 'Por vencer: %', (SELECT COUNT(*) FROM avisos WHERE estado = 'por_vencer');
  RAISE NOTICE 'Avisados: %', (SELECT COUNT(*) FROM avisos WHERE estado = 'avisado');
  RAISE NOTICE 'Pagados: %', (SELECT COUNT(*) FROM avisos WHERE estado = 'pagado');
  RAISE NOTICE '';
  RAISE NOTICE '✓ DATOS DE EJEMPLO INSERTADOS CORRECTAMENTE';
END $$;

-- Mostrar algunas pólizas próximas a vencer
SELECT 
  p.numero as "Número Póliza",
  c.nombre as "Cliente",
  comp.nombre as "Compañía",
  p.fecha_vencimiento as "Vencimiento",
  a.estado as "Estado Aviso",
  CASE 
    WHEN p.fecha_vencimiento <= CURRENT_DATE + INTERVAL '5 days' THEN '🔴 URGENTE'
    WHEN p.fecha_vencimiento <= CURRENT_DATE + INTERVAL '15 days' THEN '🟡 PRÓXIMO'
    ELSE '🟢 NORMAL'
  END as "Prioridad"
FROM polizas p
JOIN clientes c ON p.cliente_id = c.id
JOIN companias comp ON p.compania_id = comp.id
LEFT JOIN avisos a ON p.id = a.poliza_id
WHERE p.fecha_vencimiento IS NOT NULL
ORDER BY p.fecha_vencimiento ASC
LIMIT 10;
