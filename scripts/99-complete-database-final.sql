-- =====================================================
-- SCRIPT COMPLETO Y FINAL DE BASE DE DATOS
-- Sistema de Gestión de Avisos de Seguros
-- =====================================================

-- Limpiar base de datos existente
DROP TABLE IF EXISTS avisos_proximos CASCADE;
DROP TABLE IF EXISTS avisos CASCADE;
DROP TABLE IF EXISTS polizas CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS companias CASCADE;

-- Eliminar funciones y triggers existentes
DROP FUNCTION IF EXISTS actualizar_avisos_proximos() CASCADE;
DROP FUNCTION IF EXISTS procesar_polizas_vencidas() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- CREACIÓN DE TABLAS
-- =====================================================

-- Tabla de compañías de seguros
CREATE TABLE companias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    localidad VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pólizas
CREATE TABLE polizas (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(100) NOT NULL,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    compania_id INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
    fecha_vigencia DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(numero, compania_id)
);

-- Tabla de avisos
CREATE TABLE avisos (
    id SERIAL PRIMARY KEY,
    poliza_id INTEGER NOT NULL REFERENCES polizas(id) ON DELETE CASCADE,
    estado VARCHAR(50) NOT NULL DEFAULT 'por_vencer',
    fecha_aviso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_pago TIMESTAMP WITH TIME ZONE,
    ultimo_pago DATE,
    fecha_vencimiento_calculado DATE,
    avisado_por TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (estado IN ('por_vencer', 'avisado', 'pagado', 'vencido'))
);

