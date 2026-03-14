import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

function buildRequestBody(audio: string, empresa: string) {
  const systemPrompt = `Eres un analista técnico. Analiza este audio y el nombre de la empresa seleccionada ("${empresa}"). Genera: 1. Un título técnico conciso para la tarea, 2. Una descripción detallada para un desarrollador.`;

  return JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "audio/webm", data: audio } },
          { text: `Empresa: ${empresa}. Analiza el audio y genera el título técnico y la descripción detallada.` },
        ],
      },
    ],
    tools: [
      {
        functionDeclarations: [
          {
            name: "create_task",
            description: "Crea una tarea técnica a partir del análisis del audio.",
            parameters: {
              type: "OBJECT",
              properties: {
                titulo: { type: "STRING", description: "Título técnico conciso de la tarea" },
                descripcion: { type: "STRING", description: "Descripción detallada para un desarrollador" },
              },
              required: ["titulo", "descripcion"],
            },
          },
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["create_task"] },
    },
  });
}

function extractResult(data: any): { titulo: string; descripcion: string } | null {
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part.functionCall) {
      const args = part.functionCall.args;
      return { titulo: args.titulo, descripcion: args.descripcion };
    }
  }

  for (const part of parts) {
    if (part.text) {
      const jsonMatch = part.text.match(/\{[\s\S]*"titulo"[\s\S]*"descripcion"[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audio, empresa } = await req.json();
    if (!audio || !empresa) {
      return new Response(JSON.stringify({ error: "audio y empresa son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const body = buildRequestBody(audio, empresa);

    for (const model of MODELS) {
      console.log(`Intentando con modelo: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      if (response.status === 429) {
        console.warn(`Modelo ${model} rate-limited (429), probando siguiente modelo...`);
        await response.text(); // consume body
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`Gemini API error (${model}):`, response.status, text);
        return new Response(JSON.stringify({ error: "Error al procesar con Gemini" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const result = extractResult(data);

      if (result) {
        console.log(`Resultado exitoso con modelo: ${model}`);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "No se pudo extraer la información del audio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All models were rate-limited
    return new Response(JSON.stringify({ error: "Límite de solicitudes excedido en todos los modelos. Intenta más tarde." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-task error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
