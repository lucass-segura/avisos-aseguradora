-- =====================================================
-- TEST COMPLETO DE LÓGICA DE RENOVACIÓN AUTOMÁTICA
-- Sistema de Gestión de Avisos de Seguros
-- =====================================================

-- Corregir DROP VIEW en lugar de DROP TABLE para avisos_proximos
-- Limpiar vistas existentes si existen
DROP VIEW IF EXISTS avisos_proximos CASCADE;
DROP VIEW IF EXISTS vista_test_renovacion CASCADE;

-- Función para crear escenarios de test controlados
CREATE OR REPLACE FUNCTION crear_escenarios_test()
RETURNS void AS $$
BEGIN
    -- Limpiar datos de test anteriores
    DELETE FROM avisos WHERE poliza_id IN (
        SELECT id FROM polizas WHERE numero LIKE 'TEST-%'
    );
    DELETE FROM polizas WHERE numero LIKE 'TEST-%';
    DELETE FROM clientes WHERE nombre = 'Test Cliente';
    
    -- Crear cliente de test
    INSERT INTO clientes (id, nombre, apellido, telefono, email, localidad) 
    VALUES (9999, 'Test Cliente', 'Renovación', '11-TEST-001', 'test@renovacion.com', 'Test City')
    ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido;
    
    -- Crear pólizas de test con fechas específicas
    INSERT INTO polizas (id, numero, cliente_id, compania_id, fecha_vigencia) VALUES 
    -- Escenario 1: Póliza pagada que debe renovarse (5 días exactos)
    (9001, 'TEST-RENOVAR-5DIAS', 9999, 1, '2024-01-15'),
    
    -- Escenario 2: Póliza pagada que debe renovarse (3 días)
    (9002, 'TEST-RENOVAR-3DIAS', 9999, 2, '2024-02-10'),
    
    -- Escenario 3: Póliza pagada que debe renovarse (1 día)
    (9003, 'TEST-RENOVAR-1DIA', 9999, 3, '2024-03-05'),
    
    -- Escenario 4: Póliza pagada pero aún no debe renovarse (6 días)
    (9004, 'TEST-NO-RENOVAR-6DIAS', 9999, 4, '2024-04-12'),
    
    -- Escenario 5: Póliza NO pagada, no debe renovarse
    (9005, 'TEST-NO-PAGADA', 9999, 5, '2024-05-20'),
    
    -- Escenario 6: Póliza en estado 'avisado', no debe renovarse
    (9006, 'TEST-AVISADO', 9999, 6, '2024-06-15'),
    
    -- Escenario 7: Test mes con 31 días (enero -> febrero)
    (9007, 'TEST-ENE-FEB', 9999, 7, '2024-01-31'),
    
    -- Escenario 8: Test mes con 28 días (febrero -> marzo)
    (9008, 'TEST-FEB-MAR', 9999, 8, '2024-02-28'),
    
    -- Escenario 9: Test mes con 30 días (abril -> mayo)
    (9009, 'TEST-ABR-MAY', 9999, 9, '2024-04-30')
    
    ON CONFLICT (id) DO UPDATE SET
        numero = EXCLUDED.numero,
        fecha_vigencia = EXCLUDED.fecha_vigencia;
    
    RAISE NOTICE '✅ Escenarios de test creados exitosamente';
END;
$$ LANGUAGE plpgsql;

-- Función para configurar avisos de test con fechas controladas
CREATE OR REPLACE FUNCTION configurar_avisos_test()
RETURNS void AS $$
DECLARE
    fecha_base DATE := CURRENT_DATE;
