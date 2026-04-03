'use server';

import { sql } from '@vercel/postgres';

// ==========================================
// 1. オリジナルの完全なテーブル構成（8テーブル）
// ==========================================
export async function createAllTables() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS schools (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL);`;
    await sql`CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID REFERENCES schools(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK (role IN ('teacher', 'student')), name TEXT NOT NULL);`;
    await sql`CREATE TABLE IF NOT EXISTS classes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), school_id UUID REFERENCES schools(id) ON DELETE CASCADE, name TEXT NOT NULL);`;
    await sql`CREATE TABLE IF NOT EXISTS class_members (class_id UUID REFERENCES classes(id) ON DELETE CASCADE, user_id UUID REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (class_id, user_id));`;
    await sql`CREATE TABLE IF NOT EXISTS assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), class_id UUID REFERENCES classes(id) ON DELETE CASCADE, assignment_number INT NOT NULL, title TEXT NOT NULL, expected_output TEXT);`;
    await sql`CREATE TABLE IF NOT EXISTS assignment_goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE, description TEXT NOT NULL);`;
    await sql`CREATE TABLE IF NOT EXISTS submissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE, student_id UUID REFERENCES users(id) ON DELETE CASCADE, attempt_number INT NOT NULL, code_content TEXT NOT NULL, exec_status TEXT DEFAULT 'pending' CHECK (exec_status IN ('pending', 'passed', 'failed')), oral_status TEXT DEFAULT 'pending' CHECK (oral_status IN ('pending', 'passed', 'failed')), final_status TEXT DEFAULT 'reviewing' CHECK (final_status IN ('reviewing', 'accepted', 'rejected')), submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`;
    await sql`CREATE TABLE IF NOT EXISTS appeals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE, student_id UUID REFERENCES users(id) ON DELETE CASCADE, reason TEXT NOT NULL, status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`;

    return { success: true, message: 'すべてのテーブル（8個）の作成に成功しました！' };
  } catch (error: any) {
    console.error('Table Creation Error:', error);
    return { success: false, message: 'テーブル作成失敗: ' + error.message };
  }
}

export async function createTestSchool() {
  try {
    await sql`INSERT INTO schools (name) VALUES ('テスト中学校')`;
    return { success: true, message: 'テスト中学校の保存に成功しました！' };
  } catch (error: any) {
    return { success: false, message: '保存失敗: ' + error.message };
  }
}

// ==========================================
// 2. 問題のセットアップと取得（UI表示用に追加）
// ==========================================
export async function setupFizzBuzz() {
  try {
    // 修正後
    const existing = await sql`SELECT id FROM assignments WHERE title = 'FizzBuzz問題' LIMIT 1`;
    if (existing.rows.length > 0) return { success: true, message: '登録済み' }; // 🟢 これで解決！

    const s = await sql`INSERT INTO schools (name) VALUES ('テスト校') RETURNING id`;
    const c = await sql`INSERT INTO classes (school_id, name) VALUES (${s.rows[0].id}, 'プログラミング') RETURNING id`;
    const a = await sql`
      INSERT INTO assignments (class_id, assignment_number, title, expected_output)
      VALUES (${c.rows[0].id}, 1, 'FizzBuzz問題', '1から100までの整数を出力せよ。ただし、3の倍数の時はFizz、5の倍数の時はBuzz、両方の倍数の時はFizzBuzzと出力すること。')
      RETURNING id
    `;
    await sql`
      INSERT INTO assignment_goals (assignment_id, description) 
      VALUES 
      (${a.rows[0].id}, 'for文をちゃんと理解して使えているか。動かない条件を提示してみてその返事で確認してください'),
      (${a.rows[0].id}, 'if文を理解して使えているか。もし無駄なif文があればそれをとった場合でも動くか聞いたり逆に必要なif文をなぜ消してはいけないのかを聞いたりして確認してください')
    `;
    return { success: true, message: 'FizzBuzz問題を登録しました' };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function getExamData() {
  try {
    const aRes = await sql`SELECT id, title, expected_output as description FROM assignments WHERE title = 'FizzBuzz問題' LIMIT 1`;
    if (aRes.rows.length === 0) return { success: false, error: '問題が見つかりません' };
    const gRes = await sql`SELECT description FROM assignment_goals WHERE assignment_id = ${aRes.rows[0].id}`;
    return { 
      success: true, 
      data: { 
        title: aRes.rows[0].title, 
        description: aRes.rows[0].description, 
        goals: gRes.rows.map(r => r.description).join('\n') 
      } 
    };
  } catch (e: any) { return { success: false, error: 'データベース取得エラー' }; }
}

// ==========================================
// 3. オリジナルのPiston実行処理
// ==========================================
export async function executeStudentCode(language: string, code: string) {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: language, version: version, files: [{ content: code }] })
    });

    const data = await response.json();

    if (data.message) {
      return { success: false, output: null, error: data.message };
    }

    return {
      success: true,
      output: data.run.stdout,
      error: data.run.stderr,
      exitCode: data.run.code
    };
  } catch (error: any) {
    console.error('実行エンジンエラー:', error);
    return { success: false, output: null, error: 'コードの実行環境との通信に失敗しました。' };
  }
}

export async function installPythonToPiston() {
  try {
    const response = await fetch('http://localhost:2000/api/v2/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'python', version: '3.10.0' })
    });
    
    const data = await response.json();
    return { success: true, message: 'インストール完了:\n' + JSON.stringify(data, null, 2) };
  } catch (error: any) {
    console.error('Install Error:', error);
    return { success: false, message: 'インストール通信エラー: ' + error.message };
  }
}