'use client';

import { useState } from 'react';
import { executeStudentCode, installPythonToPiston } from '../actions'; // installPythonToPiston を追加

export default function SandboxPage() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('print("Hello, Piston in Docker!")\n');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    setIsExecuting(true);
    setOutput('実行中...');
    const result = await executeStudentCode(language, code);
    if (result.success) {
      setOutput(result.error ? `【エラー】\n${result.error}` : `【出力】\n${result.output}`);
    } else {
      setOutput(`【システムエラー】\n${result.error}`);
    }
    setIsExecuting(false);
  };

  // ▼ 新しく追加するインストール用の処理
  const handleInstall = async () => {
    setIsExecuting(true);
    setOutput('PythonをDockerにインストール中...\n（ダウンロードに1〜2分かかります。このままお待ちください）');
    
    const result = await installPythonToPiston();
    setOutput(`【インストール結果】\n${result.message}`);
    
    setIsExecuting(false);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>プログラミング実行テスト（ローカルDocker版）</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '10px' }}>言語を選択:</label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: '5px', fontSize: '16px' }}
        >
          <option value="python">Python</option>
          <option value="c">C言語</option>
          <option value="java">Java</option>
        </select>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ width: '100%', height: '200px', padding: '10px', fontFamily: 'monospace', fontSize: '16px', backgroundColor: '#282c34', color: '#abb2bf', borderRadius: '5px' }}
      />

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: isExecuting ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: isExecuting ? 'not-allowed' : 'pointer' }}
        >
          {isExecuting ? '処理中...' : '▶ コードを実行する'}
        </button>

        {/* ▼ 新しく追加するインストールボタン */}
        <button
          onClick={handleInstall}
          disabled={isExecuting}
          style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: isExecuting ? '#ccc' : '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: isExecuting ? 'not-allowed' : 'pointer' }}
        >
          ⚙️ サーバーにPythonをインストール
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>実行結果:</h3>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
          {output}
        </pre>
      </div>
    </div>
  );
}