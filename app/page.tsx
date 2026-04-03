'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
// executeCode を executeStudentCode に変更してインポート
import { executeStudentCode } from '/actions';

export default function VivaApp() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python'); // 言語状態
  const [execResult, setExecResult] = useState<{ output?: string; error?: string } | null>(null); // 実行結果
  const [isExecuting, setIsExecuting] = useState(false); // 実行中フラグ
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat();

  // コード実行処理
const handleRunCode = async () => {
    setIsExecuting(true);
    setExecResult({ output: '実行中...' });
    // ここを executeStudentCode に変更
    const result = await executeStudentCode(language, code);
    setExecResult(result);
    setIsExecuting(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>プログラミング提出 & 口頭試問</h2>
      <hr />

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        
        {/* 左側：エディタと実行結果 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>プログラムをここに貼ってください：</label>

          {/* 言語選択と実行ボタン */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
            <button
              onClick={handleRunCode}
              disabled={isExecuting || !code.trim()}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: isExecuting ? '#ccc' : '#28a745', 
                color: 'white', border: 'none', borderRadius: '4px', 
                cursor: isExecuting ? 'not-allowed' : 'pointer' 
              }}
            >
              {isExecuting ? '実行中...' : '▶ コードを実行'}
            </button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="例：print('こんにちは')"
            style={{ width: '100%', height: '300px', padding: '10px', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />

          {/* 実行結果コンソール */}
          <div style={{ height: '120px', backgroundColor: '#f4f4f4', padding: '10px', borderRadius: '4px', overflowY: 'auto', border: '1px solid #ddd' }}>
            <strong>実行結果:</strong>
            <pre style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap', color: execResult?.error ? 'red' : '#333' }}>
              {execResult?.error || execResult?.output || '（まだ実行されていません）'}
            </pre>
          </div>
        </div>

        {/* 右側：チャットUI（元のコードを維持） */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label>先生との対話：</label>

          <div style={{ flexGrow: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '10px', height: '400px', overflowY: 'auto', backgroundColor: '#f9f9f9', marginTop: '10px' }}>
            {messages.length === 0 && (
              <p style={{ color: '#999' }}>コードを書いて実行したら、下の欄に「提出します！」と打ってみよう。</p>
            )}

            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: '15px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <div style={{ 
                  display: 'inline-block', padding: '10px 14px', borderRadius: '15px', 
                  backgroundColor: m.role === 'user' ? '#007bff' : '#ffffff',
                  color: m.role === 'user' ? '#fff' : '#333',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', whiteSpace: 'pre-wrap', maxWidth: '90%'
                }}>
                  {m.parts.map((part, index) =>
                    part.type === 'text' ? <span key={`${m.id}-${index}`}>{part.text}</span> : null
                  )}
                </div>
              </div>
            ))}

            {status === 'submitted' && <p style={{ color: '#999', marginTop: '10px' }}>送信中...</p>}
            {status === 'streaming' && <p style={{ color: '#999', marginTop: '10px' }}>AI先生が考え中...</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>エラーが発生しました。</p>}
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!input.trim()) return;

              // 🌟 修正ポイント：AIに送る body に execResult を追加！
              await sendMessage(
                { text: input },
                { body: { code, execResult } }
              );
              setInput('');
            }}
            style={{ marginTop: '10px', display: 'flex', gap: '5px' }}
          >
            <input
              value={input}
              placeholder="メッセージを入力..."
              onChange={(e) => setInput(e.target.value)}
              disabled={status === 'submitted' || status === 'streaming'}
              style={{ flexGrow: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              type="submit"
              disabled={status === 'submitted' || status === 'streaming'}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: (status === 'submitted' || status === 'streaming') ? '#ccc' : '#28a745', 
                color: 'white', border: 'none', borderRadius: '4px', 
                cursor: (status === 'submitted' || status === 'streaming') ? 'not-allowed' : 'pointer' 
              }}
            >
              送信
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}