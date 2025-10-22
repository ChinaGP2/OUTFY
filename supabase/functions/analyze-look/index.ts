// Arquivo: supabase/functions/analyze-look/index.ts
// Recebe uma selfie, envia para a API do Gemini para análise de coloração pessoal
// e retorna a estação e a paleta de cores em formato JSON.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// Carrega a chave da API do Gemini a partir dos segredos do projeto Supabase.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Define os cabeçalhos CORS para permitir requisições de qualquer origem.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Trata a requisição pre-flight de CORS.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Erro de configuração: A chave GEMINI_API_KEY não está configurada.");
    }

    // Extrai a imagem em base64 do corpo da requisição.
    const { image } = await req.json();
    if (!image) {
      throw new Error("Nenhuma imagem fornecida no corpo da requisição.");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prompt detalhado para a análise de LOOK.
    const promptText = `
      Aja como uma consultora de estilo e moda digital. Analise a imagem do look fornecida.
      Seu feedback deve ser construtivo, amigável e encorajador.
      Responda em português do Brasil, em um formato JSON, contendo as seguintes chaves:
      - "pontos_fortes": Uma string descrevendo o que funciona bem no look (combinação de cores, caimento, peças interessantes).
      - "pontos_atencao": Uma string com pontos que poderiam ser diferentes, mas de forma sutil (ex: "Talvez um sapato de outra cor...").
      - "sugestao_melhoria": Uma string com uma sugestão clara de como o look poderia ser elevado (ex: "Experimente adicionar um cinto para marcar a cintura.").
      - "dica_extra": Uma string com uma dica de styling rápida e interessante relacionada ao look (ex: "Dobrar a barra da calça pode dar um toque mais moderno.").
      Se a imagem não for um look ou for inadequada, retorne um erro. O JSON deve ser limpo, sem markdown.
    `;

    const match = image.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match || match.length !== 3) throw new Error("Formato de imagem base64 inválido.");
    const imagePart = { inlineData: { data: match[2], mimeType: match[1] } };

    const result = await model.generateContent([promptText, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonResponse = JSON.parse(jsonString);

    return new Response(JSON.stringify(jsonResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na Edge Function 'analyze-look':", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});