import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, code }: { messages: UIMessage[]; code?: string } =
      await req.json();

    const systemPrompt = code
      ? `あなたは中学生にプログラミングを教える、親しみやすい先生です。
生徒が以下のコードを提出しました：

${code}

【重要ルール】
1. 思考させることを重視
2. 難しい言葉を使わない
3. 1つだけ質問する
4. すぐ答えを言わない
5. 少しでも説明できたら褒める`
      : 'プログラミングの学習をサポートしてください。';

    const result = streamText({
      model: google('gemini-2.5-flash-lite'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      getErrorMessage: (error) =>
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'unknown error',
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}