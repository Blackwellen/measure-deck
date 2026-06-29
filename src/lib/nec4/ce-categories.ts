export interface NEC4CECategory {
  code: string; // e.g. '60.1(1)'
  description: string;
  risk_party: 'Employer' | 'Contractor' | 'Neutral';
  notification_obligation:
    | 'contractor_notifies'
    | 'pm_instructs'
    | 'either';
  eight_week_notification: boolean; // whether 8-week notification rule applies
  common_examples: string[];
}

export const NEC4_CE_CATEGORIES: NEC4CECategory[] = [
  {
    code: '60.1(1)',
    description: 'PM gives an instruction changing the Works Information',
    risk_party: 'Employer',
    notification_obligation: 'pm_instructs',
    eight_week_notification: true,
    common_examples: [
      'Design change instruction',
      'Specification change',
      'Additional work instruction',
    ],
  },
  {
    code: '60.1(2)',
    description: 'Employer does not allow access by the access date',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Site access delayed',
      'Third party access restriction',
    ],
  },
  {
    code: '60.1(3)',
    description:
      'Employer does not provide something by the date shown on the Accepted Programme',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Free-issue materials not delivered',
      'Employer-supplied equipment delayed',
    ],
  },
  {
    code: '60.1(4)',
    description: 'PM gives an instruction to stop or not to start work',
    risk_party: 'Employer',
    notification_obligation: 'pm_instructs',
    eight_week_notification: true,
    common_examples: ['Stop notice', 'Section hold pending approval'],
  },
  {
    code: '60.1(5)',
    description: 'Work is not done due to an Employer risk event',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Client instruction causing delay',
      'Employer-caused obstruction',
    ],
  },
  {
    code: '60.1(6)',
    description:
      'PM or Supervisor does not reply to a communication within the period stated in the contract',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'PM fails to respond to submission in contract period',
      'Supervisor fails to inspect',
    ],
  },
  {
    code: '60.1(7)',
    description:
      'PM instructs the Contractor to search for a Defect and none is found',
    risk_party: 'Employer',
    notification_obligation: 'pm_instructs',
    eight_week_notification: true,
    common_examples: [
      'Investigation reveals no defect',
      'Opening up with no defect found',
    ],
  },
  {
    code: '60.1(8)',
    description: 'PM or Supervisor changes a decision previously communicated',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Changed approval decision',
      'Revised instruction superseding earlier one',
    ],
  },
  {
    code: '60.1(9)',
    description: 'PM withholds an acceptance',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Unreasonable withholding of programme acceptance',
      'Unreasonable rejection of design submission',
    ],
  },
  {
    code: '60.1(10)',
    description:
      'Supervisor instructs the Contractor to search and the search reveals Employer-caused defect',
    risk_party: 'Employer',
    notification_obligation: 'pm_instructs',
    eight_week_notification: true,
    common_examples: [
      'Defect caused by Employer-supplied materials',
      'Opening up reveals pre-existing defect',
    ],
  },
  {
    code: '60.1(11)',
    description: 'A test or inspection causes unnecessary delay',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Delayed inspection causing programme impact',
      'Extended testing period',
    ],
  },
  {
    code: '60.1(12)',
    description:
      'The Contractor encounters physical conditions which are within the Site and are not weather conditions',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Unexpected ground conditions',
      'Buried services not shown on drawings',
      'Archaeological finds',
    ],
  },
  {
    code: '60.1(13)',
    description:
      'A weather measurement is recorded within the contract area that is worse than the weather which, at the contract date, was forecast to occur',
    risk_party: 'Neutral',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Exceptional rainfall exceeding 1-in-10 year return period',
      'Extreme frost event',
    ],
  },
  {
    code: '60.1(14)',
    description: 'An Employer risk event occurs',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Loss/damage to works for Employer risk',
      'Employer-caused damage',
    ],
  },
  {
    code: '60.1(15)',
    description: 'The PM certifies take over of a part of the works',
    risk_party: 'Employer',
    notification_obligation: 'pm_instructs',
    eight_week_notification: true,
    common_examples: [
      'Partial possession before completion',
      'Early sectional completion',
    ],
  },
  {
    code: '60.1(16)',
    description:
      'The Employer does not provide materials, facilities and samples as stated in the Works Information',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Free-issue material not meeting spec',
      'Employer samples not provided on time',
    ],
  },
  {
    code: '60.1(17)',
    description:
      'The Employer does not provide Plant and Materials which he is to provide by the date for provision',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Employer-supplied equipment not delivered',
      'Specialist plant delayed',
    ],
  },
  {
    code: '60.1(18)',
    description:
      'The Contractor exercises his right to stop work under HGCRA (combined with clause 91)',
    risk_party: 'Employer',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: false,
    common_examples: [
      'S112 suspension for non-payment',
      'Statutory right to suspend exercised',
    ],
  },
  {
    code: '60.1(19)',
    description: 'A prevention event occurs',
    risk_party: 'Neutral',
    notification_obligation: 'contractor_notifies',
    eight_week_notification: true,
    common_examples: [
      'Government action preventing works',
      'Statutory restriction preventing progress',
    ],
  },
  {
    code: '60.1(20)',
    description: 'PM gives an instruction changing the Key Dates',
    risk_party: 'Employer',
    notification_obligation: 'pm_instructs',
    eight_week_notification: true,
    common_examples: ['Key Date acceleration/delay instruction'],
  },
  {
    code: '60.1(21)',
    description:
      'PM gives an instruction to deal with an object found within the Site',
    risk_party: 'Employer',
    notification_obligation: 'pm_instructs',
    eight_week_notification: true,
    common_examples: [
      'Archaeological find instruction',
      'Unexploded ordnance instruction',
      'Contaminated material instruction',
    ],
  },
];