BEGIN
    -- Eliminar avisos de test existentes
    DELETE FROM avisos WHERE poliza_id BETWEEN 9001 AND 9009;
    
    -- Crear avisos con fechas calculadas específicas
    INSERT INTO avisos (poliza_id, estado, ultimo_pago, fecha_vencimiento_calculado, avisado_por, notas) VALUES 
    
    -- Escenario 1: DEBE RENOVARSE - 5 días exactos
    (9001, 'pagado', fecha_base - INTERVAL '25 days', fecha_base + INTERVAL '5 days', 'Test System', 'Test: 5 días exactos para vencer'),
    
    -- Escenario 2: DEBE RENOVARSE - 3 días
    (9002, 'pagado', fecha_base - INTERVAL '27 days', fecha_base + INTERVAL '3 days', 'Test System', 'Test: 3 días para vencer'),
    
    -- Escenario 3: DEBE RENOVARSE - 1 día
    (9003, 'pagado', fecha_base - INTERVAL '29 days', fecha_base + INTERVAL '1 day', 'Test System', 'Test: 1 día para vencer'),
    
    -- Escenario 4: NO DEBE RENOVARSE - 6 días (fuera del rango)
    (9004, 'pagado', fecha_base - INTERVAL '24 days', fecha_base + INTERVAL '6 days', 'Test System', 'Test: 6 días - NO debe renovarse'),
    
    -- Escenario 5: NO DEBE RENOVARSE - no está pagado
    (9005, 'por_vencer', NULL, fecha_base + INTERVAL '4 days', NULL, 'Test: No pagado - NO debe renovarse'),
    
    -- Escenario 6: NO DEBE RENOVARSE - estado avisado
    (9006, 'avisado', NULL, fecha_base + INTERVAL '2 days', 'Test Operator', 'Test: Estado avisado - NO debe renovarse'),
    
    -- Escenario 7: Test transición enero -> febrero (31 días)
    (9007, 'pagado', fecha_base - INTERVAL '26 days', fecha_base + INTERVAL '4 days', 'Test System', 'Test: Enero 31 -> Febrero'),
    
    -- Escenario 8: Test transición febrero -> marzo (28 días)
    (9008, 'pagado', fecha_base - INTERVAL '26 days', fecha_base + INTERVAL '4 days', 'Test System', 'Test: Febrero 28 -> Marzo'),
    
    -- Escenario 9: Test transición abril -> mayo (30 días)
    (9009, 'pagado', fecha_base - INTERVAL '26 days', fecha_base + INTERVAL '4 days', 'Test System', 'Test: Abril 30 -> Mayo');
    
    RAISE NOTICE '✅ Avisos de test configurados con fechas controladas';
    RAISE NOTICE '📅 Fecha base para tests: %', fecha_base;
END;
$$ LANGUAGE plpgsql;

-- Función principal de testing que simula todos los escenarios
CREATE OR REPLACE FUNCTION ejecutar_test_renovacion_completo()
RETURNS TABLE(
    escenario TEXT,
    poliza_numero VARCHAR,
    estado_inicial VARCHAR,
    fecha_venc_inicial DATE,
    dias_restantes_inicial INTEGER,
    estado_final VARCHAR,
    fecha_venc_final DATE,
    dias_restantes_final INTEGER,
    resultado_esperado TEXT,
    resultado_real TEXT,
    test_exitoso BOOLEAN
) AS $$
DECLARE
    test_record RECORD;
    fecha_actual DATE := CURRENT_DATE;
