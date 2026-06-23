import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false, // Ubah ke true jika menggunakan Azure SQL, false untuk local dev
        trustServerCertificate: true // Percayai sertifikat lokal
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Successfully connected to SQL Server database');
        return pool;
    })
    .catch(err => {
        console.error('Error connecting to SQL Server:', err);
    });

export { sql, poolPromise };
