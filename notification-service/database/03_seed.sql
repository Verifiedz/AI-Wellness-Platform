-- ============================================================================
-- File: 03_seed.sql
-- Description: Seed wellness tips for students
-- ============================================================================

-- Only insert if the table is empty (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM wellness_tips LIMIT 1) THEN
        
        -- ====================================================================
        -- CATEGORY: Sleep & Rest (20 tips)
        -- ====================================================================
        INSERT INTO wellness_tips (content, category) VALUES
        ('Aim for 7-9 hours of sleep each night for better focus and memory retention.', 'sleep'),
        ('Keep a consistent sleep schedule, even on weekends, to regulate your body clock.', 'sleep'),
        ('Avoid screens 30 minutes before bed to help your brain wind down.', 'sleep'),
        ('Create a relaxing bedtime routine like reading or light stretching.', 'sleep'),
        ('Keep your bedroom cool, dark, and quiet for optimal sleep quality.', 'sleep'),
        ('Avoid caffeine after 2 PM to prevent sleep disruption.', 'sleep'),
        ('Take a 20-minute power nap if you''re feeling tired, but not after 3 PM.', 'sleep'),
        ('Use your bed only for sleep, not studying, to strengthen sleep associations.', 'sleep'),
        ('If you can''t fall asleep after 20 minutes, get up and do a quiet activity.', 'sleep'),
        ('Write down tomorrow''s tasks before bed to clear your mind.', 'sleep'),
        ('Avoid heavy meals within 2 hours of bedtime for better sleep.', 'sleep'),
        ('Consider a sleep mask or blackout curtains to block light.', 'sleep'),
        ('Practice the 4-7-8 breathing technique before bed to relax.', 'sleep'),
        ('Limit alcohol consumption as it disrupts sleep quality.', 'sleep'),
        ('Exercise regularly, but finish at least 3 hours before bedtime.', 'sleep'),
        ('Keep a sleep journal to identify patterns affecting your rest.', 'sleep'),
        ('Use white noise or calming sounds if you need help falling asleep.', 'sleep'),
        ('Wake up at the same time daily to strengthen your circadian rhythm.', 'sleep'),
        ('Get sunlight exposure in the morning to help regulate sleep cycles.', 'sleep'),
        ('Avoid hitting snooze repeatedly - it fragments your sleep quality.', 'sleep'),

        -- ====================================================================
        -- CATEGORY: Study Habits & Productivity (25 tips)
        -- ====================================================================
        ('Use the Pomodoro Technique: study for 25 minutes, then take a 5-minute break.', 'study'),
        ('Break large assignments into smaller, manageable tasks.', 'study'),
        ('Study in the same place regularly to create a productive environment.', 'study'),
        ('Turn off notifications during study sessions to maintain focus.', 'study'),
        ('Review your notes within 24 hours of class to improve retention.', 'study'),
        ('Use active recall by testing yourself instead of just rereading.', 'study'),
        ('Create a study schedule and stick to it consistently.', 'study'),
        ('Teach the material to someone else to deepen your understanding.', 'study'),
        ('Use color-coding in your notes to organize information better.', 'study'),
        ('Take handwritten notes during lectures for better retention.', 'study'),
        ('Start with the most challenging task when your energy is highest.', 'study'),
        ('Use flashcards or spaced repetition apps for memorization.', 'study'),
        ('Study actively by summarizing concepts in your own words.', 'study'),
        ('Join or form a study group to learn from peers.', 'study'),
        ('Reward yourself after completing study sessions to stay motivated.', 'study'),
        ('Use diagrams and mind maps for visual learning.', 'study'),
        ('Eliminate clutter from your study space for better concentration.', 'study'),
        ('Review previous material before starting new topics.', 'study'),
        ('Ask questions during class - don''t wait until you''re stuck.', 'study'),
        ('Use practice exams to prepare and reduce test anxiety.', 'study'),
        ('Create acronyms or mnemonics to remember complex information.', 'study'),
        ('Study different subjects in separate sessions to avoid confusion.', 'study'),
        ('Take notes during readings to stay engaged with the material.', 'study'),
        ('Use the library or quiet spaces when you need deep focus.', 'study'),
        ('Review your mistakes on assignments to learn from them.', 'study'),

        -- ====================================================================
        -- CATEGORY: Physical Exercise & Movement (20 tips)
        -- ====================================================================
        ('Take a 10-minute walk between study sessions to boost energy.', 'exercise'),
        ('Do 5 minutes of stretching after waking up to energize your body.', 'exercise'),
        ('Use stairs instead of elevators to add movement to your day.', 'exercise'),
        ('Try a 7-minute workout video when you''re short on time.', 'exercise'),
        ('Join a campus sports team or fitness class to stay active socially.', 'exercise'),
        ('Do desk exercises like neck rolls and shoulder shrugs while studying.', 'exercise'),
        ('Walk or bike to class instead of driving when possible.', 'exercise'),
        ('Set a timer to stand and move every hour during long study sessions.', 'exercise'),
        ('Try yoga or pilates for flexibility and stress relief.', 'exercise'),
        ('Use a standing desk or elevated surface while reviewing notes.', 'exercise'),
        ('Dance to your favorite song as an energizing study break.', 'exercise'),
        ('Do bodyweight exercises like push-ups or squats in your dorm.', 'exercise'),
        ('Join friends for active recreation like frisbee or basketball.', 'exercise'),
        ('Take the long route when walking across campus.', 'exercise'),
        ('Try resistance band exercises that don''t require gym equipment.', 'exercise'),
        ('Park farther away to add extra steps to your day.', 'exercise'),
        ('Use fitness apps or videos for guided home workouts.', 'exercise'),
        ('Stretch your back, neck, and wrists after long computer sessions.', 'exercise'),
        ('Join a running club or find a workout buddy for accountability.', 'exercise'),
        ('Try swimming for low-impact, full-body exercise.', 'exercise'),

        -- ====================================================================
        -- CATEGORY: Nutrition & Hydration (20 tips)
        -- ====================================================================
        ('Keep a reusable water bottle with you and sip throughout the day.', 'nutrition'),
        ('Eat a balanced breakfast with protein to fuel your morning.', 'nutrition'),
        ('Pack healthy snacks like nuts, fruit, or yogurt for between classes.', 'nutrition'),
        ('Drink a glass of water before each meal to stay hydrated.', 'nutrition'),
        ('Choose whole grains over refined carbs for sustained energy.', 'nutrition'),
        ('Eat plenty of colorful vegetables for essential vitamins.', 'nutrition'),
        ('Limit energy drinks - they can cause crashes and disrupt sleep.', 'nutrition'),
        ('Prepare meals in advance to avoid unhealthy last-minute choices.', 'nutrition'),
        ('Don''t skip meals, especially breakfast, to maintain energy levels.', 'nutrition'),
        ('Keep healthy snacks in your backpack to avoid vending machines.', 'nutrition'),
        ('Eat mindfully without distractions like phones or TV.', 'nutrition'),
        ('Include protein in every meal to stay fuller longer.', 'nutrition'),
        ('Limit processed foods and choose whole, natural options.', 'nutrition'),
        ('Drink herbal tea instead of sugary drinks for hydration.', 'nutrition'),
        ('Add berries to your breakfast for brain-boosting antioxidants.', 'nutrition'),
        ('Eat omega-3 rich foods like fish or walnuts for brain health.', 'nutrition'),
        ('Plan one new healthy recipe to try each week.', 'nutrition'),
        ('Keep portion sizes reasonable to maintain steady energy.', 'nutrition'),
        ('Reduce added sugar intake to avoid energy crashes.', 'nutrition'),
        ('Eat dark leafy greens regularly for iron and nutrients.', 'nutrition'),

        -- ====================================================================
        -- CATEGORY: Mental Health & Stress Management (25 tips)
        -- ====================================================================
        ('Practice deep breathing for 2 minutes when feeling stressed.', 'mental_health'),
        ('Use the 5-4-3-2-1 grounding technique during anxious moments.', 'mental_health'),
        ('Schedule worry time - set aside 15 minutes to process concerns.', 'mental_health'),
        ('Practice self-compassion - talk to yourself like a good friend.', 'mental_health'),
        ('Write in a gratitude journal before bed each night.', 'mental_health'),
        ('Reach out to campus counseling services if you''re struggling.', 'mental_health'),
        ('Practice progressive muscle relaxation to release tension.', 'mental_health'),
        ('Use positive affirmations to challenge negative self-talk.', 'mental_health'),
        ('Take a mental health day when you need it - it''s okay.', 'mental_health'),
        ('Limit social media when it makes you feel anxious or inadequate.', 'mental_health'),
        ('Practice mindfulness meditation for just 5 minutes daily.', 'mental_health'),
        ('Create boundaries between school work and personal time.', 'mental_health'),
        ('Remember that perfectionism isn''t realistic or necessary.', 'mental_health'),
        ('Talk to someone you trust when feeling overwhelmed.', 'mental_health'),
        ('Use a stress ball or fidget toy during anxious moments.', 'mental_health'),
        ('Practice the 4-7-8 breathing technique before exams.', 'mental_health'),
        ('Acknowledge your feelings without judgment - they''re valid.', 'mental_health'),
        ('Take breaks from the news if it''s affecting your mental health.', 'mental_health'),
        ('Celebrate small wins and progress, not just big achievements.', 'mental_health'),
        ('Use visualization techniques before stressful situations.', 'mental_health'),
        ('Remember that asking for help is a sign of strength.', 'mental_health'),
        ('Practice saying no to protect your time and energy.', 'mental_health'),
        ('Use calming apps like Headspace or Calm when stressed.', 'mental_health'),
        ('Write down your worries to get them out of your head.', 'mental_health'),
        ('Remember that bad days are temporary - tomorrow is a fresh start.', 'mental_health'),

        -- ====================================================================
        -- CATEGORY: Social Connection (15 tips)
        -- ====================================================================
        ('Text or call a friend you haven''t connected with recently.', 'social'),
        ('Join a campus club related to your interests.', 'social'),
        ('Have a meaningful conversation with someone new today.', 'social'),
        ('Schedule regular video calls with family or old friends.', 'social'),
        ('Attend campus events to meet people with similar interests.', 'social'),
        ('Practice active listening when talking with others.', 'social'),
        ('Form a study group to combine learning and socializing.', 'social'),
        ('Volunteer for a cause you care about to build community.', 'social'),
        ('Share a meal with friends instead of eating alone.', 'social'),
        ('Reach out to someone who might be feeling lonely.', 'social'),
        ('Plan a fun activity with friends to balance academics.', 'social'),
        ('Be present during social time - put your phone away.', 'social'),
        ('Express appreciation to someone who''s helped you.', 'social'),
        ('Attend office hours to connect with professors.', 'social'),
        ('Join intramural sports for exercise and friendship.', 'social'),

        -- ====================================================================
        -- CATEGORY: Time Management & Organization (15 tips)
        -- ====================================================================
        ('Use a planner or calendar app to track assignments and deadlines.', 'organization'),
        ('Plan your week every Sunday evening.', 'organization'),
        ('Set daily priorities using the 1-3-5 rule: 1 big, 3 medium, 5 small tasks.', 'organization'),
        ('Use time blocking to dedicate specific hours to tasks.', 'organization'),
        ('Keep your workspace organized to reduce decision fatigue.', 'organization'),
        ('Set up a filing system for class materials and notes.', 'organization'),
        ('Review your schedule each morning to prepare mentally.', 'organization'),
        ('Use reminders and alarms for important deadlines.', 'organization'),
        ('Batch similar tasks together for greater efficiency.', 'organization'),
        ('Allocate buffer time between activities for transitions.', 'organization'),
        ('Keep a master list of all assignments and due dates.', 'organization'),
        ('Use different notebooks or folders for each class.', 'organization'),
        ('Clean and reset your workspace at the end of each day.', 'organization'),
        ('Schedule self-care activities like you would classes.', 'organization'),
        ('Do a weekly review to assess what''s working and adjust.', 'organization'),

        -- ====================================================================
        -- CATEGORY: Mindfulness & Self-Care (20 tips)
        -- ====================================================================
        ('Spend 2 minutes noticing your surroundings mindfully.', 'mindfulness'),
        ('Practice gratitude by listing 3 things you''re thankful for.', 'mindfulness'),
        ('Take a phone-free walk and observe nature around you.', 'mindfulness'),
        ('Do a body scan meditation to release tension.', 'mindfulness'),
        ('Engage your senses: notice 5 things you can see, hear, or feel.', 'mindfulness'),
        ('Practice eating one meal mindfully today, savoring each bite.', 'mindfulness'),
        ('Set an intention for your day each morning.', 'mindfulness'),
        ('Take 3 conscious breaths before starting a new task.', 'mindfulness'),
        ('Notice when your mind wanders and gently bring it back.', 'mindfulness'),
        ('Create a personal sanctuary space in your room for relaxation.', 'mindfulness'),
        ('Listen to calming music for 10 minutes without multitasking.', 'mindfulness'),
        ('Take a warm shower or bath to practice self-care.', 'mindfulness'),
        ('Spend time on a hobby that brings you joy.', 'mindfulness'),
        ('Practice self-massage on tense areas like shoulders or temples.', 'mindfulness'),
        ('Unplug from technology for one hour before bed.', 'mindfulness'),
        ('Sit in sunlight for a few minutes to boost mood and vitamin D.', 'mindfulness'),
        ('Journal about your day without judgment or editing.', 'mindfulness'),
        ('Do something creative like drawing, writing, or crafting.', 'mindfulness'),
        ('Spend time in nature, even if just sitting outside for 5 minutes.', 'mindfulness'),
        ('Give yourself permission to rest when you need it.', 'mindfulness');

        RAISE NOTICE 'Successfully inserted % wellness tips', (SELECT COUNT(*) FROM wellness_tips);
    ELSE
        RAISE NOTICE 'Wellness tips already exist, skipping seed data';
    END IF;
END $$;

-- ============================================================================
-- Seed data insertion complete
-- ============================================================================