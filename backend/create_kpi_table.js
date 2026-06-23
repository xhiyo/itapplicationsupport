import { poolPromise } from './db.js';

async function createTable() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pic_kpis' and xtype='U')
            BEGIN
                CREATE TABLE pic_kpis (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    pic_id INT NOT NULL,
                    kpi_name NVARCHAR(255) NOT NULL,
                    target_value FLOAT NOT NULL,
                    unit NVARCHAR(50) NOT NULL DEFAULT '',
                    created_at DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (pic_id) REFERENCES pics(id)
                )
                PRINT 'Table pic_kpis created successfully.'
            END
            ELSE
            BEGIN
                PRINT 'Table pic_kpis already exists.'
            END
        `);
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createTable();
