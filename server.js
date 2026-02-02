
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// 1. CARGA DE CONFIGURACIÓN
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 2. MIDDLEWARES
app.use(cors()); // Permite peticiones cruzadas si fuera necesario
app.use(express.json());

// 3. VALIDACIÓN DE SEGURIDAD
if (!process.env.API_KEY) {
  console.error("❌ ERROR CRÍTICO: No se encontró la variable 'API_KEY' en el archivo .env");
  process.exit(1);
}

// 4. INICIALIZACIÓN DE LA IA (Solo en el servidor)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Eres JurisPol, el asistente experto en la normatividad de la Policía Nacional de Colombia. 
Tu objetivo es proporcionar información jurídica precisa, técnica y actualizada a miembros de la institución y ciudadanos.

BASES NORMATIVAS PRINCIPALES:
- Código Nacional de Seguridad y Convivencia Ciudadana (Ley 1801 de 2016).
- Código Penal Colombiano (Ley 599 de 2000).
- Código de Procedimiento Penal (Ley 906 de 2004).
- Ley de Seguridad Ciudadana (Ley 2197 de 2022).
- Estatuto del Personal de la Policía Nacional (Ley 2179 de 2021).
- Manuales y protocolos de actuación policial vigentes.

REGLAS DE RESPUESTA:
1. CITA SIEMPRE artículos específicos y el nombre exacto de la norma.
2. USA un lenguaje técnico pero comprensible.
3. ESTRUCTURA las respuestas con pasos claros (1, 2, 3...) cuando se trate de procedimientos.
4. DIFERENCIA claramente entre una conducta contraria a la convivencia (Ley 1801) y un delito (Ley 599).
5. SIEMPRE utiliza la herramienta de búsqueda de Google para verificar si ha habido reformas recientes o sentencias de la Corte Constitucional que afecten la norma consultada.
6. Si una norma ha sido declarada inexequible, adviértelo de inmediato.

Tu tono debe ser profesional, institucional y servicial.
`;

// 5. RUTA API (El Frontend llamará aquí)
app.post('/api/chat', async (req, res) => {
  console.log(`📩 Recibida petición en /api/chat`);
  
  try {
    const { history, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es obligatorio" });
    }

    // Preparar historial para Gemini
    const chatHistory = Array.isArray(history) ? history : [];
    const contents = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Agregar mensaje actual
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log("🤖 Consultando a Gemini (Modelo Flash 2.5)...");

    // CAMBIO IMPORTANTE: Usamos 'gemini-2.5-flash' para máxima estabilidad y evitar errores 429.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Lo siento, no pude procesar esa consulta.";
    
    // Extraer fuentes
    const sources = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          if (!sources.some(s => s.uri === chunk.web.uri)) {
            sources.push({
              title: chunk.web.title,
              uri: chunk.web.uri
            });
          }
        }
      });
    }

    console.log("✅ Respuesta generada correctamente.");
    res.json({ text, sources });

  } catch (error) {
    console.error("❌ ERROR EN EL SERVIDOR:", error.message);
    
    // Manejo específico de cuota excedida (Error 429)
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
       return res.status(429).json({
         error: "El sistema está sobrecargado (Cuota excedida). Espera unos segundos.",
         details: "Quota exceeded"
       });
    }

    // Devolver mensaje de error general
    res.status(500).json({ 
      error: "Error interno procesando la solicitud.",
      details: error.message 
    });
  }
});

// 6. INICIO
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor JurisPol (Backend) LISTO.`);
  console.log(`   🔒 Modo Seguro: La API Key no está expuesta.`);
  console.log(`   📡 Escuchando en puerto: ${PORT}`);
});
