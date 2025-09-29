const express = require('express');
const { z } = require('zod');
const { supabase } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const createPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  target_audience: z.string().optional(),
  key_expertise: z.array(z.string()).optional(),
  personal_branding_notes: z.string().optional(),
  language: z.enum(['da', 'en', 'no', 'sv']).optional()
});

const updatePersonSchema = createPersonSchema.partial();

// GET /api/persons - Get all persons
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching persons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/persons/:id - Get specific person
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/persons - Create new person
router.post('/', async (req, res) => {
  try {
    const validatedData = createPersonSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('persons')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Created new person: ${data.name} (${data.id})`);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    logger.error('Error creating person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/persons/:id - Update person
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updatePersonSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('persons')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }

    logger.info(`Updated person: ${data.name} (${data.id})`);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    logger.error('Error updating person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/persons/:id - Delete person
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete all related data that references this person
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
        .eq('entity_type', 'person');

      if (deleteError) {
        logger.warn(`Error deleting related data from ${table}:`, deleteError);
        // Continue with other tables even if one fails
      }
    }
    
    // Now delete the person itself
    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.info(`Deleted person: ${id} and all related data`);
    res.json({ success: true, message: 'Person and all related data deleted successfully' });
  } catch (error) {
    logger.error('Error deleting person:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
