const express = require('express');
const { z } = require('zod');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase } = require('../database/init');
const postGenerator = require('../services/postGenerator');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Validation schemas
const createPostSchema = z.object({
  entity_type: z.enum(['person', 'company']),
  entity_id: z.string().uuid(),
  content: z.string().min(10),
  hashtags: z.array(z.string()).optional(),
  post_type: z.enum(['educational', 'personal_story', 'industry_insight', 'contrarian_viewpoint', 'problem_agitate_solve', 'general']).default('general'),
  scheduled_date: z.string().datetime().optional(),
  status: z.enum(['draft', 'scheduled', 'posted', 'failed']).default('draft')
});

const updatePostSchema = createPostSchema.partial();

// POST /api/posts/generate - Generate posts for entity
router.post('/generate', async (req, res) => {
  try {
    const { entity_type, entity_id, requirements } = req.body;
    
    if (!entity_type || !entity_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'entity_type and entity_id are required' 
      });
    }

    // Fetch entity data
    let entityData;
    if (entity_type === 'person') {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('id', entity_id)
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ success: false, error: 'Person not found' });
      }
      entityData = data;
    } else if (entity_type === 'company') {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', entity_id)
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ success: false, error: 'Company not found' });
      }
      entityData = data;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'entity_type must be "person" or "company"' 
      });
    }

    // Delete existing posts for this entity to avoid duplicates
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .eq('status', 'draft');
    
    if (deleteError) {
      logger.warn('Failed to delete existing draft posts:', deleteError);
    } else {
      logger.info(`Deleted existing draft posts for ${entity_type}: ${entity_id}`);
    }

    // Generate posts (3 different advanced styles) without strategy
    const generatedPosts = await postGenerator.generateMultiplePosts(entityData, null, 3, requirements);

    logger.info(`Generated 3 posts for ${entity_type}: ${entity_id}`);
    res.json({ success: true, data: generatedPosts });
  } catch (error) {
    logger.error('Error generating posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts - Create post
router.post('/', async (req, res) => {
  try {
    const validatedData = createPostSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('posts')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Created post for ${validatedData.entity_type}: ${validatedData.entity_id}`);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    logger.error('Error creating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/posts - Get all posts with optional filtering
router.get('/', async (req, res) => {
  try {
    const { entity_type, entity_id, status } = req.query;
    
    let query = supabase.from('posts').select('*');
    
    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }
    
    if (entity_id) {
      query = query.eq('entity_id', entity_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/posts/:id - Get specific post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updatePostSchema.parse(req.body);
    
    const { data, error } = await supabase
      .from('posts')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    logger.info(`Updated post: ${id}`);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    logger.error('Error updating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.info(`Deleted post: ${id}`);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts/publish - Publish post immediately with optional image
router.post('/publish', upload.single('image'), async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ 
        success: false, 
        error: 'postId is required' 
      });
    }

    // Get the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Prepare update data
    const updateData = {
      status: 'posted',
      posted_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Handle image upload if present
    if (req.file) {
      updateData.image_filename = req.file.filename;
      updateData.image_size = req.file.size;
      updateData.image_mime_type = req.file.mimetype;
      updateData.image_url = `/uploads/${req.file.filename}`;
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info(`Published post: ${postId}${req.file ? ' with image' : ''}`);
    res.json({ success: true, data: updatedPost });
  } catch (error) {
    logger.error('Error publishing post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts/schedule - Schedule post with optional image
router.post('/schedule', upload.single('image'), async (req, res) => {
  try {
    const { postId, scheduledDate } = req.body;
    
    if (!postId) {
      return res.status(400).json({ 
        success: false, 
        error: 'postId is required' 
      });
    }

    // Get the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Prepare update data
    const updateData = {
      status: 'scheduled',
      updated_at: new Date().toISOString()
    };

    // Set scheduled date if provided, otherwise use current time + 1 hour
    if (scheduledDate) {
      updateData.scheduled_date = new Date(scheduledDate).toISOString();
    } else {
      updateData.scheduled_date = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    }

    // Handle image upload if present
    if (req.file) {
      updateData.image_filename = req.file.filename;
      updateData.image_size = req.file.size;
      updateData.image_mime_type = req.file.mimetype;
      updateData.image_url = `/uploads/${req.file.filename}`;
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info(`Scheduled post: ${postId}${req.file ? ' with image' : ''} for ${updateData.scheduled_date}`);
    res.json({ success: true, data: updatedPost });
  } catch (error) {
    logger.error('Error scheduling post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
