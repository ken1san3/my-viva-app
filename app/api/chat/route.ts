import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // execResult を受け取れるように型を拡張
    const { messages, code, execResult }: { 
      messages: UIMessage[]; 
      code?: string;
      execResult?: { output?: string; error?: string };
    } = await req.json();

    // 実行結果をAIに教えるための文字列を作成
    const executionInfo = execResult
      ? `\n【プログラムの実行結果】\n出力: ${execResult.output || 'なし'}\nエラー: ${execResult.error || 'なし'}`
      : '\n【プログラムの実行結果】まだ実行されていません。';

    const systemPrompt = code
      ? `あなたは中学生にプログラミングを教える、親しみやすい先生です。
生徒が以下のコードを提出しました：

${code}
${executionInfo}

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

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}