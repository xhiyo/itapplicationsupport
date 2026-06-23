import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sql, poolPromise } from '../db.js';
import { analyzeTicket, extractTextFromImage } from '../services/ai.js';

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
    }
});
const upload = multer({ storage: storage });

// POST log for debugging
router.post('/log', (req, res) => {
    fs.writeFileSync('frontend_error.txt', JSON.stringify(req.body, null, 2));
    res.json({ message: 'logged' });
});

// GET all tickets
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT t.*, p.pic_name 
            FROM Tickets t 
            LEFT JOIN pics p ON t.pic_id = p.id 
            ORDER BY t.id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET ticket by id
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT t.*, p.pic_name 
                FROM Tickets t 
                LEFT JOIN pics p ON t.pic_id = p.id 
                WHERE t.id = @id
            `);
            
        if (result.recordset.length === 0) {
            return res.status(404).send('Ticket not found');
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST new ticket
router.post('/', upload.single('attachment'), async (req, res) => {
    try {
        const pool = await poolPromise;
        const { title, description, category, priority, status, pic_id } = req.body;
        const attachmentName = req.file ? req.file.filename : null;
        
        const insertQuery = `
            INSERT INTO Tickets (title, description, category, priority, status, pic_id)
            OUTPUT inserted.id
            VALUES (@title, @description, @category, @priority, @status, @pic_id)
        `;
        
        const result = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description || '')
            .input('category', sql.NVarChar, category || '')
            .input('priority', sql.NVarChar, priority || 'Low')
            .input('status', sql.NVarChar, status || 'To Do')
            .input('pic_id', sql.Int, pic_id || null)
            .query(insertQuery);
            
        const ticketId = result.recordset[0].id;

        if (attachmentName) {
            await pool.request()
                .input('ticket_id', sql.Int, ticketId)
                .input('file_name', sql.NVarChar, attachmentName)
                .input('file_path', sql.NVarChar, attachmentName)
                .query(`
                    INSERT INTO TicketAttachments (ticket_id, file_name, file_path)
                    VALUES (@ticket_id, @file_name, @file_path)
                `);
        }

        res.status(201).json({ id: ticketId, message: 'Ticket created successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT (update) ticket
router.put('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const ticketId = req.params.id;

        // Fetch existing ticket
        const existingResult = await pool.request()
            .input('id', sql.Int, ticketId)
            .query('SELECT * FROM Tickets WHERE id = @id');
            
        if (existingResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        const current = existingResult.recordset[0];
        
        const title = req.body.title !== undefined ? req.body.title : current.title;
        const description = req.body.description !== undefined ? req.body.description : current.description;
        const status = req.body.status !== undefined ? req.body.status : current.status;
        const priority = req.body.priority !== undefined ? req.body.priority : current.priority;
        const category = req.body.category !== undefined ? req.body.category : current.category;
        const pic_id = req.body.pic_id !== undefined ? req.body.pic_id : current.pic_id;

        await pool.request()
            .input('id', sql.Int, ticketId)
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description)
            .input('status', sql.NVarChar, status)
            .input('priority', sql.NVarChar, priority)
            .input('category', sql.NVarChar, category)
            .input('pic_id', sql.Int, pic_id)
            .query(`
                UPDATE Tickets 
                SET title = @title, description = @description, status = @status, 
                    priority = @priority, category = @category, pic_id = @pic_id, updated_at = GETDATE()
                WHERE id = @id
            `);

        res.json({ message: 'Ticket updated successfully' });
    } catch (err) {
        fs.writeFileSync('put_error.txt', err.stack || err.message);
        res.status(500).send(err.message);
    }
});

// DELETE ticket
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Tickets WHERE id = @id');
        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET ticket comments
router.get('/:id/comments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT description FROM Tickets WHERE id = @id');
            
        const comments = [];
        if (result.recordset.length > 0) {
            const desc = result.recordset[0].description || "";
            const resMatch = desc.match(/Solusi :\n([\s\S]*)$/);
            if (resMatch) {
                comments.push({
                    id: 1,
                    ticket_id: req.params.id,
                    comment_text: `Solusi :\n${resMatch[1]}`,
                    created_by: 'IT Support',
                    is_ai: 0,
                    created_at: new Date()
                });
            }
        }
        res.json(comments);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST ticket comment
router.post('/:id/comments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { comment_text, created_by, is_ai } = req.body;
        const ticketId = req.params.id;

        // Append to Tickets description instead of TicketComments
        await pool.request()
            .input('ticket_id', sql.Int, ticketId)
            .input('comment_text', sql.NVarChar, '\n\n' + comment_text)
            .query(`
                UPDATE Tickets 
                SET description = ISNULL(description, '') + @comment_text
                WHERE id = @ticket_id
            `);

        res.status(201).json({ message: 'Comment added successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET ticket attachments
router.get('/:id/attachments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT id, file_path, file_name, uploaded_at FROM TicketAttachments WHERE ticket_id = @id ORDER BY uploaded_at ASC');
            
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST AI analyze ticket (Chatbot mode)
router.post('/:id/analyze', async (req, res) => {
    try {
        const pool = await poolPromise;
        const ticketId = req.params.id;
        const userMessage = req.body.message || "";

        // Get ticket details
        const ticketResult = await pool.request()
            .input('id', sql.Int, ticketId)
            .query('SELECT title, description FROM Tickets WHERE id = @id');
        
        if (ticketResult.recordset.length === 0) {
            return res.status(404).send('Ticket not found');
        }
        
        const { title, description } = ticketResult.recordset[0];
        
        // Call Ollama WITHOUT the heavy raw image (relying on OCR text in description for speed)
        const aiResponse = await analyzeTicket(title, description, userMessage);

        // Save AI response as comment by appending to description
        await pool.request()
            .input('ticket_id', sql.Int, ticketId)
            .input('comment_text', sql.NVarChar, '\n\n🤖 **AI Analysis:**\n' + aiResponse)
            .query(`
                UPDATE Tickets 
                SET description = ISNULL(description, '') + @comment_text
                WHERE id = @ticket_id
            `);

        res.json({ message: 'AI Analysis complete', analysis: aiResponse });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST OCR (Extract text from image)
router.post('/ocr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        // Read file and convert to base64
        const imagePath = req.file.path;
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Clean up the temporary uploaded file if we only need it for OCR
        fs.unlinkSync(imagePath);

        const extractedText = await extractTextFromImage(base64Image);
        
        res.json({ text: extractedText });
    } catch (error) {
        console.error('OCR Error:', error);
        fs.writeFileSync('ocr_error.txt', error.stack || error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