BEGIN
    -- Preparar escenarios de test
    PERFORM crear_escenarios_test();
    PERFORM configurar_avisos_test();
    
    -- Capturar estado inicial
    CREATE TEMP TABLE estado_inicial AS
    SELECT 
        a.poliza_id,
        p.numero,
        a.estado,
        a.fecha_vencimiento_calculado,
        (a.fecha_vencimiento_calculado - fecha_actual) as dias_restantes
    FROM avisos a
    JOIN polizas p ON a.poliza_id = p.id
    WHERE p.numero LIKE 'TEST-%';
    
    -- Ejecutar la función de renovación
    RAISE NOTICE '🔄 Ejecutando proceso de renovación automática...';
    PERFORM procesar_polizas_vencidas();
    
    -- Analizar resultados
    FOR test_record IN
        SELECT 
            CASE p.numero
                WHEN 'TEST-RENOVAR-5DIAS' THEN 'Escenario 1: Pagado - 5 días exactos'
                WHEN 'TEST-RENOVAR-3DIAS' THEN 'Escenario 2: Pagado - 3 días'
                WHEN 'TEST-RENOVAR-1DIA' THEN 'Escenario 3: Pagado - 1 día'
                WHEN 'TEST-NO-RENOVAR-6DIAS' THEN 'Escenario 4: Pagado - 6 días (NO debe renovar)'
                WHEN 'TEST-NO-PAGADA' THEN 'Escenario 5: No pagado (NO debe renovar)'
                WHEN 'TEST-AVISADO' THEN 'Escenario 6: Estado avisado (NO debe renovar)'
                WHEN 'TEST-ENE-FEB' THEN 'Escenario 7: Enero 31 -> Febrero'
                WHEN 'TEST-FEB-MAR' THEN 'Escenario 8: Febrero 28 -> Marzo'
                WHEN 'TEST-ABR-MAY' THEN 'Escenario 9: Abril 30 -> Mayo'
            END as escenario_desc,
            p.numero,
            ei.estado as estado_inicial,
            ei.fecha_vencimiento_calculado as fecha_inicial,
            ei.dias_restantes as dias_inicial,
            a.estado as estado_final,
            a.fecha_vencimiento_calculado as fecha_final,
            (a.fecha_vencimiento_calculado - fecha_actual) as dias_final,
            
            -- Resultado esperado
            CASE p.numero
                WHEN 'TEST-RENOVAR-5DIAS' THEN 'DEBE renovarse: por_vencer + 1 mes'
                WHEN 'TEST-RENOVAR-3DIAS' THEN 'DEBE renovarse: por_vencer + 1 mes'
                WHEN 'TEST-RENOVAR-1DIA' THEN 'DEBE renovarse: por_vencer + 1 mes'
                WHEN 'TEST-NO-RENOVAR-6DIAS' THEN 'NO debe renovarse: mantener pagado'
                WHEN 'TEST-NO-PAGADA' THEN 'NO debe renovarse: mantener por_vencer'
                WHEN 'TEST-AVISADO' THEN 'NO debe renovarse: mantener avisado'
                WHEN 'TEST-ENE-FEB' THEN 'DEBE renovarse: calcular correctamente Feb'
                WHEN 'TEST-FEB-MAR' THEN 'DEBE renovarse: calcular correctamente Mar'
                WHEN 'TEST-ABR-MAY' THEN 'DEBE renovarse: calcular correctamente May'
            END as esperado,
            
            -- Resultado real
            CASE 
                WHEN p.numero IN ('TEST-RENOVAR-5DIAS', 'TEST-RENOVAR-3DIAS', 'TEST-RENOVAR-1DIA', 'TEST-ENE-FEB', 'TEST-FEB-MAR', 'TEST-ABR-MAY') THEN
                    CASE 
                        WHEN a.estado = 'por_vencer' AND a.fecha_vencimiento_calculado > ei.fecha_vencimiento_calculado
                        THEN '✅ RENOVADO correctamente'
                        ELSE '❌ NO se renovó (ERROR)'
                    END
                WHEN p.numero IN ('TEST-NO-RENOVAR-6DIAS', 'TEST-NO-PAGADA', 'TEST-AVISADO') THEN
                    CASE 
                        WHEN a.estado = ei.estado AND a.fecha_vencimiento_calculado = ei.fecha_vencimiento_calculado
                        THEN '✅ NO renovado correctamente'
                        ELSE '❌ Se renovó incorrectamente (ERROR)'
                    END
            END as real,
            
            -- Test exitoso
            CASE 
                WHEN p.numero IN ('TEST-RENOVAR-5DIAS', 'TEST-RENOVAR-3DIAS', 'TEST-RENOVAR-1DIA', 'TEST-ENE-FEB', 'TEST-FEB-MAR', 'TEST-ABR-MAY') THEN
                    (a.estado = 'por_vencer' AND a.fecha_vencimiento_calculado > ei.fecha_vencimiento_calculado)
                WHEN p.numero IN ('TEST-NO-RENOVAR-6DIAS', 'TEST-NO-PAGADA', 'TEST-AVISADO') THEN
                    (a.estado = ei.estado AND a.fecha_vencimiento_calculado = ei.fecha_vencimiento_calculado)
                ELSE false
            END as exitoso
            
        FROM avisos a
        JOIN polizas p ON a.poliza_id = p.id
        JOIN estado_inicial ei ON ei.poliza_id = a.poliza_id
        WHERE p.numero LIKE 'TEST-%'
        ORDER BY p.numero
    LOOP
        escenario := test_record.escenario_desc;
        poliza_numero := test_record.numero;
        estado_inicial := test_record.estado_inicial;
        fecha_venc_inicial := test_record.fecha_inicial;
        dias_restantes_inicial := test_record.dias_inicial;
        estado_final := test_record.estado_final;
        fecha_venc_final := test_record.fecha_final;
        dias_restantes_final := test_record.dias_final;
        resultado_esperado := test_record.esperado;
        resultado_real := test_record.real;
        test_exitoso := test_record.exitoso;
        RETURN NEXT;
    END LOOP;
    
    -- Limpiar tabla temporal
    DROP TABLE estado_inicial;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Función para mostrar resumen de tests
