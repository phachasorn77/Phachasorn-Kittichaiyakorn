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
}
