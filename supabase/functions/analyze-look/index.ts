// Arquivo: supabase/functions/analyze-look/index.ts
// Esta função recebe uma imagem de um look, a envia para a API do Google Gemini para análise
// e retorna um feedback de estilo estruturado em formato JSON.

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
  // Trata a requisição pre-flight de CORS, essencial para chamadas do navegador.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Erro de configuração: A chave GEMINI_API_KEY não está configurada nos segredos da Supabase.");
    }

    // Extrai a imagem em base64 do corpo da requisição.
    const { image } = await req.json();
    if (!image) {
      throw new Error("Nenhuma imagem fornecida no corpo da requisição.");
    }

    // Inicializa o cliente da I.A. generativa do Google.
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Define o prompt para a I.A., instruindo-a a analisar o look e retornar um JSON.
    const prompt = "Analise o look da pessoa nesta imagem. Forneça uma análise de estilo concisa com: 1. Pontos Fortes, 2. Pontos de Atenção, 3. Sugestão de Melhoria, e 4. Dica Extra. Responda em português do Brasil, em formato JSON com as chaves 'pontos_fortes', 'pontos_atencao', 'sugestao_melhoria', 'dica_extra'.";

    // Prepara os dados da imagem para a API.
    const imagePart = {
      inlineData: {
        data: image.split(",")[1], // Remove o prefixo "data:image/jpeg;base64,"
        mimeType: "image/jpeg",
      },
    };

    // Envia o prompt e a imagem para o modelo Gemini.
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Retorna a resposta da I.A. (que deve ser um JSON) para o cliente.
    return new Response(text, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Em caso de erro, loga no servidor e retorna uma mensagem de erro para o cliente.
    console.error("Erro na Edge Function 'analyze-look':", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});