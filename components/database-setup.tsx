"use client"

import { useState } from "react"
import { Database, Play, CheckCircle, AlertCircle, Copy, ExternalLink, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DatabaseSetupProps {
  onRetry?: () => void
}

export default function DatabaseSetup({ onRetry }: DatabaseSetupProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  const copyToClipboard = async (text: string, scriptName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedScript(scriptName)
      setTimeout(() => setCopiedScript(null), 2000)
    } catch (err) {
      console.error("Error copying to clipboard:", err)
    }
  }

  // Script de configuración principal
  const setupScript = `-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN PARA GESTORPÓLIZAS
-- Ejecutar en el editor SQL de Supabase
-- =====================================================

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

-- Tabla de pólizas
CREATE TABLE IF NOT EXISTS polizas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(100) NOT NULL,
  compania_id INTEGER NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de avisos (para el dashboard Kanban)
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

-- Índices para optimización
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

-- Función para crear avisos automáticamente
CREATE OR REPLACE FUNCTION create_aviso_for_poliza()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_vencimiento IS NOT NULL THEN
    INSERT INTO avisos (poliza_id, estado)
    VALUES (NEW.id, 'por_vencer');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para crear avisos automáticamente
DROP TRIGGER IF EXISTS create_aviso_trigger ON polizas;
CREATE TRIGGER create_aviso_trigger AFTER INSERT ON polizas FOR EACH ROW EXECUTE FUNCTION create_aviso_for_poliza();`

  // Script de datos de ejemplo
  const seedScript = `-- =====================================================
-- DATOS DE EJEMPLO PARA GESTORPÓLIZAS
-- Ejecutar DESPUÉS del script de configuración
-- =====================================================

-- Insertar compañías
INSERT INTO companias (nombre) VALUES 
  ('Allianz'), ('Orbiz'), ('La Caja'), ('Sancor Seguros'),
  ('Federación Patronal'), ('Rivadavia Seguros'), ('Mapfre'), ('Zurich')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar clientes
INSERT INTO clientes (apellido, nombre, telefono, email, localidad) VALUES 
  ('González', 'Carlos Alberto', '+54 299 123 4567', 'carlos.gonzalez@email.com', 'Neuquén, Neuquén'),
  ('Rodríguez', 'María Elena', '+54 11 4567-8901', 'maria.rodriguez@email.com', 'Buenos Aires, CABA'),
  ('López', 'Ana Sofía', '+54 11 8765-4321', 'ana.lopez@email.com', 'Córdoba, Córdoba'),
  ('Martínez', 'Roberto José', '+54 11 5432-1098', 'roberto.martinez@email.com', 'Rosario, Santa Fe'),
  ('García', 'Laura Patricia', '+54 261 987-6543', 'laura.garcia@email.com', 'Mendoza, Mendoza'),
  ('Fernández', 'Diego Alejandro', '+54 351 456-7890', 'diego.fernandez@email.com', 'Villa Carlos Paz, Córdoba')
ON CONFLICT DO NOTHING;

-- Insertar pólizas con fechas estratégicas
DO $$
DECLARE
    cliente_carlos_id INTEGER;
    cliente_maria_id INTEGER;
    cliente_ana_id INTEGER;
    cliente_roberto_id INTEGER;
    cliente_laura_id INTEGER;
    cliente_diego_id INTEGER;
    compania_allianz_id INTEGER;
    compania_orbiz_id INTEGER;
    compania_lacaja_id INTEGER;
    compania_sancor_id INTEGER;
BEGIN
    -- Obtener IDs
    SELECT id INTO cliente_carlos_id FROM clientes WHERE apellido = 'González' LIMIT 1;
    SELECT id INTO cliente_maria_id FROM clientes WHERE apellido = 'Rodríguez' LIMIT 1;
    SELECT id INTO cliente_ana_id FROM clientes WHERE apellido = 'López' LIMIT 1;
    SELECT id INTO cliente_roberto_id FROM clientes WHERE apellido = 'Martínez' LIMIT 1;
    SELECT id INTO cliente_laura_id FROM clientes WHERE apellido = 'García' LIMIT 1;
    SELECT id INTO cliente_diego_id FROM clientes WHERE apellido = 'Fernández' LIMIT 1;
    
    SELECT id INTO compania_allianz_id FROM companias WHERE nombre = 'Allianz' LIMIT 1;
    SELECT id INTO compania_orbiz_id FROM companias WHERE nombre = 'Orbiz' LIMIT 1;
    SELECT id INTO compania_lacaja_id FROM companias WHERE nombre = 'La Caja' LIMIT 1;
    SELECT id INTO compania_sancor_id FROM companias WHERE nombre = 'Sancor Seguros' LIMIT 1;
    
    -- Pólizas que vencen pronto (por_vencer)
    INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
    ('POL-001234', compania_allianz_id, cliente_carlos_id, '2024-01-15', CURRENT_DATE + INTERVAL '1 day'),
    ('POL-005678', compania_orbiz_id, cliente_maria_id, '2024-03-10', CURRENT_DATE + INTERVAL '3 days'),
    ('POL-009012', compania_lacaja_id, cliente_ana_id, '2023-12-05', CURRENT_DATE + INTERVAL '4 days'),
    ('POL-003456', compania_sancor_id, cliente_roberto_id, '2024-02-20', CURRENT_DATE + INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
    
    -- Pólizas para estado avisado
    INSERT INTO polizas (numero, compania_id, cliente_id, fecha_inicio, fecha_vencimiento) VALUES 
    ('POL-007890', compania_allianz_id, cliente_laura_id, '2024-01-10', CURRENT_DATE + INTERVAL '10 days'),
    ('POL-001122', compania_orbiz_id, cliente_diego_id, '2024-02-15', CURRENT_DATE + INTERVAL '15 days')
    ON CONFLICT DO NOTHING;
END $$;

-- Configurar estados de avisos
SELECT pg_sleep(1);

UPDATE avisos SET estado = 'avisado', fecha_aviso = NOW() - INTERVAL '2 days' 
WHERE poliza_id IN (SELECT id FROM polizas WHERE numero IN ('POL-007890', 'POL-001122'));

-- Verificación
SELECT 'Compañías: ' || COUNT(*) FROM companias
UNION ALL SELECT 'Clientes: ' || COUNT(*) FROM clientes
UNION ALL SELECT 'Pólizas: ' || COUNT(*) FROM polizas
UNION ALL SELECT 'Avisos: ' || COUNT(*) FROM avisos;`

  const steps = [
    {
      number: 1,
      title: "Acceder a Supabase",
      description: "Ve a tu proyecto en Supabase Dashboard",
      action: "Abrir Supabase",
      url: "https://supabase.com/dashboard",
    },
    {
      number: 2,
      title: "Abrir Editor SQL",
      description: "En el menú lateral, busca y haz clic en 'SQL Editor'",
      action: "Continuar",
    },
    {
      number: 3,
      title: "Ejecutar Script de Configuración",
      description: "Copia y pega el script de configuración completo",
      action: "Copiar Script",
    },
    {
      number: 4,
      title: "Ejecutar Datos de Ejemplo",
      description: "Ejecuta el script de datos para tener información inicial",
      action: "Copiar Script",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Configuración de Base de Datos</CardTitle>
            <p className="text-gray-600 mt-2">Configura las tablas en Supabase para usar GestorPólizas</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Las tablas de la base de datos no existen. Sigue estos pasos para configurar tu proyecto.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="guide" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="guide">Guía Paso a Paso</TabsTrigger>
                <TabsTrigger value="scripts">Scripts SQL</TabsTrigger>
                <TabsTrigger value="troubleshoot">Solución de Problemas</TabsTrigger>
              </TabsList>

              <TabsContent value="guide" className="space-y-4">
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <Card
                      key={step.number}
                      className={`border-l-4 ${currentStep >= step.number ? "border-l-green-500 bg-green-50" : "border-l-gray-300"}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                currentStep > step.number
                                  ? "bg-green-500 text-white"
                                  : currentStep === step.number
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-300 text-gray-600"
                              }`}
                            >
                              {currentStep > step.number ? <CheckCircle className="w-4 h-4" /> : step.number}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{step.title}</h3>
                              <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {step.url && (
                              <Button variant="outline" size="sm" onClick={() => window.open(step.url, "_blank")}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {step.action}
                              </Button>
                            )}
                            {!step.url && step.number <= 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep(step.number + 1)}
                                disabled={currentStep < step.number}
                              >
                                {step.action}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="scripts" className="space-y-4">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="w-5 h-5 text-blue-600" />
                        1. Script de Configuración Principal
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Ejecuta este script primero para crear todas las tablas, índices y triggers
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-80">
                          <code>{setupScript}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(setupScript, "setup")}
                        >
                          {copiedScript === "setup" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="w-5 h-5 text-green-600" />
                        2. Datos de Ejemplo
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Ejecuta este script después para agregar datos de ejemplo y probar la aplicación
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-80">
                          <code>{seedScript}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(seedScript, "seed")}
                        >
                          {copiedScript === "seed" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="troubleshoot" className="space-y-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-orange-600">Problemas Comunes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="border-l-4 border-l-orange-400 pl-4">
                          <h4 className="font-medium text-gray-900">Error: "relation does not exist"</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Las tablas no se crearon correctamente. Ejecuta el script de configuración completo.
                          </p>
                        </div>

                        <div className="border-l-4 border-l-red-400 pl-4">
                          <h4 className="font-medium text-gray-900">Error: "permission denied"</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Verifica que las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY estén configuradas.
                          </p>
                        </div>

                        <div className="border-l-4 border-l-blue-400 pl-4">
                          <h4 className="font-medium text-gray-900">Los datos no aparecen</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Asegúrate de ejecutar el script de datos de ejemplo después del script de configuración.
                          </p>
                        </div>

                        <div className="border-l-4 border-l-purple-400 pl-4">
                          <h4 className="font-medium text-gray-900">Quiero empezar de nuevo</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Usa el script de reset para limpiar todas las tablas y empezar desde cero.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Script de Reset (Opcional)</CardTitle>
                      <p className="text-sm text-gray-600">
                        ⚠️ Este script elimina TODOS los datos. Úsalo solo si quieres empezar desde cero.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="bg-red-900 text-red-100 p-4 rounded-lg text-sm overflow-x-auto max-h-40">
                          <code>{`-- ELIMINAR TODAS LAS TABLAS (CUIDADO!)
DROP TABLE IF EXISTS avisos CASCADE;
DROP TABLE IF EXISTS polizas CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS companias CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_aviso_for_poliza() CASCADE;`}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard(
                              `DROP TABLE IF EXISTS avisos CASCADE;\nDROP TABLE IF EXISTS polizas CASCADE;\nDROP TABLE IF EXISTS clientes CASCADE;\nDROP TABLE IF EXISTS companias CASCADE;\nDROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;\nDROP FUNCTION IF EXISTS create_aviso_for_poliza() CASCADE;`,
                              "reset",
                            )
                          }
                        >
                          {copiedScript === "reset" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-center pt-4">
              <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Verificar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
