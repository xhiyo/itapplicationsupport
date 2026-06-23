import { sql, poolPromise } from './db.js';

async function createTable() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TicketComments' and xtype='U')
            BEGIN
                CREATE TABLE TicketComments (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    ticket_id INT NOT NULL,
                    comment_text NVARCHAR(MAX) NOT NULL,
                    created_by NVARCHAR(100) DEFAULT 'Anonymous',
                    is_ai BIT DEFAULT 0,
                    created_at DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_TicketComments_Tickets FOREIGN KEY (ticket_id) REFERENCES Tickets(id) ON DELETE CASCADE
                )
                PRINT 'Table TicketComments created successfully.'
            END
            ELSE
            BEGIN
                PRINT 'Table TicketComments already exists.'
            END
        `);
        console.log("Migration successful");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e.message);
        process.exit(1);
    }
}
createTable();
