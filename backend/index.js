import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql, poolPromise } from './db.js';

import ticketRoutes from './routes/tickets.js';
import aiRoutes from './routes/ai.js';
import knowledgeRoutes from './routes/knowledge.js';
import kpiRoutes from './routes/kpis.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
// app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Rate limiting temporarily disabled for development
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, 
//     max: 100 
// });
// app.use(limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES FOR TICKETS ---
app.use('/api/tickets', ticketRoutes);

// --- ROUTES FOR AI CHATBOT ---
app.use('/api/ai', aiRoutes);

// --- ROUTES FOR KNOWLEDGE BASE ---
app.use('/api/knowledge', knowledgeRoutes);

// --- ROUTES FOR PIC KPIS ---
app.use('/api/kpis', kpiRoutes);

// --- ROUTES FOR PIC IT ---

app.get('/api/pic-it', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT ps.id, p.id AS pic_id, p.pic_name, ps.system_name, ps.keterangan, ps.legal_entity, ps.unit 
            FROM pics p
            LEFT JOIN pic_systems ps ON p.id = ps.pic_id
            ORDER BY p.id ASC, ps.id ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new PIC IT
app.post('/api/pic-it', async (req, res) => {
    try {
        const { pic_name, system_name, unit, legal_entity, keterangan } = req.body;
        const pool = await poolPromise;
        
        // Cek atau buat PIC
        const picCheck = await pool.request()
            .input('pic_name', sql.NVarChar, pic_name)
            .query('SELECT id FROM pics WHERE pic_name = @pic_name');
            
        let picId;
        if (picCheck.recordset.length > 0) {
            picId = picCheck.recordset[0].id;
        } else {
            const picInsert = await pool.request()
                .input('pic_name', sql.NVarChar, pic_name)
                .query('INSERT INTO pics (pic_name) OUTPUT inserted.id VALUES (@pic_name)');
            picId = picInsert.recordset[0].id;
        }

        const result = await pool.request()
            .input('pic_id', sql.Int, picId)
            .input('system_name', sql.NVarChar, system_name)
            .input('unit', sql.NVarChar, unit)
            .input('legal_entity', sql.NVarChar, legal_entity || '')
            .input('keterangan', sql.NVarChar, keterangan || '')
            .query(`
                INSERT INTO pic_systems (pic_id, system_name, unit, legal_entity, keterangan) 
                OUTPUT inserted.id, inserted.system_name, inserted.unit, inserted.legal_entity, inserted.keterangan
                VALUES (@pic_id, @system_name, @unit, @legal_entity, @keterangan)
            `);
        
        res.status(201).json({
            ...result.recordset[0],
            pic_name
        });
    } catch (err) {
        console.error("Error creating PIC IT:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create new PIC (Name Only)
app.post('/api/pic-it/pic-only', async (req, res) => {
    try {
        const { pic_name } = req.body;
        const pool = await poolPromise;
        
        // Cek apakah PIC sudah ada
        const picCheck = await pool.request()
            .input('pic_name', sql.NVarChar, pic_name)
            .query('SELECT id FROM pics WHERE pic_name = @pic_name');
            
        if (picCheck.recordset.length > 0) {
            return res.status(400).json({ error: "PIC dengan nama tersebut sudah ada." });
        }
        
        const picInsert = await pool.request()
            .input('pic_name', sql.NVarChar, pic_name)
            .query('INSERT INTO pics (pic_name) OUTPUT inserted.id VALUES (@pic_name)');
            
        res.status(201).json({ id: picInsert.recordset[0].id, pic_name });
    } catch (err) {
        console.error("Error creating PIC name:", err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk Update PIC Name
app.put('/api/pic-it/bulk-name', async (req, res) => {
    try {
        const { oldName, newName } = req.body;
        if (!oldName || !newName) return res.status(400).json({ error: "Missing names" });
        const pool = await poolPromise;
        const result = await pool.request()
            .input('oldName', sql.NVarChar, oldName)
            .input('newName', sql.NVarChar, newName)
            .query(`
                UPDATE pics 
                SET pic_name = @newName 
                WHERE pic_name = @oldName
            `);
        res.json({ message: "PIC Name updated successfully", rowsAffected: result.rowsAffected[0] });
    } catch (err) {
        console.error("Error updating PIC Name:", err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk Delete PIC Group
app.delete('/api/pic-it/group/:picName', async (req, res) => {
    try {
        const { picName } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('picName', sql.NVarChar, picName)
            .query('DELETE FROM pics WHERE pic_name = @picName');
        res.json({ message: "PIC Group deleted successfully", rowsAffected: result.rowsAffected[0] });
    } catch (err) {
        console.error("Error deleting PIC Group:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update PIC IT
app.put('/api/pic-it/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { pic_name, system_name, unit, legal_entity, keterangan } = req.body;
        const pool = await poolPromise;
        
        // Handle PIC Name
        const picCheck = await pool.request()
            .input('pic_name', sql.NVarChar, pic_name)
            .query('SELECT id FROM pics WHERE pic_name = @pic_name');
            
        let picId;
        if (picCheck.recordset.length > 0) {
            picId = picCheck.recordset[0].id;
        } else {
            const picInsert = await pool.request()
                .input('pic_name', sql.NVarChar, pic_name)
                .query('INSERT INTO pics (pic_name) OUTPUT inserted.id VALUES (@pic_name)');
            picId = picInsert.recordset[0].id;
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('pic_id', sql.Int, picId)
            .input('system_name', sql.NVarChar, system_name)
            .input('unit', sql.NVarChar, unit)
            .input('legal_entity', sql.NVarChar, legal_entity || '')
            .input('keterangan', sql.NVarChar, keterangan || '')
            .query(`
                UPDATE pic_systems 
                SET pic_id = @pic_id, 
                    system_name = @system_name, 
                    unit = @unit,
                    legal_entity = @legal_entity,
                    keterangan = @keterangan
                OUTPUT inserted.* 
                WHERE id = @id
            `);
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'PIC IT system not found' });
        }
        res.json({
            ...result.recordset[0],
            pic_name
        });
    } catch (err) {
        console.error("Error updating PIC IT:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/pic-it/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM pic_systems WHERE id = @id');
            
        res.json({ message: 'System deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
