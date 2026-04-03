import { config } from 'dotenv';
config({ path: '.env.local' }); // これを追加：.env.localから環境変数を読み込む

import { sql } from '@vercel/postgres';

async function checkDatabase() {
  try {
    console.log('データベースに接続中...');
    
    // テーブル一覧の取得
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log('\n--- テーブル一覧 ---');
    tables.rows.forEach(t => console.log(t.table_name));

    // usersテーブルの確認
    const users = await sql`SELECT * FROM users;`;
    console.log('\n--- users テーブルのデータ ---');
    console.log(users.rows);

    // assignmentsテーブルの確認
    const assignments = await sql`SELECT * FROM assignments;`;
    console.log('\n--- assignments テーブルのデータ ---');
    console.log(assignments.rows);

    process.exit(0);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

checkDatabase();