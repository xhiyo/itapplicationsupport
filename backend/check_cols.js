import { poolPromise } from './db.js';

poolPromise.then(pool => {
    pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='KnowledgeBase'")
        .then(r => console.log(r.recordset))
        .catch(console.error)
        .finally(() => process.exit());
});
