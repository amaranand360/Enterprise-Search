import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Securely load from environment variables
});

export async function POST(request: Request) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { messages, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 500 } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Use the requested model (default: gpt-4o-mini)
    const response = await openai.chat.completions.create({
      model, // Use the model specified in the request or default to gpt-4o-mini
      messages,
      temperature,
      max_tokens, // Use the max_tokens from the request
      store: true, // Enable storage for better tracking
    });

    const content = response.choices[0].message.content;

    return NextResponse.json({ 
      content,
      usage: response.usage // Track usage for free tier monitoring
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Handle rate limiting for free tier
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Handle quota exceeded
    if (error.status === 402) {
      return NextResponse.json(
        { error: 'Free quota exceeded. Please upgrade your plan.' },
        { status: 402 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}