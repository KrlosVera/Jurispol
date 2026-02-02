
import { Message, GroundingSource } from "../types";

export class GeminiService {
  
  // Ahora nos comunicamos con nuestro propio backend, no directamente con Google.
  private readonly API_URL = '/api/chat';

  async sendMessage(history: Message[], userInput: string): Promise<{ text: string; sources: GroundingSource[] }> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: history,
          message: userInput
        }),
      });

      // Manejo de errores HTTP
      if (!response.ok) {
        let errorMsg = `Error del servidor (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.details) errorMsg += `: ${errorData.details}`;
          else if (errorData.error) errorMsg += `: ${errorData.error}`;
        } catch (e) {
          // Si no es JSON, leemos texto
          const text = await response.text();
          if (text) errorMsg += `: ${text}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return { 
        text: data.text, 
        sources: data.sources || [] 
      };

    } catch (error: any) {
      console.error("Error en GeminiService:", error);
      
      // Mensajes amigables para el usuario
      if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error("No se pudo conectar con el servidor Backend. Asegúrate de ejecutar 'node server.js'.");
      }
      
      throw new Error(error.message || "Error de comunicación con JurisPol.");
    }
  }
}

export const geminiService = new GeminiService();