-- Vista materializada para avisos próximos (optimización de consultas)
CREATE TABLE avisos_proximos (
    id SERIAL PRIMARY KEY,
    poliza_id INTEGER NOT NULL,
    poliza_numero VARCHAR(100) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    compania_nombre VARCHAR(255) NOT NULL,
    fecha_vigencia DATE NOT NULL,
    ultimo_pago DATE,
    fecha_vencimiento_calculado DATE,
    dias_restantes INTEGER,
    estado VARCHAR(50) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_companias_updated_at BEFORE UPDATE ON companias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_polizas_updated_at BEFORE UPDATE ON polizas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_avisos_updated_at BEFORE UPDATE ON avisos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_avisos_proximos_updated_at BEFORE UPDATE ON avisos_proximos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar avisos_proximos
CREATE OR REPLACE FUNCTION actualizar_avisos_proximos()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar registros existentes para esta póliza
    DELETE FROM avisos_proximos WHERE poliza_id = COALESCE(NEW.poliza_id, OLD.poliza_id);
    
    -- Si es DELETE, no insertar nada nuevo
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    -- Insertar/actualizar registro en avisos_proximos
    INSERT INTO avisos_proximos (
        poliza_id,
        poliza_numero,
        nombre,
        apellido,
        compania_nombre,
        fecha_vigencia,
        ultimo_pago,
        fecha_vencimiento_calculado,
        dias_restantes,
        estado,
        notas
    )
    SELECT 
        p.id,
        p.numero,
        c.nombre,
        c.apellido,
        comp.nombre,
        p.fecha_vigencia,
        a.ultimo_pago,
        a.fecha_vencimiento_calculado,
        CASE 
            WHEN a.fecha_vencimiento_calculado IS NOT NULL 
            THEN a.fecha_vencimiento_calculado - CURRENT_DATE
            ELSE p.fecha_vigencia - CURRENT_DATE
        END,
        a.estado,
        a.notas
    FROM polizas p
    JOIN clientes c ON p.cliente_id = c.id
    JOIN companias comp ON p.compania_id = comp.id
    JOIN avisos a ON p.id = a.poliza_id
    WHERE p.id = NEW.poliza_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para mantener avisos_proximos actualizado
CREATE TRIGGER trigger_actualizar_avisos_proximos
    AFTER INSERT OR UPDATE OR DELETE ON avisos
    FOR EACH ROW EXECUTE FUNCTION actualizar_avisos_proximos();

-- Función para procesar pólizas que deben cambiar de estado automáticamente
-- LÓGICA CLAVE: Cuando una póliza está "pagado" y faltan 5 días para vencer del mes siguiente,
-- se cambia el mes correspondiente y vuelve al estado "por_vencer"
CREATE OR REPLACE FUNCTION procesar_polizas_vencidas()
RETURNS void AS $$
DECLARE
    poliza_record RECORD;
    nueva_fecha_vencimiento DATE;
BEGIN
    -- Buscar pólizas pagadas que necesitan renovación automática
    FOR poliza_record IN
        SELECT 
            a.id as aviso_id,
            a.poliza_id,
            a.ultimo_pago,
            a.fecha_vencimiento_calculado,
            p.fecha_vigencia,
            p.numero as poliza_numero,
            c.nombre,
            c.apellido
        FROM avisos a
        JOIN polizas p ON a.poliza_id = p.id
        JOIN clientes c ON p.cliente_id = c.id
        WHERE a.estado = 'pagado'
        AND a.fecha_vencimiento_calculado IS NOT NULL
        AND (a.fecha_vencimiento_calculado - CURRENT_DATE) <= 5
        AND (a.fecha_vencimiento_calculado - CURRENT_DATE) >= 0
    LOOP
        -- Calcular nueva fecha de vencimiento (mes siguiente)
        nueva_fecha_vencimiento := poliza_record.fecha_vencimiento_calculado + INTERVAL '1 month';
        
        -- Actualizar el aviso con el nuevo mes y cambiar estado a 'por_vencer'
        UPDATE avisos 
        SET 
            estado = 'por_vencer',
            fecha_vencimiento_calculado = nueva_fecha_vencimiento,
            fecha_aviso = NOW(),
            fecha_pago = NULL,
            notas = COALESCE(notas, '') || 
                   CASE 
                       WHEN notas IS NOT NULL AND notas != '' THEN ' | '
                       ELSE ''
                   END ||
                   'Renovación automática - ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI'),
            updated_at = NOW()
        WHERE id = poliza_record.aviso_id;
        
        -- Log del proceso
        RAISE NOTICE 'Póliza % renovada automáticamente. Nueva fecha vencimiento: %', 
                     poliza_record.poliza_numero, 
                     nueva_fecha_vencimiento;
    END LOOP;
    
    -- También procesar pólizas que ya vencieron (cambiar a 'vencido')
    UPDATE avisos 
    SET 
        estado = 'vencido',
        updated_at = NOW()
    WHERE estado IN ('por_vencer', 'avisado')
    AND (
        (fecha_vencimiento_calculado IS NOT NULL AND fecha_vencimiento_calculado < CURRENT_DATE)
        OR 
        (fecha_vencimiento_calculado IS NULL AND 
         (SELECT fecha_vigencia FROM polizas WHERE id = poliza_id) < CURRENT_DATE)
    );
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================

-- Insertar compañías
INSERT INTO companias (nombre) VALUES 
('La Caja Seguros'),
('Sancor Seguros'),
('Zurich Argentina'),
('Allianz Argentina'),
('Federación Patronal'),
('Rivadavia Seguros'),
('San Cristóbal Seguros'),
('Provincia Seguros'),
('Mercantil Andina'),
('Nación Seguros');

-- Insertar clientes de prueba
INSERT INTO clientes (nombre, apellido, telefono, email, localidad) VALUES 
('Juan Carlos', 'Pérez', '11-2345-6789', 'juan.perez@email.com', 'Buenos Aires'),
('María Elena', 'González', '11-3456-7890', 'maria.gonzalez@email.com', 'Córdoba'),
('Roberto', 'Martínez', '11-4567-8901', 'roberto.martinez@email.com', 'Rosario'),
('Ana Sofía', 'López', '11-5678-9012', 'ana.lopez@email.com', 'Mendoza'),
('Carlos Alberto', 'Rodríguez', '11-6789-0123', 'carlos.rodriguez@email.com', 'La Plata'),
('Lucía', 'Fernández', '11-7890-1234', 'lucia.fernandez@email.com', 'Mar del Plata'),
('Miguel Ángel', 'Torres', '11-8901-2345', 'miguel.torres@email.com', 'Tucumán'),
('Patricia', 'Morales', '11-9012-3456', 'patricia.morales@email.com', 'Salta'),
('Fernando', 'Ruiz', '11-0123-4567', 'fernando.ruiz@email.com', 'Neuquén'),
('Gabriela', 'Herrera', '11-1234-5678', 'gabriela.herrera@email.com', 'Bahía Blanca');

