const express = require('express');
const { z } = require('zod');
const { supabase } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  mission_statement: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  target_audience: z.string().optional(),
  key_products_services: z.array(z.string()).optional(),
  company_culture_notes: z.string().optional(),
  language: z.enum(['da', 'en', 'no', 'sv']).optional()
});

const updateCompanySchema = createCompanySchema.partial();

// GET /api/companies - Get all companies
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching companies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/companies/:id - Get specific company
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/companies - Create new company
router.post('/', async (req, res) => {
  try {
    const validatedData = createCompanySchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('companies')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Created new company: ${data.name} (${data.id})`);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    logger.error('Error creating company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/companies/:id - Update company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateCompanySchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('companies')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    logger.info(`Updated company: ${data.name} (${data.id})`);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    logger.error('Error updating company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/companies/:id - Delete company
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete all related data that references this company
    const relatedTables = [
      'posts',
      'schedules', 
      'improvement_questions',
      'improvement_answers',
      'improvement_preferences'
    ];

    for (const table of relatedTables) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('entity_id', id)
        .eq('entity_type', 'company');

      if (deleteError) {
        logger.warn(`Error deleting related data from ${table}:`, deleteError);
        // Continue with other tables even if one fails
      }
    }
    
    // Now delete the company itself
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.info(`Deleted company: ${id} and all related data`);
    res.json({ success: true, message: 'Company and all related data deleted successfully' });
  } catch (error) {
    logger.error('Error deleting company:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
