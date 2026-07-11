import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Groq OpenAI-compatible client
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

// We use llama-3.3-70b-versatile as the main versatile model for general text tasks
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, text, docContent, messages } = body;

    // 1. Handle Document Chat Q&A
    if (docContent !== undefined && messages !== undefined) {
      if (!process.env.GROQ_API_KEY) {
        const lastMessage = messages[messages.length - 1]?.content || '';
        return new Response(
          JSON.stringify({ 
            text: `[Mock AI Mode] That's a great question: "${lastMessage}". Set a GROQ_API_KEY in your .env file to enable live responses! (Doc length: ${docContent.length} chars)` 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt = `You are a helpful AI writing assistant. You have access to the full content of the user's document below. Help them answer questions, write copy, or summarize sections based ONLY on the document content provided. Keep answers concise, direct, and well-formatted in markdown.

<DOCUMENT>
${docContent}
</DOCUMENT>`;

      const response = await generateText({
        model: groq(GROQ_MODEL),
        system: systemPrompt,
        messages: messages.map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role,
          content: m.content
        }))
      });

      return new Response(JSON.stringify({ text: response.text }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Handle Text Summarization / Toolbar AI Magic
    const targetText = text || prompt || '';
    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ 
          summary: `[Mock AI Mode] Summarized context:\n\n${targetText.slice(0, 100)}...` 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await generateText({
      model: groq(GROQ_MODEL),
      prompt: `You are an AI assistant in a text editor. Write a brief summary or continuation for this selected text:\n\n${targetText}`,
    });

    return new Response(JSON.stringify({ summary: response.text }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('AI Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `AI error occurred: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
