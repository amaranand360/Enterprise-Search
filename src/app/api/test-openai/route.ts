import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Test with a simple request
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        {"role": "user", "content": "write a haiku about ai"},
      ],
      max_tokens: 100,
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ 
      success: true,
      content,
      model: completion.model,
      usage: completion.usage
    });
  } catch (error: any) {
    console.error('OpenAI API test error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to test OpenAI API',
        status: error.status || 500
      },
      { status: error.status || 500 }
    );
  }
}
