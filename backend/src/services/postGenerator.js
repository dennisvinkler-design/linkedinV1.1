const OpenAI = require('openai');
const { supabase } = require('../database/init');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class PostGenerator {
  async generatePost(entity, strategy = null, postType = 'general', postNumber = 1) {
    try {
      const prompt = this.buildPostPrompt(entity, strategy, postType, postNumber);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a LinkedIn content expert who creates high-quality, engaging posts that drive meaningful engagement. 

CRITICAL INSTRUCTIONS:
- Create SUBSTANTIAL content (minimum 200 words) - never create short, generic posts
- Each post must be UNIQUE and DIFFERENT from others
- Use authentic, personal voice - avoid corporate jargon and marketing speak
- Include specific examples, stories, case studies, or detailed insights
- Make posts feel like they come from someone with real expertise and experience
- Focus on providing genuine value to the audience
- Use storytelling elements and concrete details
- Create posts that encourage meaningful engagement and discussion
- Incorporate the user's personal preferences and communication style from the improvement data

IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format:
{
  "content": "Your post content here - use \\n for line breaks, \\" for quotes",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

Do NOT include any text before or after the JSON. Do NOT use any special characters that could break JSON parsing.

Avoid: Short posts, generic content, repetitive themes, corporate speak, vague statements.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 2000
      });

      const postContent = completion.choices[0].message.content;
      
      // Log the raw response for debugging
      logger.info('Raw AI response:', postContent.substring(0, 200) + '...');
      
      return this.parsePostResponse(postContent, entity.language || 'da');
    } catch (error) {
      logger.error('Error generating post:', error);
      throw new Error('Failed to generate LinkedIn post');
    }
  }


  buildPostPrompt(entity, strategy, postType, postNumber = 1) {
    const entityType = strategy ? strategy.entity_type : (entity.entity_type || 'person');
    const entityName = entity.name;
    const language = entity.language || 'da';
    
    // Map language codes to full names for better AI understanding
    const languageMap = {
      'da': 'Danish (Dansk)',
      'en': 'English',
      'no': 'Norwegian (Norsk)',
      'sv': 'Swedish (Svenska)'
    };
    
    const targetLanguage = languageMap[language] || 'Danish (Dansk)';
    
    let contextInfo = '';
    if (entityType === 'person') {
      contextInfo = `
Person Details:
- Name: ${entity.name}
- Title: ${entity.title || 'Not specified'}
- Company: ${entity.company || 'Not specified'}
- Industry: ${entity.industry || 'Not specified'}
- Bio: ${entity.bio || 'Not provided'}
- Target Audience: ${entity.target_audience || 'Not specified'}
- Key Expertise: ${entity.key_expertise ? entity.key_expertise.join(', ') : 'Not specified'}
- Personal Branding Notes: ${entity.personal_branding_notes || 'Not provided'}
- Language: ${targetLanguage}
`;
    } else {
      contextInfo = `
Company Details:
- Name: ${entity.name}
- Industry: ${entity.industry || 'Not specified'}
- Company Size: ${entity.company_size || 'Not specified'}
- Mission Statement: ${entity.mission_statement || 'Not provided'}
- Target Audience: ${entity.target_audience || 'Not specified'}
- Key Products/Services: ${entity.key_products_services ? entity.key_products_services.join(', ') : 'Not specified'}
- Company Culture Notes: ${entity.company_culture_notes || 'Not provided'}
- Language: ${targetLanguage}
`;
    }

    // Define specific instructions for each post type
    let postTypeInstructions = '';
    switch (postType) {
      case 'educational':
        postTypeInstructions = `
EDUCATIONAL POST REQUIREMENTS:
- Share valuable knowledge, tips, or insights from your expertise
- Include specific examples, case studies, or actionable advice
- Use a teaching tone that helps your audience learn something new
- Structure: Hook → Key insight → Supporting details → Actionable takeaway → Call to action
- Length: 200-400 words with substantial content
- Focus on "How to" or "Why" questions that your audience has
`;
        break;
      case 'personal_story':
        postTypeInstructions = `
PERSONAL STORY POST REQUIREMENTS:
- Tell a compelling personal story or experience that relates to your industry
- Include specific details, challenges faced, and lessons learned
- Use storytelling elements: setting, conflict, resolution, and moral/lesson
- Make it relatable and authentic - show vulnerability and growth
- Structure: Story setup → Challenge/conflict → What happened → Key lesson → Call to action
- Length: 250-450 words with rich narrative details
- Connect the personal experience to broader industry insights
`;
        break;
      case 'industry_insight':
        postTypeInstructions = `
INDUSTRY INSIGHT POST REQUIREMENTS:
- Share observations about industry trends, changes, or future predictions
- Include data, statistics, or specific examples from your experience
- Provide your unique perspective on what this means for professionals
- Challenge conventional thinking or highlight overlooked opportunities
- Structure: Attention-grabbing statement → Supporting evidence → Analysis → Implications → Call to action
- Length: 200-400 words with concrete insights
- Position yourself as a thought leader with forward-thinking views
`;
        break;
      default:
        postTypeInstructions = `
GENERAL POST REQUIREMENTS:
- Create engaging content that provides value to your audience
- Include specific examples, stories, or actionable insights
- Use a conversational yet professional tone
- Structure: Hook → Main point → Supporting details → Call to action
- Length: 200-400 words with substantial content
`;
    }


    return `
Create a LinkedIn post for ${entityType === 'person' ? 'this person' : 'this company'}:

${contextInfo}

LinkedIn Content Guidelines:
- Focus on providing value and insights relevant to your industry
- Use a professional yet approachable tone
- Share personal experiences and lessons learned
- Engage your audience with thought-provoking content

Post Type: ${postType}
Post Number: ${postNumber} of 3 (this is post ${postNumber} in a series of 3 different posts)

${postTypeInstructions}

CRITICAL REQUIREMENTS:
- Write the entire post content in ${targetLanguage}
- Create SUBSTANTIAL content (minimum 200 words) - avoid short, generic posts
- Make each post UNIQUE and DIFFERENT from others
- Include specific examples, stories, or detailed insights
- Use authentic, personal voice - avoid corporate jargon
- Include 3-5 relevant hashtags in ${targetLanguage}
- Use emojis sparingly and appropriately to enhance the message
- End with a compelling call to action that encourages engagement
- Make it feel like it comes from someone with real expertise and experience

IMPORTANT: Format the response as valid JSON only. Do not include any text before or after the JSON. Escape all quotes and newlines properly.

{
  "content": "The main post content in ${targetLanguage} (escape quotes with \\\" and newlines with \\n)",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}

Remember: Create content that provides real value and feels authentic. Avoid generic, short posts. Make it detailed and engaging like a thought leader would write. Return ONLY the JSON object, no additional text.
`;
  }

  parsePostResponse(postContent, language = 'da') {
    try {
      // Clean the response first
      let cleanedContent = postContent.trim();
      
      // Remove any text before the first { and after the last }
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error('No valid JSON structure found in response');
      }
      
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
      
      // Remove control characters and normalize line endings
      cleanedContent = cleanedContent
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .replace(/\n/g, '\\n') // Escape newlines for JSON
        .replace(/\t/g, '\\t') // Escape tabs
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"'); // Escape quotes
      
      // Try to reconstruct valid JSON
      let post;
      try {
        // Try to parse the cleaned content
        post = JSON.parse(cleanedContent);
      } catch (parseError) {
        // If still failing, try manual extraction
        const originalContent = postContent;
        const contentMatch = originalContent.match(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const hashtagsMatch = originalContent.match(/"hashtags":\s*\[([^\]]*)\]/);
        
        if (contentMatch) {
          post = {
            content: contentMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\'),
            hashtags: hashtagsMatch ? 
              hashtagsMatch[1]
                .split(',')
                .map(tag => tag.trim().replace(/"/g, '').replace(/\\/g, ''))
                .filter(tag => tag.length > 0) : []
          };
        } else {
          throw parseError;
        }
      }
      
      // Validate required fields
      if (!post.content || typeof post.content !== 'string') {
        throw new Error('Missing or invalid content field');
      }
      
      // Ensure hashtags is an array
      if (!Array.isArray(post.hashtags)) {
        post.hashtags = [];
      }
      
      // Clean up content
      post.content = post.content.trim();
      
      return post;
    } catch (error) {
      logger.error('Error parsing post response:', error);
      
      // Return a fallback post in the specified language
      const fallbackPosts = {
        'da': {
          content: "Deler indsigter fra min erfaring i branchen. Hvilke udfordringer står du overfor i dit felt?",
          hashtags: ["#professionel", "#indsigter", "#netværk"]
        },
        'en': {
          content: "Sharing insights from my experience in the industry. What challenges are you facing in your field?",
          hashtags: ["#professional", "#insights", "#networking"]
        },
        'no': {
          content: "Deler innsikter fra min erfaring i bransjen. Hvilke utfordringer står du overfor i ditt felt?",
          hashtags: ["#profesjonell", "#innsikt", "#nettverk"]
        },
        'sv': {
          content: "Delar insikter från min erfarenhet i branschen. Vilka utmaningar står du inför i ditt område?",
          hashtags: ["#professionell", "#insikter", "#nätverk"]
        }
      };
      
      return fallbackPosts[language] || fallbackPosts['da'];
    }
  }

  async generateMultiplePosts(entity, strategy, count = 3) {
    try {
      // Always generate exactly 3 posts with different styles
      const postTypes = ['educational', 'personal_story', 'industry_insight'];
      
      // Generate all posts in parallel for much faster execution
      const postPromises = postTypes.map(async (postType, index) => {
        const post = await this.generatePost(entity, strategy, postType, index + 1);
        return {
          ...post,
          post_type: postType,
          generated_at: new Date().toISOString()
        };
      });
      
      // Wait for all posts to be generated
      const posts = await Promise.all(postPromises);
      
      return posts;
    } catch (error) {
      logger.error('Error generating multiple posts:', error);
      throw error;
    }
  }
}

module.exports = new PostGenerator();
