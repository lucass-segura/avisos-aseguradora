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
  ('Martínez', 'Roberto José', '+54 11 5432-1098', 'roberto.martinez@email.com', 'Rosario, Santa Fe')
ON CONFLICT DO NOTHING;

-- Insertar pólizas de ejemplo
INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio) VALUES 
  ('POL-001234', (SELECT id FROM companias WHERE nombre = 'Allianz'), (SELECT id FROM clientes WHERE apellido = 'González' AND nombre = 'Carlos Alberto'), '2024-01-15'),
  ('POL-005678', (SELECT id FROM companias WHERE nombre = 'Orbiz'), (SELECT id FROM clientes WHERE apellido = 'González' AND nombre = 'Carlos Alberto'), '2024-03-10'),
  ('POL-009012', (SELECT id FROM companias WHERE nombre = 'La Caja'), (SELECT id FROM clientes WHERE apellido = 'Rodríguez' AND nombre = 'María Elena'), '2023-12-05'),
  ('POL-003456', (SELECT id FROM companias WHERE nombre = 'Sancor Seguros'), (SELECT id FROM clientes WHERE apellido = 'López' AND nombre = 'Ana Sofía'), '2024-02-20')
ON CONFLICT DO NOTHING;