-- Insertar pólizas con fechas variadas para testing
INSERT INTO polizas (numero, cliente_id, compania_id, fecha_vigencia) VALUES 
-- Pólizas que vencen pronto (para testing de renovación automática)
('POL-2024-001', 1, 1, CURRENT_DATE + INTERVAL '3 days'),
('POL-2024-002', 2, 2, CURRENT_DATE + INTERVAL '7 days'),
('POL-2024-003', 3, 3, CURRENT_DATE + INTERVAL '15 days'),
('POL-2024-004', 4, 4, CURRENT_DATE + INTERVAL '25 days'),
('POL-2024-005', 5, 5, CURRENT_DATE + INTERVAL '35 days'),

-- Pólizas con fechas normales
('POL-2024-006', 6, 6, '2024-12-15'),
('POL-2024-007', 7, 7, '2025-01-20'),
('POL-2024-008', 8, 8, '2025-02-10'),
('POL-2024-009', 9, 9, '2025-03-05'),
('POL-2024-010', 10, 10, '2025-04-12'),

-- Pólizas adicionales para testing
('POL-2024-011', 1, 2, '2025-05-18'),
('POL-2024-012', 3, 4, '2025-06-22'),
('POL-2024-013', 5, 6, '2025-07-30'),
('POL-2024-014', 7, 8, '2025-08-14'),
('POL-2024-015', 9, 1, '2025-09-25');

-- Insertar avisos con diferentes estados para testing
INSERT INTO avisos (poliza_id, estado, ultimo_pago, fecha_vencimiento_calculado, avisado_por, notas) VALUES 
-- Avisos que están pagados y próximos a vencer (para testing de renovación automática)
(1, 'pagado', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '4 days', 'Sistema', 'Pago recibido - Próximo a renovación automática'),
(2, 'pagado', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '3 days', 'Juan Operador', 'Cliente pagó por transferencia'),

-- Avisos en diferentes estados
(3, 'por_vencer', NULL, CURRENT_DATE + INTERVAL '15 days', NULL, 'Aviso generado automáticamente'),
(4, 'avisado', NULL, CURRENT_DATE + INTERVAL '25 days', 'María Operadora', 'Cliente contactado por teléfono'),
(5, 'por_vencer', NULL, CURRENT_DATE + INTERVAL '35 days', NULL, 'Pendiente de contacto'),

-- Avisos con fechas normales
(6, 'por_vencer', NULL, '2024-12-15', NULL, 'Aviso regular'),
(7, 'avisado', NULL, '2025-01-20', 'Carlos Operador', 'Email enviado'),
(8, 'pagado', '2024-11-10', '2025-02-10', 'Sistema', 'Pago confirmado'),
(9, 'por_vencer', NULL, '2025-03-05', NULL, 'Nuevo aviso'),
(10, 'avisado', NULL, '2025-04-12', 'Ana Operadora', 'WhatsApp enviado'),

-- Avisos adicionales
(11, 'por_vencer', NULL, '2025-05-18', NULL, 'Aviso pendiente'),
(12, 'pagado', '2024-11-15', '2025-06-22', 'Sistema', 'Pago por débito automático'),
(13, 'avisado', NULL, '2025-07-30', 'Luis Operador', 'Llamada realizada'),
(14, 'por_vencer', NULL, '2025-08-14', NULL, 'Aviso generado'),
(15, 'vencido', NULL, '2024-09-25', 'Sistema', 'Póliza vencida - requiere renovación');

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para mejorar performance
CREATE INDEX idx_polizas_cliente_id ON polizas(cliente_id);
CREATE INDEX idx_polizas_compania_id ON polizas(compania_id);
CREATE INDEX idx_avisos_poliza_id ON avisos(poliza_id);
CREATE INDEX idx_avisos_estado ON avisos(estado);
CREATE INDEX idx_avisos_fecha_vencimiento ON avisos(fecha_vencimiento_calculado);
CREATE INDEX idx_avisos_proximos_estado ON avisos_proximos(estado);
CREATE INDEX idx_avisos_proximos_dias ON avisos_proximos(dias_restantes);

