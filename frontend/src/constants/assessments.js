/**
 * PHQ-9 and GAD-7 validated assessment instruments.
 *
 * Questions and scoring are from the public-domain clinical instruments.
 * Scores are 0-3 per question: 0 = Not at all, 1 = Several days,
 * 2 = More than half the days, 3 = Nearly every day.
 */

export const RESPONSE_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

export const PHQ9 = {
  id: 'PHQ9',
  name: 'PHQ-9',
  fullName: 'Patient Health Questionnaire-9',
  description: 'A 9-item screening tool for depression severity.',
  timeframe: 'Over the last 2 weeks',
  maxScore: 27,
  questions: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead or of hurting yourself in some way',
  ],
  severityBands: [
    { min: 0, max: 4, key: 'minimal', label: 'Minimal', color: '#6BAF7D' },
    { min: 5, max: 9, key: 'mild', label: 'Mild', color: '#E8C16A' },
    { min: 10, max: 14, key: 'moderate', label: 'Moderate', color: '#E8A06A' },
    { min: 15, max: 19, key: 'moderately_severe', label: 'Moderately Severe', color: '#D4726A' },
    { min: 20, max: 27, key: 'severe', label: 'Severe', color: '#C0392B' },
  ],
};

export const GAD7 = {
  id: 'GAD7',
  name: 'GAD-7',
  fullName: 'Generalized Anxiety Disorder-7',
  description: 'A 7-item screening tool for anxiety severity.',
  timeframe: 'Over the last 2 weeks',
  maxScore: 21,
  questions: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    "Being so restless that it's hard to sit still",
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen',
  ],
  severityBands: [
    { min: 0, max: 4, key: 'minimal', label: 'Minimal', color: '#6BAF7D' },
    { min: 5, max: 9, key: 'mild', label: 'Mild', color: '#E8C16A' },
    { min: 10, max: 14, key: 'moderate', label: 'Moderate', color: '#E8A06A' },
    { min: 15, max: 21, key: 'severe', label: 'Severe', color: '#C0392B' },
  ],
};

export const ASSESSMENTS = { PHQ9, GAD7 };

/**
 * Get the severity band for a given score.
 * @param {object} assessment - PHQ9 or GAD7 definition
 * @param {number} score
 * @returns {object} severity band
 */
export function getSeverityBand(assessment, score) {
  return (
    assessment.severityBands.find((band) => score >= band.min && score <= band.max) ||
    assessment.severityBands[0]
  );
}

export const CLINICAL_DISCLAIMER =
  'This is a screening tool, not a clinical diagnosis. Scores indicate symptom severity and should be discussed with a healthcare professional. If you are in crisis, please use the crisis resources button.';
