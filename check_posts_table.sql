-- Check if image columns exist in posts table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name LIKE 'image%'
ORDER BY column_name;

-- Check if any posts have image_url set
SELECT id, content, image_url, image_filename, status, scheduled_date
FROM posts 
WHERE status = 'scheduled'
ORDER BY created_at DESC
LIMIT 5;
