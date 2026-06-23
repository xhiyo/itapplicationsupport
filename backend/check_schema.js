import { poolPromise } from './db.js';

async function check() {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Tickets'");
    console.log(res.recordset);
    process.exit(0);
}
check();
