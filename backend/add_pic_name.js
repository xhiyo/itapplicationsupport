import { poolPromise } from './db.js';

poolPromise.then(pool => {
    pool.request().query("ALTER TABLE dbo.KnowledgeBase ADD pic_name NVARCHAR(100) NULL")
        .then(() => console.log('Successfully added pic_name to KnowledgeBase'))
        .catch(console.error)
        .finally(() => process.exit());
});
