-- ============================================================================
-- Journal Service Seed Data - Journal Prompts
-- ============================================================================

-- Only seed if the table is empty
INSERT INTO journal_prompts (content, category)
SELECT content, category FROM (VALUES
    -- Gratitude prompts
    ('What are three things you are grateful for today?', 'gratitude'),
    ('Who made a positive impact on your day and why?', 'gratitude'),
    ('What small moment today brought you joy?', 'gratitude'),
    ('What is something you often take for granted that you are thankful for?', 'gratitude'),
    ('Write about a challenge that taught you something valuable.', 'gratitude'),

    -- Self-reflection prompts
    ('How are you really feeling right now? Be honest with yourself.', 'reflection'),
    ('What is one thing you would change about today if you could?', 'reflection'),
    ('What did you learn about yourself today?', 'reflection'),
    ('What boundaries do you need to set or maintain?', 'reflection'),
    ('How have you grown in the past month?', 'reflection'),

    -- Wellness prompts
    ('How did you take care of your body today?', 'wellness'),
    ('What did you eat today and how did it make you feel?', 'wellness'),
    ('Did you move your body today? How did that feel?', 'wellness'),
    ('How many hours of sleep did you get last night? How do you feel?', 'wellness'),
    ('What is one healthy habit you want to build?', 'wellness'),

    -- Mindfulness prompts
    ('Describe your surroundings right now using all five senses.', 'mindfulness'),
    ('What emotions came up for you today? Where did you feel them in your body?', 'mindfulness'),
    ('Write about a moment today when you felt fully present.', 'mindfulness'),
    ('What thoughts kept coming back to you today?', 'mindfulness'),
    ('Take three deep breaths and write whatever comes to mind.', 'mindfulness'),

    -- Goal-setting prompts
    ('What is one small step you can take tomorrow toward a big goal?', 'goals'),
    ('What does your ideal day look like?', 'goals'),
    ('What habit do you want to start or stop?', 'goals'),
    ('Where do you see yourself in six months?', 'goals'),
    ('What is holding you back from achieving your goals?', 'goals'),

    -- Emotional processing prompts
    ('What is something that has been weighing on your mind?', 'emotional'),
    ('Write a letter to your past self. What would you say?', 'emotional'),
    ('What is one worry you can let go of today?', 'emotional'),
    ('Describe a recent situation that triggered a strong emotion.', 'emotional'),
    ('What do you need to forgive yourself for?', 'emotional'),

    -- Social connection prompts
    ('Who do you miss right now? What would you tell them?', 'social'),
    ('Describe a meaningful conversation you had recently.', 'social'),
    ('How can you show kindness to someone tomorrow?', 'social'),
    ('What qualities do you value most in your friendships?', 'social'),
    ('Who inspires you and why?', 'social'),

    -- Creativity prompts
    ('If you could go anywhere in the world right now, where would it be?', 'creativity'),
    ('Write about your happiest memory in detail.', 'creativity'),
    ('If you had no fear, what would you do?', 'creativity'),
    ('Describe your perfect weekend from start to finish.', 'creativity'),
    ('What song or book has impacted you the most and why?', 'creativity')
) AS seed(content, category)
WHERE NOT EXISTS (SELECT 1 FROM journal_prompts LIMIT 1);
