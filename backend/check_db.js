import { poolPromise } from './db.js';
async function run() {
  const pool = await poolPromise;
  const r = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
  console.log(r.recordset);
  process.exit(0);
}
run();
