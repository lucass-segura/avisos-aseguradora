-- Actualizar el esquema para el nuevo sistema de avisos
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar tabla de pólizas (cambiar fecha_vencimiento por fecha_vigencia)
ALTER TABLE polizas DROP COLUMN IF EXISTS fecha_vencimiento;
ALTER TABLE polizas DROP COLUMN IF EXISTS fecha_inicio;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS fecha_vigencia DATE;

-- 2. Actualizar tabla de avisos para el nuevo sistema
ALTER TABLE avisos DROP COLUMN IF EXISTS fecha_aviso;
ALTER TABLE avisos DROP COLUMN IF EXISTS fecha_pago;
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS fecha_vencimiento_calculado DATE;
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS ultimo_pago DATE;

-- 3. Función para calcular el próximo vencimiento considerando años bisiestos
CREATE OR REPLACE FUNCTION calcular_proximo_vencimiento(fecha_vigencia DATE, ultimo_pago DATE DEFAULT NULL)
RETURNS DATE AS $$
DECLARE
    fecha_base DATE;
    dia_vigencia INTEGER;
    mes_actual INTEGER;
    año_actual INTEGER;
    proximo_vencimiento DATE;
    dias_en_mes INTEGER;
BEGIN
    -- Si no hay fecha de vigencia, retornar NULL
    IF fecha_vigencia IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Usar la fecha del último pago como base, o la fecha actual si no hay pago
    fecha_base := COALESCE(ultimo_pago, CURRENT_DATE);
    
    -- Obtener el día de la vigencia original
    dia_vigencia := EXTRACT(DAY FROM fecha_vigencia);
    
    -- Calcular el próximo mes
    mes_actual := EXTRACT(MONTH FROM fecha_base);
    año_actual := EXTRACT(YEAR FROM fecha_base);
    
    -- Si estamos en el mismo mes, ir al siguiente
    IF EXTRACT(DAY FROM fecha_base) >= dia_vigencia THEN
        mes_actual := mes_actual + 1;
        IF mes_actual > 12 THEN
            mes_actual := 1;
            año_actual := año_actual + 1;
        END IF;
    END IF;
    
    -- Construir la fecha tentativa
    proximo_vencimiento := make_date(año_actual, mes_actual, 1);
    
    -- Obtener los días del mes objetivo
    dias_en_mes := EXTRACT(DAY FROM (proximo_vencimiento + INTERVAL '1 month' - INTERVAL '1 day'));
    
    -- Ajustar el día si es necesario (ej: 31 de enero -> 28/29 de febrero)
    IF dia_vigencia > dias_en_mes THEN
        proximo_vencimiento := proximo_vencimiento + INTERVAL '1 month' - INTERVAL '1 day';
    ELSE
        proximo_vencimiento := make_date(año_actual, mes_actual, dia_vigencia);
    END IF;
    
    RETURN proximo_vencimiento;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para actualizar avisos automáticamente
CREATE OR REPLACE FUNCTION actualizar_avisos_automaticos()
RETURNS void AS $$
DECLARE
    poliza_record RECORD;
    proximo_vencimiento DATE;
    aviso_existente RECORD;
BEGIN
    -- Recorrer todas las pólizas activas
    FOR poliza_record IN 
        SELECT p.id, p.fecha_vigencia, a.id as aviso_id, a.estado, a.ultimo_pago
        FROM polizas p
        LEFT JOIN avisos a ON p.id = a.poliza_id
        WHERE p.fecha_vigencia IS NOT NULL
    LOOP
        -- Calcular el próximo vencimiento
        proximo_vencimiento := calcular_proximo_vencimiento(
            poliza_record.fecha_vigencia, 
            poliza_record.ultimo_pago
        );
        
        -- Si no existe aviso, crearlo
        IF poliza_record.aviso_id IS NULL THEN
            INSERT INTO avisos (poliza_id, estado, fecha_vencimiento_calculado)
            VALUES (poliza_record.id, 'por_vencer', proximo_vencimiento);
        ELSE
            -- Actualizar el aviso existente
            UPDATE avisos 
            SET fecha_vencimiento_calculado = proximo_vencimiento
            WHERE id = poliza_record.aviso_id;
            
            -- Si está pagado y faltan más de 5 días, cambiar a por_vencer
            IF poliza_record.estado = 'pagado' 
               AND proximo_vencimiento - CURRENT_DATE > 5 THEN
                UPDATE avisos 
                SET estado = 'por_vencer'
                WHERE id = poliza_record.aviso_id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para actualizar avisos cuando se modifica una póliza
CREATE OR REPLACE FUNCTION trigger_actualizar_avisos()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar avisos después de cualquier cambio en pólizas
    PERFORM actualizar_avisos_automaticos();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_polizas_avisos ON polizas;
CREATE TRIGGER trigger_polizas_avisos
    AFTER INSERT OR UPDATE ON polizas
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_actualizar_avisos();

-- 6. Función para marcar pago y actualizar próximo vencimiento
CREATE OR REPLACE FUNCTION marcar_pago_poliza(aviso_id INTEGER)
RETURNS void AS $$
DECLARE
    poliza_vigencia DATE;
    nuevo_vencimiento DATE;
BEGIN
    -- Obtener la fecha de vigencia de la póliza
    SELECT p.fecha_vigencia INTO poliza_vigencia
    FROM avisos a
    JOIN polizas p ON a.poliza_id = p.id
    WHERE a.id = aviso_id;
    
    -- Calcular el próximo vencimiento desde hoy
    nuevo_vencimiento := calcular_proximo_vencimiento(poliza_vigencia, CURRENT_DATE);
    
    -- Actualizar el aviso
    UPDATE avisos 
    SET estado = 'pagado',
        ultimo_pago = CURRENT_DATE,
        fecha_vencimiento_calculado = nuevo_vencimiento
    WHERE id = aviso_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Vista para obtener avisos que deben mostrarse (próximos 5 días)
CREATE OR REPLACE VIEW avisos_proximos AS
SELECT 
    a.*,
    p.numero as poliza_numero,
    p.fecha_vigencia,
    c.apellido,
    c.nombre,
    comp.nombre as compania_nombre,
    (a.fecha_vencimiento_calculado - CURRENT_DATE) as dias_restantes
FROM avisos a
JOIN polizas p ON a.poliza_id = p.id
JOIN clientes c ON p.cliente_id = c.id
JOIN companias comp ON p.compania_id = comp.id
WHERE a.fecha_vencimiento_calculado IS NOT NULL
  AND a.fecha_vencimiento_calculado <= CURRENT_DATE + INTERVAL '5 days'
  AND a.fecha_vencimiento_calculado >= CURRENT_DATE;

-- 8. Ejecutar la actualización inicial
SELECT actualizar_avisos_automaticos();

-- Verificar los resultados
SELECT 'Avisos actualizados: ' || COUNT(*) FROM avisos;
SELECT 'Avisos próximos (5 días): ' || COUNT(*) FROM avisos_proximos;
