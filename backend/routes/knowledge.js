import express from 'express';
import multer from 'multer';
import path from 'path';
import { sql, poolPromise } from '../db.js';

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// GET all knowledge base articles
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT 
                kb.id, kb.title, kb.content, kb.category, kb.file_name, kb.file_path, kb.created_at, kb.updated_at, kb.pic_name,
                (
                    SELECT kbi.id, kbi.image_name, kbi.image_path
                    FROM KnowledgeBaseImages kbi
                    WHERE kbi.knowledge_base_id = kb.id
                    FOR JSON PATH
                ) AS images
            FROM KnowledgeBase kb 
            ORDER BY kb.updated_at DESC
        `;
        const result = await pool.request().query(query);
        const articles = result.recordset.map(record => ({
            ...record,
            images: record.images ? JSON.parse(record.images) : []
        }));
        res.json(articles);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET single article
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM KnowledgeBase WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET download attachment
router.get('/download/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT file_name, file_path FROM KnowledgeBase WHERE id = @id');
            
        if (result.recordset.length === 0 || !result.recordset[0].file_path) {
            return res.status(404).json({ message: 'Attachment not found' });
        }
        
        const file = result.recordset[0];
        const filePath = path.join(process.cwd(), 'uploads', file.file_path);
        
        res.download(filePath, file.file_name || file.file_path, (err) => {
            if (err) {
                console.error("Download error:", err);
            }
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST new article
router.post('/', upload.fields([{ name: 'attachment', maxCount: 1 }, { name: 'image', maxCount: 10 }]), async (req, res) => {
    try {
        const pool = await poolPromise;
        const { title, content, category, pic_name } = req.body;
        
        const attachmentName = req.files && req.files['attachment'] ? req.files['attachment'][0].originalname : null;
        const attachmentPath = req.files && req.files['attachment'] ? req.files['attachment'][0].filename : null;
        
        const insertQuery = `
            INSERT INTO KnowledgeBase (title, content, category, file_name, file_path, pic_name, created_at, updated_at)
            OUTPUT inserted.id
            VALUES (@title, @content, @category, @file_name, @file_path, @pic_name, GETDATE(), GETDATE())
        `;
        
        const result = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('content', sql.NVarChar, content || '')
            .input('category', sql.NVarChar, category || 'Umum')
            .input('file_name', sql.NVarChar, attachmentName)
            .input('file_path', sql.NVarChar, attachmentPath)
            .input('pic_name', sql.NVarChar, pic_name || null)
            .query(insertQuery);
            
        const articleId = result.recordset[0].id;

        // Insert Multiple Images if exist
        if (req.files && req.files['image']) {
            for (const file of req.files['image']) {
                await pool.request()
                    .input('kb_id', sql.Int, articleId)
                    .input('image_name', sql.NVarChar, file.originalname)
                    .input('image_path', sql.NVarChar, file.filename)
                    .query(`
                        INSERT INTO KnowledgeBaseImages (knowledge_base_id, image_name, image_path, created_at)
                        VALUES (@kb_id, @image_name, @image_path, GETDATE())
                    `);
            }
        }
            
        res.status(201).json({ id: articleId, message: 'Article created successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT (update) article
router.put('/:id', upload.fields([{ name: 'attachment', maxCount: 1 }, { name: 'image', maxCount: 10 }]), async (req, res) => {
    try {
        const pool = await poolPromise;
        const { title, content, category, pic_name } = req.body;
        const articleId = req.params.id;
        
        let updateQuery = `
            UPDATE KnowledgeBase 
            SET title = @title, content = @content, category = @category, pic_name = @pic_name, updated_at = GETDATE()
        `;
        
        // If a new file is uploaded, update file columns
        if (req.files && req.files['attachment']) {
            updateQuery += `, file_name = @file_name, file_path = @file_path`;
        }
        
        updateQuery += ` WHERE id = @id`;

        const request = pool.request()
            .input('id', sql.Int, articleId)
            .input('title', sql.NVarChar, title)
            .input('content', sql.NVarChar, content || '')
            .input('category', sql.NVarChar, category)
            .input('pic_name', sql.NVarChar, pic_name || null);
            
        if (req.files && req.files['attachment']) {
            request.input('file_name', sql.NVarChar, req.files['attachment'][0].originalname);
            request.input('file_path', sql.NVarChar, req.files['attachment'][0].filename);
        }

        await request.query(updateQuery);

        // Update Images if new images are uploaded
        if (req.files && req.files['image']) {
            // Optional: delete old images first, or just append
            await pool.request()
                .input('kb_id', sql.Int, articleId)
                .query('DELETE FROM KnowledgeBaseImages WHERE knowledge_base_id = @kb_id');

            for (const file of req.files['image']) {
                await pool.request()
                    .input('kb_id', sql.Int, articleId)
                    .input('image_name', sql.NVarChar, file.originalname)
                    .input('image_path', sql.NVarChar, file.filename)
                    .query(`
                        INSERT INTO KnowledgeBaseImages (knowledge_base_id, image_name, image_path, created_at)
                        VALUES (@kb_id, @image_name, @image_path, GETDATE())
                    `);
            }
        }

        res.json({ message: 'Article updated successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE article
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM KnowledgeBase WHERE id = @id');
        res.json({ message: 'Article deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

export default router;
