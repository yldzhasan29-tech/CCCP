// js/aiService.js

/**
 * Esta función simula la llamada a la API de Groq o Gemini.
 * Toma el texto libre que escribe el estudiante en el buscador y lo procesa.
 */
export async function parseRequestWithAI(userTextPrompt) {
  try {
    const text = userTextPrompt.toLowerCase();
    
    // Valores por defecto si el estudiante no especifica nada
    let timeFilter = "08:30"; 
    let wantsQuiet = false;
    let musicPreference = "any";

    // LÓGICA DE DETECCIÓN SIMULADA:
    // Buscamos horas comunes en el texto
    if (text.includes("9:00") || text.includes("9") || text.includes("девять")) {
        timeFilter = "09:00";
    }
    if (text.includes("8:45")) {
        timeFilter = "08:45";
    }
    
    // Detectamos si el usuario viene cansado o quiere silencio
    if (text.includes("dormir") || text.includes("спать") || text.includes("тишина") || text.includes("no hablar")) {
        wantsQuiet = true;
    }
    
    // Detectamos gustos musicales menciones
    if (text.includes("rock") || text.includes("рок")) {
        musicPreference = "Rock";
    }
    if (text.includes("techno") || text.includes("техно")) {
        musicPreference = "Techno";
    }

    // Devolvemos el resultado limpio estructurado en un JSON simulado
    return {
        time: timeFilter,
        music: musicPreference,
        wantsQuiet: wantsQuiet
    };
    
  } catch (error) {
    console.error("Error en el servicio de IA simulado:", error);
    // Retorno seguro por si algo falla
    return { time: "08:30", music: "any", wantsQuiet: false };
  }
}
