'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function VivaApp() {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat();

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2>プログラミング提出 & 口頭試問</h2>
      <hr />

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
          <label>プログラムをここに貼ってください：</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="例：print('こんにちは')"
            style={{
              width: '100%',
              height: '400px',
              marginTop: '10px',
              padding: '10px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label>先生との対話：</label>

          <div
            style={{
              flexGrow: 1,
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px',
              height: '350px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9',
              marginTop: '10px',
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: '#999' }}>
                コードを貼って、下の欄に「提出します！」と打ってみよう。
              </p>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: '15px',
                  textAlign: m.role === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '10px 14px',
                    borderRadius: '15px',
                    backgroundColor: m.role === 'user' ? '#007bff' : '#ffffff',
                    color: m.role === 'user' ? '#fff' : '#333',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '90%',
                  }}
                >
                  {m.parts.map((part, index) =>
                    part.type === 'text' ? (
                      <span key={`${m.id}-${index}`}>{part.text}</span>
                    ) : null
                  )}
                </div>
              </div>
            ))}

            {status === 'submitted' && (
              <p style={{ color: '#999', marginTop: '10px' }}>送信中...</p>
            )}
            {status === 'streaming' && (
              <p style={{ color: '#999', marginTop: '10px' }}>AIが考え中...</p>
            )}
            {error && (
              <p style={{ color: 'red', marginTop: '10px' }}>
                エラーが発生しました。
              </p>
            )}
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!input.trim()) return;

              await sendMessage(
                { text: input },
                {
                  body: { code },
                }
              );

              setInput('');
            }}
            style={{ marginTop: '10px', display: 'flex', gap: '5px' }}
          >
            <input
              value={input}
              placeholder="メッセージを入力..."
              onChange={(e) => setInput(e.target.value)}
              style={{
                flexGrow: 1,
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
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