/**
 * Static professional directory data.
 * Phase 1: curated list of Canadian mental health resources.
 * Phase 2: API-integrated searchable directory.
 */

export const PROFESSIONALS = [
  {
    id: '1',
    name: 'Canadian Mental Health Association',
    specialty: 'General Mental Health',
    type: 'organization',
    phone: '1-833-456-4566',
    website: 'https://cmha.ca',
    description:
      'Nation-wide community mental health services including counseling, support groups, and crisis intervention.',
  },
  {
    id: '2',
    name: 'BetterHelp Canada',
    specialty: 'Online Therapy',
    type: 'platform',
    phone: null,
    website: 'https://betterhelp.com',
    description:
      'Licensed therapists available online. Convenient for students with flexible scheduling.',
  },
  {
    id: '3',
    name: 'Psychology Today Therapist Finder',
    specialty: 'Find Local Therapists',
    type: 'directory',
    phone: null,
    website: 'https://psychologytoday.com/ca/therapists',
    description:
      'Searchable directory of licensed therapists in Canada with filters for specialty, insurance, and location.',
  },
  {
    id: '4',
    name: 'Crisis Services Canada',
    specialty: 'Crisis Support',
    type: 'hotline',
    phone: '1-833-456-4566',
    website: 'https://crisisservicescanada.ca',
    description: '24/7 crisis support via phone and text. Toll-free.',
  },
  {
    id: '5',
    name: 'Kids Help Phone',
    specialty: 'Youth Counseling',
    type: 'hotline',
    phone: '1-800-668-6868',
    website: 'https://kidshelpphone.ca',
    description: 'Free 24/7 counseling for young people. Call, text, or live chat.',
  },
  {
    id: '6',
    name: 'Hope for Wellness Helpline',
    specialty: 'Indigenous Support',
    type: 'hotline',
    phone: '1-855-242-3310',
    website: 'https://hopeforwellness.ca',
    description:
      '24/7 support for Indigenous peoples in Canada. Available in English, French, Cree, Ojibway, and Inuktitut.',
  },
  {
    id: '7',
    name: 'Wellness Together Canada',
    specialty: 'Free Counseling',
    type: 'platform',
    phone: '1-866-585-0445',
    website: 'https://wellnesstogether.ca',
    description:
      'Government-funded free mental health and substance use support. Phone, text, and online counseling.',
  },
];

export const PROFESSIONAL_DISCLAIMER =
  'This directory provides general information only. Sakina does not endorse, recommend, or guarantee any specific provider. Please verify credentials and suitability for your needs.';