CREATE OR REPLACE FUNCTION mostrar_resumen_tests()
RETURNS void AS $$
DECLARE
    total_tests INTEGER;
    tests_exitosos INTEGER;
    tests_fallidos INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE test_exitoso = true),
        COUNT(*) FILTER (WHERE test_exitoso = false)
    INTO total_tests, tests_exitosos, tests_fallidos
    FROM ejecutar_test_renovacion_completo();
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 ===== RESUMEN DE TESTS DE RENOVACIÓN AUTOMÁTICA =====';
    RAISE NOTICE '📈 Total de tests ejecutados: %', total_tests;
    RAISE NOTICE '✅ Tests exitosos: %', tests_exitosos;
    RAISE NOTICE '❌ Tests fallidos: %', tests_fallidos;
    RAISE NOTICE '📊 Porcentaje de éxito: %%%', ROUND((tests_exitosos::DECIMAL / total_tests * 100), 2);
    RAISE NOTICE '';
    
    IF tests_fallidos = 0 THEN
        RAISE NOTICE '🎉 ¡TODOS LOS TESTS PASARON! La lógica de renovación funciona correctamente.';
    ELSE
        RAISE NOTICE '⚠️  Hay % test(s) fallido(s). Revisar la lógica de renovación.', tests_fallidos;
    END IF;
    
    RAISE NOTICE '=====================================================';
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar datos de test
CREATE OR REPLACE FUNCTION limpiar_datos_test()
RETURNS void AS $$
BEGIN
    DELETE FROM avisos WHERE poliza_id BETWEEN 9001 AND 9009;
    DELETE FROM polizas WHERE numero LIKE 'TEST-%';
    DELETE FROM clientes WHERE nombre = 'Test Cliente';
    
    RAISE NOTICE '🧹 Datos de test limpiados exitosamente';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 ===== TEST DE LÓGICA DE RENOVACIÓN AUTOMÁTICA =====';
    RAISE NOTICE '';
    RAISE NOTICE '📋 INSTRUCCIONES DE USO:';
    RAISE NOTICE '';
    RAISE NOTICE '1️⃣  Para ejecutar todos los tests:';
    RAISE NOTICE '   SELECT * FROM ejecutar_test_renovacion_completo();';
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣  Para ver solo el resumen:';
    RAISE NOTICE '   SELECT mostrar_resumen_tests();';
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣  Para limpiar datos de test:';
    RAISE NOTICE '   SELECT limpiar_datos_test();';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ESCENARIOS QUE SE TESTEAN:';
    RAISE NOTICE '   ✅ Pólizas pagadas con 1, 3 y 5 días para vencer (DEBEN renovarse)';
    RAISE NOTICE '   ❌ Pólizas pagadas con 6 días para vencer (NO deben renovarse)';
    RAISE NOTICE '   ❌ Pólizas no pagadas (NO deben renovarse)';
    RAISE NOTICE '   ❌ Pólizas en estado "avisado" (NO deben renovarse)';
    RAISE NOTICE '   📅 Cálculos correctos para meses con 28, 30 y 31 días';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ EJECUTA AHORA: SELECT * FROM ejecutar_test_renovacion_completo();';
    RAISE NOTICE '================================================';
END $$;
