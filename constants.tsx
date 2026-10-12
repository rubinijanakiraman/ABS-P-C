
export const FILE_SIZE_LIMITS = {
  PDF: 50,
  DOCX: 20,
  XLSX: 20,
  PPTX: 20,
  VSDX: 20,
  VIDEO: 500
};

export const LOB_KEYWORDS = {
  life_insurance: [
    'life insurance', 'policyholder', 'beneficiary', 'nominee', 'premium payment', 'premium lapse', 'grace period', 'surrender value', 'paid-up value', 'policy maturity', 'policy reinstatement', 'underwriting', 'medical underwriting', 'mortality risk', 'evidence of insurability', 'underwriting decision', 'paramedical report', 'death claim', 'death certificate', 'claim settlement', 'beneficiary payout', 'contestability period', 'policy issuance', 'insurance agent', 'insurance advisor', 'proposal form', 'financial advisor', 'annuity', 'endowment policy', 'term life', 'whole life', 'universal life'
  ],
  health_insurance: [
    'hospitalization', 'inpatient treatment', 'outpatient treatment', 'deductible', 'copay', 'health coverage', 'medical network', 'TPA', 'surgery cost', 'treatment cost', 'hospital bill', 'medical reimbursement'
  ],
  property_casualty: [
    'property damage', 'building coverage', 'natural disaster claim', 'fire damage', 'flood damage', 'liability coverage', 'third-party liability', 'accident claim', 'vehicle insurance', 'motor insurance'
  ],
  reinsurance: [
    'treaty', 'facultative', 'reinsurer', 'reinsurance contract', 'ceded risk', 'reinsurance placement', 'portfolio risk transfer'
  ],
  banking: [
    'loan application', 'credit approval', 'loan underwriting', 'EMI payment', 'mortgage loan', 'personal loan', 'credit risk assessment', 'KYC verification', 'account opening', 'savings account', 'current account', 'banking transaction', 'loan servicing', 'loan disbursement', 'credit bureau check', 'collateral verification'
  ],
  personal_accident: [
    'personal accident policy', 'accidental death benefit', 'accidental disability', 'accidental injury claim', 'accidental hospitalization', 'permanent disability benefit', 'temporary disability benefit', 'accident coverage', 'accidental loss of limb', 'accidental death payout', 'accidental claim settlement'
  ]
};

import { DashboardSection, Opportunity } from './types';

export const INITIAL_DATA: DashboardSection[] = [
  {
    id: 'value-chain',
    title: 'Insurance Value Chain',
    count: 30,
    total: 30,
    categories: [
      {
        id: 'distribution',
        name: 'Distribution',
        count: 2,
        total: 2,
        opportunities: [
          { id: 'dist-1', name: 'Digitize Experience for Top Brokers with Client Comparative Analytics for Brokers Sales' },
          { id: 'dist-2', name: 'Accelerated MGA Onboarding through AI' }
        ]
      },
      {
        id: 'underwriting',
        name: 'Underwriting',
        count: 11,
        total: 11,
        opportunities: [
          { id: 'uw-1', name: 'Underwriting Renewal Management' },
          { id: 'uw-2', name: 'New Submission & Triage' },
          { id: 'uw-3', name: 'Servicing & Endorsement Automation' },
          { id: 'uw-4', name: 'Automated Book & Issue' },
          { id: 'uw-5', name: 'UW Data Gathering' },
          { id: 'uw-6', name: 'Renewal Auto Prep' },
          { id: 'uw-7', name: 'Premium Audit' },
          { id: 'uw-8', name: 'UW Quality Audit' },
          { id: 'uw-9', name: 'Concentration Analysis' },
          { id: 'uw-10', name: 'Onboarding New Insurance products' },
          { id: 'uw-11', name: 'Risk Engineering Review' }
        ]
      },
      {
        id: 'claims',
        name: 'Claims',
        count: 11,
        total: 11,
        opportunities: [
          { id: 'clm-1', name: 'Digital FNOL & Triage' },
          { id: 'clm-2', name: 'Summarization for Decision Support' },
          { id: 'clm-3', name: 'Al Driven Document Management' },
          { id: 'clm-4', name: 'Medical Management' },
          { id: 'clm-5', name: 'Legal - Litigation Management' },
          { id: 'clm-6', name: 'Al Assist Language Translation for FNOL' },
          { id: 'clm-7', name: 'Payments COE' },
          { id: 'clm-8', name: 'Recovery section' },
          { id: 'clm-9', name: 'Claims Servicing' },
          { id: 'clm-10', name: 'Al-Led Claims Quality Audit' },
          { id: 'clm-11', name: 'Claim Recoveries' }
        ]
      },
      {
        id: 'reinsurance',
        name: 'Reinsurance',
        count: 6,
        total: 6,
        opportunities: [
          { id: 'rein-1', name: 'Treaty Placement' },
          { id: 'rein-2', name: 'Contracts Management' },
          { id: 'rein-3', name: 'Facultative Placement' },
          { id: 'rein-4', name: 'Portfolio Assessment' },
          { id: 'rein-5', name: 'Reinsurer Profile Analysis' },
          { id: 'rein-6', name: 'Broker Analysis' }
        ]
      }
    ]
  },
  {
    id: 'corporate-functions',
    title: 'Corporate Functions',
    count: 20,
    total: 20,
    categories: [
      {
        id: 'actuarial',
        name: 'Actuarial',
        count: 7,
        total: 7,
        opportunities: [
          { id: 'act-1', name: 'Company Strength' },
          { id: 'act-2', name: 'Reserving Method Selection and Stability Analysis' },
          { id: 'act-3', name: 'Claims ML for IBNR and IBNER Estimation' },
          { id: 'act-4', name: 'Dynamic Actuarial Pricing' },
          { id: 'act-5', name: 'CAT Modeling Data Ingestion' },
          { id: 'act-6', name: 'CAT Monitoring and Exposure Analysis' },
          { id: 'act-7', name: 'Portfolio and Group Reporting' }
        ]
      },
      {
        id: 'hr',
        name: 'HR',
        count: 4,
        total: 4,
        opportunities: [
          { id: 'hr-1', name: 'Al & Gen Al Learning' },
          { id: 'hr-2', name: 'ASK: HR operations' },
          { id: 'hr-3', name: 'Employee Self-Service' },
          { id: 'hr-4', name: 'Candidate Onboarding' }
        ]
      },
      {
        id: 'legal',
        name: 'Legal',
        count: 3,
        total: 3,
        opportunities: [
          { id: 'leg-1', name: 'Legal Front Door' },
          { id: 'leg-2', name: 'Regulatory Change Platform' },
          { id: 'leg-3', name: 'Contract Generation & Analytics' }
        ]
      },
      {
        id: 'tech',
        name: 'Technology',
        count: 3,
        total: 3,
        opportunities: [
          { id: 'tech-1', name: 'Core Technology Platform Recommendations' },
          { id: 'tech-2', name: 'Infra Servicing' },
          { id: 'tech-3', name: 'Al Ops' }
        ]
      },
      {
        id: 'data',
        name: 'Data',
        count: 3,
        total: 3,
        opportunities: [
          { id: 'data-1', name: 'Agents for Data Migration' },
          { id: 'data-2', name: 'Agents for Data Modernization' },
          { id: 'data-3', name: 'Agents for Data Management & Governance' }
        ]
      }
    ]
  }
];

