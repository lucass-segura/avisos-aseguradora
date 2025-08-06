-- Script completo de configuración para GestorPólizas
-- Ejecutar en el editor SQL de Supabase

-- Eliminar tablas existentes si existen (opcional, comentar si no quieres borrar datos)
-- DROP TABLE IF EXISTS avisos CASCADE;
-- DROP TABLE IF EXISTS polizas CASCADE;
-- DROP TABLE IF EXISTS clientes CASCADE;
-- DROP TABLE IF EXISTS companias CASCADE;

-- Crear tabla de compañías
CREATE TABLE IF NOT EXISTS companias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  apellido VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  email VARCHAR(255),
  localidad VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pólizas
CREATE TABLE IF NOT EXISTS polizas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(100) NOT NULL,
  compania_id INTEGER REFERENCES companias(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de avisos (para el dashboard Kanban)
CREATE TABLE IF NOT EXISTS avisos (
  id SERIAL PRIMARY KEY,
  poliza_id INTEGER REFERENCES polizas(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL DEFAULT 'por_vencer', -- 'por_vencer', 'avisado', 'pagado'
  fecha_aviso TIMESTAMP WITH TIME ZONE,
  fecha_pago TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_apellido_nombre ON clientes(apellido, nombre);
CREATE INDEX IF NOT EXISTS idx_polizas_cliente_id ON polizas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_polizas_compania_id ON polizas(compania_id);
CREATE INDEX IF NOT EXISTS idx_polizas_vencimiento ON polizas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_avisos_estado ON avisos(estado);
CREATE INDEX IF NOT EXISTS idx_avisos_poliza_id ON avisos(poliza_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_companias_updated_at ON companias;
CREATE TRIGGER update_companias_updated_at BEFORE UPDATE ON companias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_polizas_updated_at ON polizas;
CREATE TRIGGER update_polizas_updated_at BEFORE UPDATE ON polizas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_avisos_updated_at ON avisos;
CREATE TRIGGER update_avisos_updated_at BEFORE UPDATE ON avisos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear avisos automáticamente cuando se crea una póliza
CREATE OR REPLACE FUNCTION create_aviso_for_poliza()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear aviso si la póliza tiene fecha de vencimiento
  IF NEW.fecha_vencimiento IS NOT NULL THEN
    INSERT INTO avisos (poliza_id, estado)
    VALUES (NEW.id, 'por_vencer');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para crear avisos automáticamente
DROP TRIGGER IF EXISTS create_aviso_trigger ON polizas;
CREATE TRIGGER create_aviso_trigger 
  AFTER INSERT ON polizas 
  FOR EACH ROW 
  EXECUTE FUNCTION create_aviso_for_poliza();

-- Verificar que las tablas se crearon correctamente
SELECT 'Tabla companias creada: ' || CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companias') THEN 'SI' ELSE 'NO' END;
SELECT 'Tabla clientes creada: ' || CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clientes') THEN 'SI' ELSE 'NO' END;
SELECT 'Tabla polizas creada: ' || CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'polizas') THEN 'SI' ELSE 'NO' END;
SELECT 'Tabla avisos creada: ' || CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'avisos') THEN 'SI' ELSE 'NO' END;
