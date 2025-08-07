-- =====================================================
-- SCRIPT COMPLETO
-- Ejecutar en el editor SQL de Supabase para una instalación limpia
-- =====================================================

-- 1. CREAR TABLAS

-- Tabla de compañías de seguros
CREATE TABLE IF NOT EXISTS companias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
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

-- Tabla de pólizas (con fecha_vigencia)
CREATE TABLE IF NOT EXISTS polizas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(100) NOT NULL,
  compania_id INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fecha_vigencia DATE, -- Columna correcta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de avisos
CREATE TABLE IF NOT EXISTS avisos (
  id SERIAL PRIMARY KEY,
  poliza_id INTEGER NOT NULL REFERENCES polizas(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL DEFAULT 'por_vencer' CHECK (estado IN ('por_vencer', 'avisado', 'pagado')),
  fecha_aviso TIMESTAMP WITH TIME ZONE,
  fecha_pago TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 2. FUNCIONES Y TRIGGERS

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para crear avisos (corregida para usar fecha_vigencia)
CREATE OR REPLACE FUNCTION create_aviso_for_poliza()
RETURNS TRIGGER AS $$
BEGIN
  -- Usar la columna correcta: fecha_vigencia
  IF NEW.fecha_vigencia IS NOT NULL THEN
    INSERT INTO avisos (poliza_id, estado)
    VALUES (NEW.id, 'por_vencer');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';


-- 3. ASIGNAR TRIGGERS A LAS TABLAS

-- Triggers para actualizar 'updated_at'
DROP TRIGGER IF EXISTS update_companias_updated_at ON companias;
CREATE TRIGGER update_companias_updated_at BEFORE UPDATE ON companias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_polizas_updated_at ON polizas;
CREATE TRIGGER update_polizas_updated_at BEFORE UPDATE ON polizas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_avisos_updated_at ON avisos;
CREATE TRIGGER update_avisos_updated_at BEFORE UPDATE ON avisos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear avisos automáticamente
DROP TRIGGER IF EXISTS create_aviso_trigger ON polizas;
CREATE TRIGGER create_aviso_trigger
  AFTER INSERT ON polizas
  FOR EACH ROW
  EXECUTE FUNCTION create_aviso_for_poliza();