-- =====================================================
-- PROCEDIMIENTO DE TESTING AUTOMÁTICO
-- =====================================================

-- Función para ejecutar tests de la lógica de renovación
CREATE OR REPLACE FUNCTION test_renovacion_automatica()
RETURNS TABLE(
    test_name TEXT,
    poliza_numero VARCHAR,
    estado_anterior VARCHAR,
    estado_nuevo VARCHAR,
    fecha_anterior DATE,
    fecha_nueva DATE,
    resultado TEXT
) AS $$
DECLARE
    test_record RECORD;
BEGIN
    -- Ejecutar el proceso de renovación
    PERFORM procesar_polizas_vencidas();
    
    -- Verificar resultados
    FOR test_record IN
        SELECT 
            'Test Renovación Automática' as test_name,
            p.numero as poliza_numero,
            'pagado' as estado_anterior,
            a.estado as estado_nuevo,
            (CURRENT_DATE + INTERVAL '4 days')::DATE as fecha_anterior,
            a.fecha_vencimiento_calculado as fecha_nueva,
            CASE 
                WHEN a.estado = 'por_vencer' AND a.fecha_vencimiento_calculado > CURRENT_DATE + INTERVAL '25 days'
                THEN '✅ ÉXITO: Renovación automática funcionó correctamente'
                ELSE '❌ ERROR: Renovación automática falló'
            END as resultado
        FROM avisos a
        JOIN polizas p ON a.poliza_id = p.id
        WHERE p.numero IN ('POL-2024-001', 'POL-2024-002')
    LOOP
        test_name := test_record.test_name;
        poliza_numero := test_record.poliza_numero;
        estado_anterior := test_record.estado_anterior;
        estado_nuevo := test_record.estado_nuevo;
        fecha_anterior := test_record.fecha_anterior;
        fecha_nueva := test_record.fecha_nueva;
        resultado := test_record.resultado;
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Actualizar avisos_proximos inicial
INSERT INTO avisos_proximos (
    poliza_id,
    poliza_numero,
    nombre,
    apellido,
    compania_nombre,
    fecha_vigencia,
    ultimo_pago,
    fecha_vencimiento_calculado,
    dias_restantes,
    estado,
    notas
)
SELECT 
    p.id,
    p.numero,
    c.nombre,
    c.apellido,
    comp.nombre,
    p.fecha_vigencia,
    a.ultimo_pago,
    a.fecha_vencimiento_calculado,
    CASE 
        WHEN a.fecha_vencimiento_calculado IS NOT NULL 
        THEN a.fecha_vencimiento_calculado - CURRENT_DATE
        ELSE p.fecha_vigencia - CURRENT_DATE
    END,
    a.estado,
    a.notas
FROM polizas p
JOIN clientes c ON p.cliente_id = c.id
JOIN companias comp ON p.compania_id = comp.id
JOIN avisos a ON p.id = a.poliza_id;

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE '🎉 BASE DE DATOS CONFIGURADA EXITOSAMENTE';
    RAISE NOTICE '📊 Tablas creadas: companias, clientes, polizas, avisos, avisos_proximos';
    RAISE NOTICE '⚙️  Funciones creadas: actualizar_avisos_proximos(), procesar_polizas_vencidas()';
    RAISE NOTICE '🔄 Triggers configurados para actualización automática';
    RAISE NOTICE '📈 Datos de prueba insertados correctamente';
    RAISE NOTICE '🧪 Para probar la renovación automática, ejecuta: SELECT * FROM test_renovacion_automatica();';
    RAISE NOTICE '⏰ Para ejecutar el proceso automático: SELECT procesar_polizas_vencidas();';
END $$;
