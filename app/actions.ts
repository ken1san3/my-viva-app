'use server';

import { sql } from '@vercel/postgres';

export async function createAllTables() {
  try {
    // 1. 学校テーブル
    await sql`
      CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL
      );
    `;

    // 2. ユーザーテーブル
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
        name TEXT NOT NULL
      );
    `;

    // 3. 授業テーブル
    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      );
    `;

    // 4. 授業メンバーテーブル
    await sql`
      CREATE TABLE IF NOT EXISTS class_members (
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (class_id, user_id)
      );
    `;

    // 5. 課題テーブル
    await sql`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        assignment_number INT NOT NULL,
        title TEXT NOT NULL,
        expected_output TEXT
      );
    `;

    // 6. 達成目標テーブル
    await sql`
      CREATE TABLE IF NOT EXISTS assignment_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
        description TEXT NOT NULL
      );
    `;

    // 7. 提出ログテーブル
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        attempt_number INT NOT NULL,
        code_content TEXT NOT NULL,
        exec_status TEXT DEFAULT 'pending' CHECK (exec_status IN ('pending', 'passed', 'failed')),
        oral_status TEXT DEFAULT 'pending' CHECK (oral_status IN ('pending', 'passed', 'failed')),
        final_status TEXT DEFAULT 'reviewing' CHECK (final_status IN ('reviewing', 'accepted', 'rejected')),
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 8. 再審査請求テーブル
    await sql`
      CREATE TABLE IF NOT EXISTS appeals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    return { success: true, message: 'すべてのテーブル（8個）の作成に成功しました！' };
  } catch (error: any) {
    console.error('Table Creation Error:', error);
    return { success: false, message: 'テーブル作成失敗: ' + error.message };
  }
}

export async function createTestSchool() {
  try {
    await sql`
      INSERT INTO schools (name)
      VALUES ('テスト中学校')
    `;
    return { success: true, message: 'テスト中学校の保存に成功しました！' };
  } catch (error: any) {
    console.error('Database Error:', error);
    return { success: false, message: '保存失敗: ' + error.message };
  }
}
// app/actions.ts の末尾に追記

// 生徒のコードをPiston APIに送って実行結果を受け取る関数
export async function executeStudentCode(language: string, code: string) {
  // Pistonが要求する言語とバージョンの対応表
  const versionMap: Record<string, string> = {
    'python': '3.10.0',
    'c': '10.2.0',
    'java': '15.0.2',
    'javascript': '18.15.0'
  };

  const version = versionMap[language] || '*';

  try {
    const response = await fetch('http://localhost:2000/api/v2/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: language,
        version: version,
        files: [{ content: code }]
      })
    });

    const data = await response.json();

    // API側でエラーが起きた場合
    if (data.message) {
      return { success: false, output: null, error: data.message };
    }

    // 実行結果を返す
    return {
      success: true,
      output: data.run.stdout, // 正常な出力（printなど）
      error: data.run.stderr,  // プログラムのエラー文
      exitCode: data.run.code  // 0なら正常終了
    };

  } catch (error: any) {
    console.error('実行エンジンエラー:', error);
    return { 
      success: false, 
      output: null, 
      error: 'コードの実行環境との通信に失敗しました。' 
    };
  }
}
// app/actions.ts の末尾に追記

export async function installPythonToPiston() {
  try {
    const response = await fetch('http://localhost:2000/api/v2/packages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'python',
        version: '3.10.0'
      })
    });
    
    // インストール（ダウンロードと展開）には少し時間がかかります
    const data = await response.json();
    return { success: true, message: 'インストール完了:\n' + JSON.stringify(data, null, 2) };
  } catch (error: any) {
    console.error('Install Error:', error);
    return { success: false, message: 'インストール通信エラー: ' + error.message };
  }
}