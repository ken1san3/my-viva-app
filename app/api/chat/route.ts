import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, code }: { messages: UIMessage[]; code?: string } = await req.json();

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
      // 大量アクセス・高速応答に特化した最軽量モデルを指定
      model: google('gemini-2.5-flash-lite'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    // 最新のAI SDK仕様に合わせた、最もシンプルなストリーム返却
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}