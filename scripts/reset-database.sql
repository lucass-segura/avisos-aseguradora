-- =====================================================
-- SCRIPT PARA LIMPIAR LA BASE DE DATOS
-- ⚠️  CUIDADO: Este script elimina TODOS los datos
-- =====================================================

-- Eliminar todas las tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS avisos CASCADE;
DROP TABLE IF EXISTS polizas CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS companias CASCADE;

-- Eliminar funciones personalizadas
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_aviso_for_poliza() CASCADE;

-- Verificar que las tablas fueron eliminadas
DO $$
BEGIN
  RAISE NOTICE '=== LIMPIEZA COMPLETADA ===';
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companias') THEN
    RAISE NOTICE '✓ Tabla companias: ELIMINADA';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clientes') THEN
    RAISE NOTICE '✓ Tabla clientes: ELIMINADA';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'polizas') THEN
    RAISE NOTICE '✓ Tabla polizas: ELIMINADA';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'avisos') THEN
    RAISE NOTICE '✓ Tabla avisos: ELIMINADA';
  END IF;
  
  RAISE NOTICE '=== BASE DE DATOS LIMPIA ===';
  RAISE NOTICE 'Ahora puedes ejecutar setup-database.sql';
END $$;
