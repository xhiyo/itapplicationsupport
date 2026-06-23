import express from 'express';
import { sql, poolPromise } from '../db.js';

const router = express.Router();

// GET KPIs by PIC ID
router.get('/:pic_id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('pic_id', sql.Int, req.params.pic_id)
            .query('SELECT * FROM pic_kpis WHERE pic_id = @pic_id ORDER BY id ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST new KPI
router.post('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { pic_id, kpi_name, target_value, unit } = req.body;
        
        const result = await pool.request()
            .input('pic_id', sql.Int, pic_id)
            .input('kpi_name', sql.NVarChar, kpi_name)
            .input('target_value', sql.Float, target_value)
            .input('unit', sql.NVarChar, unit || '')
            .query(`
                INSERT INTO pic_kpis (pic_id, kpi_name, target_value, unit)
                OUTPUT inserted.*
                VALUES (@pic_id, @kpi_name, @target_value, @unit)
            `);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT update KPI
router.put('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { kpi_name, target_value, unit } = req.body;
        
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('kpi_name', sql.NVarChar, kpi_name)
            .input('target_value', sql.Float, target_value)
            .input('unit', sql.NVarChar, unit || '')
            .query(`
                UPDATE pic_kpis 
                SET kpi_name = @kpi_name, target_value = @target_value, unit = @unit
                OUTPUT inserted.*
                WHERE id = @id
            `);
            
        if (result.recordset.length === 0) {
            return res.status(404).send('KPI not found');
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE KPI
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM pic_kpis WHERE id = @id');
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('KPI not found');
        }
        res.json({ message: 'KPI deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

export default router;