export function findBestOpportunityMatch(l3: string, opportunities: Opportunity[]): Opportunity | undefined {
  if (!l3) return undefined;
  
  const cleanL3 = l3.toLowerCase().trim();
  
  // 1. Direct exact or includes match
  let match = opportunities.find(o => {
    const cleanName = o.name.toLowerCase().trim();
    return cleanName.includes(cleanL3) || cleanL3.includes(cleanName);
  });
  if (match) return match;

  // Helper to canonicalize strings
  const canonicalize = (str: string) => {
    return str.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const canonL3 = canonicalize(cleanL3);

  // 2. Canonicalized match (direct/includes)
  match = opportunities.find(o => {
    const canonName = canonicalize(o.name);
    return canonName.includes(canonL3) || canonL3.includes(canonName);
  });
  if (match) return match;

  // 3. Keyword / synonym mappings
  if (cleanL3.includes("sop") || cleanL3.includes("operating procedure") || cleanL3.includes("broking") || cleanL3.includes("gathering") || cleanL3.includes("collection") || cleanL3.includes("ingest")) {
    const dataGathering = opportunities.find(o => o.id === 'uw-5' || o.name.toLowerCase().includes("gathering"));
    if (dataGathering) return dataGathering;
  }

  if (cleanL3.includes("submission") || cleanL3.includes("triage") || cleanL3.includes("new business")) {
    const submission = opportunities.find(o => o.id === 'uw-2' || o.name.toLowerCase().includes("submission"));
    if (submission) return submission;
  }

  if (cleanL3.includes("endorsement") || cleanL3.includes("servicing") || cleanL3.includes("modification") || cleanL3.includes("change")) {
    const servicing = opportunities.find(o => o.id === 'uw-3' || o.name.toLowerCase().includes("servicing") || o.name.toLowerCase().includes("endorsement"));
    if (servicing) return servicing;
  }

  if (cleanL3.includes("book") || cleanL3.includes("issue")) {
    const bookIssue = opportunities.find(o => o.id === 'uw-4' || o.name.toLowerCase().includes("book"));
    if (bookIssue) return bookIssue;
  }

  if (cleanL3.includes("renewal") && (cleanL3.includes("management") || cleanL3.includes("prep"))) {
    const renewal = opportunities.find(o => o.name.toLowerCase().includes("renewal"));
    if (renewal) return renewal;
  }

  // 4. Word-by-word overlap match
  let maxOverlap = 0;
  let bestMatch: Opportunity | undefined = undefined;
  
  const l3Words = canonL3.split(' ').filter(w => w.length > 2); // Ignore short words
  
  opportunities.forEach(o => {
    const oWords = canonicalize(o.name).split(' ').filter(w => w.length > 2);
    let overlap = 0;
    l3Words.forEach(w => {
      if (oWords.includes(w)) overlap++;
    });
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestMatch = o;
    }
  });

  if (bestMatch && maxOverlap > 0) {
    return bestMatch;
  }

  return undefined;
}

