-- Verificar si las tablas existen y crearlas si no
DO $$ 
BEGIN
    -- Verificar si la tabla companias existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companias') THEN
        CREATE TABLE companias (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla companias creada';
    ELSE
        RAISE NOTICE 'Tabla companias ya existe';
    END IF;

    -- Verificar si la tabla clientes existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clientes') THEN
        CREATE TABLE clientes (
            id SERIAL PRIMARY KEY,
            apellido VARCHAR(255) NOT NULL,
            nombre VARCHAR(255) NOT NULL,
            telefono VARCHAR(50),
            email VARCHAR(255),
            localidad VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla clientes creada';
    ELSE
        RAISE NOTICE 'Tabla clientes ya existe';
    END IF;

    -- Verificar si la tabla polizas existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'polizas') THEN
        CREATE TABLE polizas (
            id SERIAL PRIMARY KEY,
            numero VARCHAR(100) NOT NULL,
            compania_id INTEGER REFERENCES companias(id) ON DELETE CASCADE,
            cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
            fecha_inicio DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla polizas creada';
    ELSE
        RAISE NOTICE 'Tabla polizas ya existe';
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_clientes_apellido_nombre ON clientes(apellido, nombre);
CREATE INDEX IF NOT EXISTS idx_polizas_cliente_id ON polizas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_polizas_compania_id ON polizas(compania_id);

-- Crear función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers si no existen
DROP TRIGGER IF EXISTS update_companias_updated_at ON companias;
CREATE TRIGGER update_companias_updated_at BEFORE UPDATE ON companias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_polizas_updated_at ON polizas;
CREATE TRIGGER update_polizas_updated_at BEFORE UPDATE ON polizas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
