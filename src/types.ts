export interface RiskFactors {
  ageOver60: boolean;
  bmiOver30: boolean;
  asaGte3: boolean;
  diabetes: boolean;
  lowAlbumin: boolean;
  anemia: boolean;
  lowImmunity: boolean;
  smokingDrinking: boolean;
  surgeryDurationGte4: boolean;
  oralSurgery: boolean;
  tracheostomy: boolean;
}

export interface GeneralInfo {
  fullName: string;
  age: string;
  hn: string;
  dx: string;
  assessorName: string;
  assessmentDate: string;
  riskFactors: RiskFactors;
}

export interface FollowUpRecord {
  id: string;
  date: string;
  hasRedness: boolean;
  hasSwelling: boolean;
  hasHeat: boolean;
  hasPain: boolean;
  hasPus: boolean;
  isWoundDehiscence: boolean;
  hasOdor: boolean;
  hasFever: boolean;
  outcome: 'Continue' | 'Discharged' | 'ReferToMD';
  assessorName: string;
  notes: string;
  timestamp: number;
  completedNursingInterventions?: string[];
}

export interface AssessmentRecord {
  id: string;
  fullName: string;
  age: string;
  hn: string;
  dx: string;
  assessorName: string;
  date: string;
  riskFactors: RiskFactors;
  riskLevel: 'Low' | 'Moderate' | 'High';
  timestamp: number;
  followUps?: FollowUpRecord[];
}
