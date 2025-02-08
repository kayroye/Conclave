import { Message } from 'ai';
import { AIProvider, User } from '../types';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  private ollamaEndpoint: string | null = null;

  constructor(user: User) {
    if (user.apiKeys?.openai) {
      this.openai = new OpenAI({ apiKey: user.apiKeys.openai });
    }
    if (user.apiKeys?.anthropic) {
      this.anthropic = new Anthropic({ apiKey: user.apiKeys.anthropic });
    }
    if (user.apiKeys?.google) {
      this.googleAI = new GoogleGenerativeAI(user.apiKeys.google);
    }
    if (user.apiKeys?.ollamaEndpoint) {
      this.ollamaEndpoint = user.apiKeys.ollamaEndpoint;
    }
  }

  async generateResponse(
    provider: AIProvider,
    model: string,
    messages: Message[],
    systemPrompt?: string
  ): Promise<ReadableStream> {
    switch (provider) {
      case 'openai': {
        if (!this.openai) throw new Error('OpenAI API key not configured');
        const openAIMessages = messages.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content
        }));
        
        if (systemPrompt) {
          openAIMessages.unshift({ role: 'system', content: systemPrompt });
        }

        const response = await this.openai.chat.completions.create({
          model,
          messages: openAIMessages,
          stream: true,
        });

        return response.toReadableStream();
      }

      case 'anthropic': {
        if (!this.anthropic) throw new Error('Anthropic API key not configured');
        const anthropicMessages = messages.map(m => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        }));

        const response = await this.anthropic.messages.create({
          model,
          messages: anthropicMessages,
          system: systemPrompt,
          max_tokens: 4096,
          stream: true,
        });

        return response.toReadableStream();
      }

      case 'google': {
        if (!this.googleAI) throw new Error('Google AI API key not configured');
        const googleModel = this.googleAI.getGenerativeModel({ model });
        
        const prompt = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

        if (systemPrompt) {
          prompt.unshift({
            role: 'system',
            parts: [{ text: systemPrompt }]
          });
        }

        const response = await googleModel.generateContentStream({
          contents: prompt,
        });

        // Convert AsyncGenerator to ReadableStream
        return new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of response.stream) {
                const text = chunk.text();
                controller.enqueue(text);
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        });
      }

      case 'ollama': {
        if (!this.ollamaEndpoint) throw new Error('Ollama endpoint not configured');
        const response = await fetch(`${this.ollamaEndpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: systemPrompt 
              ? [{ role: 'system', content: systemPrompt }, ...messages]
              : messages,
            stream: true,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        return response.body!;
      }

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
} 