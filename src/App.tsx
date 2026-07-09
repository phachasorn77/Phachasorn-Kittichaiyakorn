import React, { useState, useEffect, useMemo } from 'react';
import { Check, Trash2, Save, History, X, Info, Activity, Search, Plus, ChevronRight, AlertTriangle, Calendar, UserCheck, ArrowLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { GeneralInfo, AssessmentRecord, RiskFactors, FollowUpRecord } from './types';

const RISK_FACTORS_CONFIG = [
  { id: 'ageOver60', label: 'อายุ > 60 ปี' },
  { id: 'bmiOver30', label: 'ดัชนีมวลกาย (BMI) > 30 kg/m²' },
  { id: 'asaGte3', label: 'ASA class ≥ 3' },
  { id: 'diabetes', label: 'เป็น Diabetes Mellitus หรือระดับน้ำตาลในเลือด > 180 mg/dL' },
  { id: 'lowAlbumin', label: 'Albumin < 3.5 g/dL หรือมีภาวะทุพโภชนาการ' },
  { id: 'anemia', label: 'Hemoglobin (Hb) < 10 g/dL (ภาวะโลหิตจาง)' },
  { id: 'lowImmunity', label: 'ภาวะภูมิคุ้มกันต่ำ หรือได้รับยากดภูมิคุ้มกัน (เช่น steroid)' },
  { id: 'smokingDrinking', label: 'สูบบุหรี่ หรือดื่มแอลกอฮอล์' },
  { id: 'surgeryDurationGte4', label: 'ระยะเวลาการผ่าตัด ≥ 4 hrs.' },
  { id: 'oralSurgery', label: 'ผู้ป่วยที่เข้ารับการผ่าตัดในช่องปาก' },
  { id: 'tracheostomy', label: 'ผู้ป่วยที่ได้รับการผ่าตัดเปิดหลอดลมคอ (Tracheostomy)' },
] as const;

const initialRiskFactors: RiskFactors = {
  ageOver60: false,
  bmiOver30: false,
  asaGte3: false,
  diabetes: false,
  lowAlbumin: false,
  anemia: false,
  lowImmunity: false,
  smokingDrinking: false,
  surgeryDurationGte4: false,
  oralSurgery: false,
  tracheostomy: false,
};

const RISK_LEVELS = {
  Low: {
    label: 'Low Risk',
    color: 'text-green-600 bg-green-50',
    dot: 'bg-green-500',
    instructions: [
      'ดูแลความสะอาดร่างกาย / อาบน้ำ',
      'ตรวจ glucose ตาม routine',
      'แนะนำโภชนาการ',
      'ให้การพยาบาล aseptic technique'
    ]
  },
  Moderate: {
    label: 'Moderate Risk',
    color: 'text-yellow-600 bg-yellow-50',
    dot: 'bg-yellow-500',
    instructions: [
      'สระผม/สครับด้วย CHG',
      'Monitor glucose + report >180 mg/dL',
      'ประเมิน nutrition',
      'ตรวจ antibiotic prophylaxis',
      'ป้องกัน hypothermia',
      'ประเมินผิวหนังบริเวณผ่าตัด'
    ]
  },
  High: {
    label: 'High Risk',
    color: 'text-red-600 bg-red-50',
    dot: 'bg-red-500',
    instructions: [
      'ผิวหนังบรเวณที่ผ่าตัด: CHG + skin prep เคร่งครัด',
      'Glucose: monitor + report >180',
      'Nutrition: ประเมิน nutrition และปรึกษานักโภชนาการ',
      'Antibiotic: ต้องได้ก่อนผ่าตัด ≤60 นาที',
      'Physiology: ป้องกัน hypothermia',
      'Aseptic: strict hand hygiene + การดูแลอุปกรณ์คาทางการแพทย์อย่างถูกหลักปราศจากเชื้อ'
    ]
  }
} as const;

const TRACHEOSTOMY_INSTRUCTIONS = {
  Low: {
    items: [
      'Stoma care: วันละ 1 ครั้ง',
      'Assessment: ทุกเวร (อย่างน้อย q8h)',
      'Suction: PRN (ตามข้อบ่งชี้)'
    ],
    note: 'เน้น “เฝ้าระวัง” มากกว่าทำบ่อย'
  },
  Moderate: {
    items: [
      'Stoma care: วันละ 2 ครั้ง',
      'Assessment: ทุกเวร + เน้นละเอียด',
      'Suction: ตามอาการ (มักถี่ขึ้น)'
    ],
    note: 'จุดนี้คือ “ช่วงต้องกันไม่ให้ลุกลาม”'
  },
  High: {
    items: [
      'Stoma care: วันละ 2–3 ครั้ง/แล้วแต่สถานการณ์ที่เกิด',
      'Assessment: ทุกเวร + เฝ้าระวังใกล้ชิด',
      'Suction: ตามอาการ (มักถี่)',
      'แจ้งแพทย์ / พิจารณา ATB'
    ],
    note: 'เน้น “ควบคุม infection + ป้องกันลุกลาม”'
  }
};

const ORAL_SURGERY_INSTRUCTIONS = {
  Low: {
    items: [
      'งดบ้วน 24 ชม.แรก หลังจากนั้น oral care ด้วย NSS วันละ 2 ครั้ง/ตาม order แพทย์',
      'ปฏิบัติ aseptic technique'
    ]
  },
  Moderate: {
    items: [
      'งดบ้วน 24 ชม.แรก หลังจากนั้น oral care ด้วย NSS วันละ 2-3 ครั้ง/ตาม order แพทย์',
      'หลีกเลี่ยงรบกวนแผล (ไม่บ้วนแรง)',
      'ประเมินแผลทุกวัน'
    ]
  },
  High: {
    items: [
      'งดบ้วน 24 ชม.แรก หลังจากนั้น oral care ด้วย NSS วันละ 3–4 ครั้ง/ตาม order แพทย์',
      'หลีกเลี่ยงรบกวนแผล (ไม่บ้วนแรง)',
      'เฝ้าระวัง infection ใกล้ชิด'
    ]
  }
};

export default function App() {
  const initialGeneralInfo: GeneralInfo = { 
    fullName: '', 
    age: '', 
    hn: '', 
    dx: '', 
    assessorName: '', 
    assessmentDate: format(new Date(), 'yyyy-MM-dd'), 
    riskFactors: initialRiskFactors 
  };

  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>(() => {
    const saved = localStorage.getItem('general_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialGeneralInfo, ...parsed, riskFactors: { ...initialGeneralInfo.riskFactors, ...parsed.riskFactors } };
    }
    return initialGeneralInfo;
  });

  const [records, setRecords] = useState<AssessmentRecord[]>(() => {
    const saved = localStorage.getItem('assessment_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false);
  const [showRiskAlert, setShowRiskAlert] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [showAsaInfo, setShowAsaInfo] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // Follow-up & Monitoring states
  const [activeTab, setActiveTab] = useState<'checklist' | 'followup'>('checklist');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpSearch, setFollowUpSearch] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState<'All' | 'High' | 'Moderate' | 'Low'>('All');

  const initialFollowUpForm = {
    date: format(new Date(), 'yyyy-MM-dd'),
    woundStatus: 'Normal' as 'Normal' | 'Erythema' | 'Discharge' | 'InfectionSuspected' | 'Other',
    woundStatusCustom: '',
    hasPain: false,
    hasSwelling: false,
    hasRedness: false,
    hasHeat: false,
    hasPus: false,
    hasFever: false,
    isWoundDehiscence: false,
    outcome: 'Continue' as 'Continue' | 'Discharged' | 'ReferToMD',
    assessorName: '',
    notes: ''
  };

  const [followUpForm, setFollowUpForm] = useState(initialFollowUpForm);



  const riskScore = useMemo(() => {
    return Object.values(generalInfo.riskFactors).filter(Boolean).length;
  }, [generalInfo.riskFactors]);

  const riskLevel = useMemo((): 'Low' | 'Moderate' | 'High' => {
    if (riskScore >= 5) return 'High';
    if (riskScore >= 3) return 'Moderate';
    return 'Low';
  }, [riskScore]);

  useEffect(() => {
    if (showRiskAlert || validationError || showSaveSuccess) {
      const duration = riskLevel === 'High' && showRiskAlert ? 6000 : 4000;
      const timer = setTimeout(() => {
        setShowRiskAlert(false);
        setValidationError(null);
        setShowSaveSuccess(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [showRiskAlert, validationError, showSaveSuccess, riskLevel]);

  useEffect(() => {
    localStorage.setItem('general_info', JSON.stringify(generalInfo));
  }, [generalInfo]);

  // Only reset assessment if clinical data changes AND we are not in edit mode
  useEffect(() => {
    if (!editingRecordId) {
      setIsAssessmentComplete(false);
    }
  }, [
    generalInfo.fullName, 
    generalInfo.age, 
    generalInfo.hn, 
    generalInfo.dx, 
    generalInfo.riskFactors,
    editingRecordId
  ]);

  useEffect(() => {
    localStorage.setItem('assessment_records', JSON.stringify(records));
  }, [records]);

  const validateInfo = (isFinalSave = false) => {
    const requiredFields: { key: keyof GeneralInfo; label: string }[] = [
      { key: 'fullName', label: 'ชื่อ-นามสกุล' },
      { key: 'age', label: 'อายุ' },
      { key: 'hn', label: 'HN' },
      { key: 'dx', label: 'Dx' },
    ];

    const missing = requiredFields.find(f => !generalInfo[f.key]);
    if (missing) {
      setValidationError(`กรุณาระบุ ${missing.label}`);
      return false;
    }

    if (generalInfo.hn.length !== 7) {
      setValidationError('HN ต้องมี 7 หลัก');
      return false;
    }

    if (isFinalSave) {
      if (!generalInfo.assessorName) {
        setValidationError('กรุณาระบุชื่อผู้ประเมิน');
        return false;
      }
      if (!generalInfo.assessorName.trim().includes(' ')) {
        setValidationError('กรุณาระบุชื่อ-นามสกุล ของผู้ประเมิน');
        return false;
      }
    }

    return true;
  };

  const resetForm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'เริ่มประเมินใหม่?',
      message: 'คุณต้องการล้างข้อมูลปัจจุบันทั้งหมดเพื่อเริ่มใหม่ใช่หรือไม่?',
      type: 'warning',
      onConfirm: () => {
        setGeneralInfo(initialGeneralInfo);
        setEditingRecordId(null);
        setIsAssessmentComplete(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const saveAssessment = () => {
    if (!validateInfo(true)) return;

    const newRecordId = crypto.randomUUID();
    const isUpdate = !!editingRecordId;
    const targetId = editingRecordId || newRecordId;

    const updatedRecord: AssessmentRecord = {
      id: targetId,
      fullName: generalInfo.fullName,
      age: generalInfo.age,
      hn: generalInfo.hn,
      dx: generalInfo.dx,
      assessorName: generalInfo.assessorName,
      date: generalInfo.assessmentDate,
      riskFactors: { ...generalInfo.riskFactors },
      riskLevel,
      timestamp: Date.now(),
    };

    const nextRecords = isUpdate 
      ? records.map(r => r.id === editingRecordId ? updatedRecord : r)
      : [updatedRecord, ...records];

    setRecords(nextRecords);

    setEditingRecordId(null);
    setGeneralInfo(initialGeneralInfo);
    setIsAssessmentComplete(false);
    setShowSaveSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editRecord = (record: AssessmentRecord) => {
    setGeneralInfo({
      fullName: record.fullName,
      age: record.age,
      hn: record.hn,
      dx: record.dx,
      assessorName: record.assessorName,
      assessmentDate: record.date,
      riskFactors: { ...record.riskFactors }
    });
    setEditingRecordId(record.id);
    setIsAssessmentComplete(true);
    setIsHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRecord = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'ลบบันทึก?',
      message: 'คุณต้องการลบบันทึกการประเมินนี้ใช่หรือไม่?',
      type: 'danger',
      onConfirm: () => {
        const nextRecords = records.filter(r => r.id !== id);
        setRecords(nextRecords);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const clearAllRecords = () => {
    setConfirmModal({
      isOpen: true,
      title: 'ล้างประวัติทั้งหมด?',
      message: 'คุณต้องการลบประวัติการบันทึกทั้งหมดใช่หรือไม่? ข้อมูลจะหายถาวร',
      type: 'danger',
      onConfirm: () => {
        setRecords([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddFollowUp = (patientId: string) => {
    if (!followUpForm.assessorName) {
      setValidationError('กรุณาระบุชื่อผู้ติดตามอาการ');
      return;
    }
    if (!followUpForm.assessorName.trim().includes(' ')) {
      setValidationError('กรุณาระบุชื่อ-นามสกุล ของผู้ติดตามอาการ');
      return;
    }

    const newFollowUp: FollowUpRecord = {
      id: crypto.randomUUID(),
      date: followUpForm.date,
      woundStatus: followUpForm.woundStatus,
      woundStatusCustom: followUpForm.woundStatus === 'Other' ? followUpForm.woundStatusCustom : undefined,
      hasPain: followUpForm.hasPain,
      hasSwelling: followUpForm.hasSwelling,
      hasRedness: followUpForm.hasRedness,
      hasHeat: followUpForm.hasHeat,
      hasPus: followUpForm.hasPus,
      hasFever: followUpForm.hasFever,
      isWoundDehiscence: followUpForm.isWoundDehiscence,
      outcome: followUpForm.outcome,
      assessorName: followUpForm.assessorName,
      notes: followUpForm.notes,
      timestamp: Date.now()
    };

    const updatedRecords = records.map(record => {
      if (record.id === patientId) {
        const existingFollowUps = record.followUps || [];
        return {
          ...record,
          followUps: [newFollowUp, ...existingFollowUps]
        };
      }
      return record;
    });

    setRecords(updatedRecords);
    setFollowUpForm(initialFollowUpForm);
    setShowAddFollowUp(false);
    setShowSaveSuccess(true);
  };

  const handleDeleteFollowUp = (patientId: string, followUpId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'ลบประวัติการติดตาม?',
      message: 'คุณต้องการลบรายการติดตามอาการนี้ใช่หรือไม่?',
      type: 'danger',
      onConfirm: () => {
        const updatedRecords = records.map(record => {
          if (record.id === patientId) {
            return {
              ...record,
              followUps: (record.followUps || []).filter(f => f.id !== followUpId)
            };
          }
          return record;
        });
        setRecords(updatedRecords);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredRecordsForFollowUp = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.fullName.toLowerCase().includes(followUpSearch.toLowerCase()) || 
                            record.hn.toLowerCase().includes(followUpSearch.toLowerCase()) ||
                            record.dx.toLowerCase().includes(followUpSearch.toLowerCase());
      const matchesFilter = followUpFilter === 'All' || record.riskLevel === followUpFilter;
      return matchesSearch && matchesFilter;
    });
  }, [records, followUpSearch, followUpFilter]);

  const selectedPatient = useMemo(() => {
    return records.find(r => r.id === selectedPatientId);
  }, [records, selectedPatientId]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-6">
        <div className="max-w-md mx-auto flex justify-center items-center">
          <h1 className="text-xl font-bold tracking-tight text-center">SSI Prevention Bundle Checklist</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6">
        {/* Segmented Tab Switcher */}
        <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-6 border border-gray-100">
          <button
            onClick={() => {
              setActiveTab('checklist');
              setSelectedPatientId(null);
            }}
            className={cn(
              "flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
              activeTab === 'checklist' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
            )}
          >
            <Activity size={14} />
            ประเมินความเสี่ยง (Checklist)
          </button>
          <button
            onClick={() => {
              setActiveTab('followup');
              setSelectedPatientId(null);
            }}
            className={cn(
              "flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
              activeTab === 'followup' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"
            )}
          >
            <UserCheck size={14} />
            <span>ติดตามอาการหลังผ่าตัด</span>
            {records.some(r => r.riskLevel !== 'Low') && (
              <span className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'checklist' ? (
          <>
            {/* General Information Section */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">ส่วนที่ 1: ข้อมูลทั่วไป</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold w-20 shrink-0">ชื่อ-นามสกุล:</span>
                  <input 
                    type="text" 
                    className={cn(
                      "flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-black transition-all",
                      validationError && !generalInfo.fullName && "ring-1 ring-red-400 bg-red-50"
                    )}
                    placeholder="ระบุชื่อ-นามสกุล"
                    value={generalInfo.fullName}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, fullName: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold w-20 shrink-0">อายุ:</span>
                  <input 
                    type="number" 
                    className={cn(
                      "flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-black transition-all",
                      validationError && !generalInfo.age && "ring-1 ring-red-400 bg-red-50"
                    )}
                    placeholder="ระบุอายุ"
                    value={generalInfo.age}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, age: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold w-20 shrink-0">HN:</span>
                  <input 
                    type="text" 
                    className={cn(
                      "flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-black transition-all",
                      validationError && generalInfo.hn.length !== 7 && "ring-1 ring-red-400 bg-red-50"
                    )}
                    placeholder="ระบุ HN (7 หลัก)"
                    value={generalInfo.hn}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, hn: e.target.value })}
                    maxLength={7}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold w-20 shrink-0">Dx:</span>
                  <input 
                    type="text" 
                    className={cn(
                      "flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-black transition-all",
                      validationError && !generalInfo.dx && "ring-1 ring-red-400 bg-red-50"
                    )}
                    placeholder="ระบุการวินิจฉัย"
                    value={generalInfo.dx}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, dx: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold w-20 shrink-0">วันที่ประเมิน:</span>
                  <input 
                    type="date" 
                    className="flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-black"
                    value={generalInfo.assessmentDate}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, assessmentDate: e.target.value })}
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">ปัจจัยเสี่ยง</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {RISK_FACTORS_CONFIG.map((factor) => (
                      <div key={factor.id} className="space-y-2">
                        <label 
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <div className="relative flex items-center justify-center mt-0.5">
                            <input 
                              type="checkbox"
                              className="peer sr-only"
                              checked={generalInfo.riskFactors[factor.id as keyof RiskFactors]}
                              onChange={(e) => setGeneralInfo({
                                ...generalInfo,
                                riskFactors: {
                                  ...generalInfo.riskFactors,
                                  [factor.id]: e.target.checked
                                }
                              })}
                            />
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-black peer-checked:border-black transition-all" />
                            <Check className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" size={14} strokeWidth={4} />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm text-gray-600 group-hover:text-black transition-colors">
                              {factor.label}
                            </span>
                            {factor.id === 'asaGte3' && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowAsaInfo(!showAsaInfo);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                <Info size={14} />
                              </button>
                            )}
                          </div>
                        </label>
                        
                        {factor.id === 'asaGte3' && showAsaInfo && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-8 p-3 bg-blue-50 rounded-xl text-[10px] text-blue-700 space-y-1 border border-blue-100"
                          >
                            <p className="font-bold mb-1">การแบ่งระดับ ASA:</p>
                            <p>• <span className="font-bold">ASA I:</span> ปกติ สุขภาพดี ไม่มีโรค</p>
                            <p>• <span className="font-bold">ASA II:</span> โรคเล็กน้อย คุมได้ (HT, Diabetes Mellitus คุมดี, DLP)</p>
                            <p>• <span className="font-bold">ASA III:</span> โรครุนแรง คุมไม่ดี (DM คุมไม่ได้, CKD, CHF, COPD)</p>
                            <p>• <span className="font-bold">ASA IV:</span> รุนแรงมาก คุกคามชีวิต (sepsis, respiratory failure, DKA)</p>
                            <p>• <span className="font-bold">ASA V:</span> ใกล้เสียชีวิต (massive trauma)</p>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment Result */}
            {!isAssessmentComplete ? (
              <div className="mb-6 space-y-3">
                <button
                  onClick={() => {
                    if (validateInfo()) {
                      setIsAssessmentComplete(true);
                      setShowRiskAlert(true);
                    }
                  }}
                  className="w-full bg-white text-black py-4 rounded-3xl font-bold border-2 border-black hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  ประเมินความเสี่ยง
                </button>
                <button
                  onClick={resetForm}
                  className="w-full py-2 text-gray-400 text-xs font-bold hover:text-red-500 transition-colors"
                >
                  ล้างข้อมูลทั้งหมด
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-3xl p-6 mb-6 shadow-sm border transition-all duration-500",
                  riskLevel === 'High' ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-2 ring-red-50" : "border-gray-100"
                )}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">ผลการประเมินความเสี่ยง</h2>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2", 
                    RISK_LEVELS[riskLevel].color,
                    riskLevel === 'High' && "animate-pulse"
                  )}>
                    <div className={cn("w-2 h-2 rounded-full", RISK_LEVELS[riskLevel].dot)} />
                    {RISK_LEVELS[riskLevel].label} ({riskScore} ข้อ)
                  </div>
                </div>
                
                <div className={cn(
                  "rounded-2xl p-4 mb-6 transition-colors",
                  riskLevel === 'High' ? "bg-red-50/50" : "bg-gray-50"
                )}>
                  <h3 className={cn(
                    "text-xs font-bold uppercase mb-3",
                    riskLevel === 'High' ? "text-red-500" : "text-gray-400"
                  )}>การพยาบาลที่ต้องทำ:</h3>
                  <ul className="space-y-2">
                    {RISK_LEVELS[riskLevel].instructions.map((instruction, index) => (
                      <li key={index} className="text-sm flex gap-3">
                        <span className={cn("font-bold", riskLevel === 'High' ? "text-red-300" : "text-gray-300")}>•</span>
                        <span className={cn("leading-relaxed", riskLevel === 'High' ? "text-red-900 font-medium" : "text-gray-700")}>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {generalInfo.riskFactors.oralSurgery && (
                  <div className={cn(
                    "rounded-2xl p-4 mb-6 border-2",
                    riskLevel === 'High' ? "bg-red-50 border-red-200" : 
                    riskLevel === 'Moderate' ? "bg-yellow-50 border-yellow-100" : 
                    "bg-green-50 border-green-100"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        riskLevel === 'High' ? "bg-red-500" : 
                        riskLevel === 'Moderate' ? "bg-yellow-500" : 
                        "bg-green-500"
                      )} />
                      <h3 className={cn(
                        "text-xs font-bold uppercase",
                        riskLevel === 'High' ? "text-red-700" : 
                        riskLevel === 'Moderate' ? "text-yellow-700" : 
                        "text-green-700"
                      )}>การพยาบาลเฉพาะ (Oral Surgery):</h3>
                    </div>
                    <ul className="space-y-2">
                      {ORAL_SURGERY_INSTRUCTIONS[riskLevel].items.map((item, index) => (
                        <li key={index} className="text-sm flex gap-3">
                          <span className={cn(
                            "font-bold",
                            riskLevel === 'High' ? "text-red-400" : 
                            riskLevel === 'Moderate' ? "text-yellow-400" : 
                            "text-green-400"
                          )}>•</span>
                          <span className={cn(
                            "leading-relaxed",
                            riskLevel === 'High' ? "text-red-900 font-medium" : 
                            riskLevel === 'Moderate' ? "text-yellow-900 font-medium" : 
                            "text-green-900 font-medium"
                          )}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generalInfo.riskFactors.tracheostomy && (
                  <div className={cn(
                    "rounded-2xl p-4 mb-6 border-2",
                    riskLevel === 'High' ? "bg-red-50 border-red-200" : 
                    riskLevel === 'Moderate' ? "bg-yellow-50 border-yellow-100" : 
                    "bg-green-50 border-green-100"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        riskLevel === 'High' ? "bg-red-500" : 
                        riskLevel === 'Moderate' ? "bg-yellow-500" : 
                        "bg-green-500"
                      )} />
                      <h3 className={cn(
                        "text-xs font-bold uppercase",
                        riskLevel === 'High' ? "text-red-700" : 
                        riskLevel === 'Moderate' ? "text-yellow-700" : 
                        "text-green-700"
                      )}>การพยาบาลเฉพาะ (Tracheostomy):</h3>
                    </div>
                    <ul className="space-y-2 mb-3">
                      {TRACHEOSTOMY_INSTRUCTIONS[riskLevel].items.map((item, index) => (
                        <li key={index} className="text-sm flex gap-3">
                          <span className={cn(
                            "font-bold",
                            riskLevel === 'High' ? "text-red-400" : 
                            riskLevel === 'Moderate' ? "text-yellow-400" : 
                            "text-green-400"
                          )}>•</span>
                          <span className={cn(
                            "leading-relaxed",
                            riskLevel === 'High' ? "text-red-900 font-medium" : 
                            riskLevel === 'Moderate' ? "text-yellow-900 font-medium" : 
                            "text-green-900 font-medium"
                          )}>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-lg inline-block",
                      riskLevel === 'High' ? "bg-red-100 text-red-700" : 
                      riskLevel === 'Moderate' ? "bg-yellow-100 text-yellow-700" : 
                      "bg-green-100 text-green-700"
                    )}>
                      👉 {TRACHEOSTOMY_INSTRUCTIONS[riskLevel].note}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold w-20 shrink-0">ผู้ประเมิน:</span>
                    <input 
                      type="text" 
                      className={cn(
                        "flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-black transition-all",
                        validationError && (!generalInfo.assessorName || !generalInfo.assessorName.trim().includes(' ')) && "ring-1 ring-red-400 bg-red-50"
                      )}
                      placeholder="ระบุชื่อ-นามสกุล ผู้ประเมิน"
                      value={generalInfo.assessorName}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, assessorName: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {isAssessmentComplete && (
              <div className="mt-8 mb-10 space-y-3">
                <button
                  onClick={saveAssessment}
                  className="w-full bg-black text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Save size={20} />
                  {editingRecordId ? 'อัปเดตข้อมูลการประเมิน' : 'บันทึกข้อมูลการประเมิน'}
                </button>
                {editingRecordId ? (
                  <button
                    onClick={() => {
                      setEditingRecordId(null);
                      setGeneralInfo(initialGeneralInfo);
                      setIsAssessmentComplete(false);
                    }}
                    className="w-full bg-white text-gray-500 py-3 rounded-3xl font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    ยกเลิกการแก้ไข / เริ่มประเมินใหม่
                  </button>
                ) : (
                  <button
                    onClick={resetForm}
                    className="w-full bg-white text-red-400 py-3 rounded-3xl font-bold text-sm border border-red-50 hover:bg-red-50 transition-all"
                  >
                    ลบทิ้ง / เริ่มประเมินใหม่
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {!selectedPatientId ? (
              <div className="space-y-4">
                {/* Search & Filter */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อคนไข้ หรือ HN..."
                      value={followUpSearch}
                      onChange={(e) => setFollowUpSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(['All', 'High', 'Moderate', 'Low'] as const).map((level) => {
                      const count = records.filter(r => level === 'All' || r.riskLevel === level).length;
                      return (
                        <button
                          key={level}
                          onClick={() => setFollowUpFilter(level)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                            followUpFilter === level 
                              ? level === 'High' ? "bg-red-50 border-red-200 text-red-600 animate-pulse" 
                                : level === 'Moderate' ? "bg-yellow-50 border-yellow-200 text-yellow-600"
                                : level === 'Low' ? "bg-green-50 border-green-200 text-green-600"
                                : "bg-black border-black text-white"
                              : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          <span>{level === 'All' ? 'ทั้งหมด' : level === 'High' ? 'เสี่ยงสูง (High)' : level === 'Moderate' ? 'เสี่ยงปานกลาง (Moderate)' : 'เสี่ยงต่ำ (Low)'}</span>
                          <span className="text-[10px] opacity-75">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patient Cards */}
                <div className="space-y-3">
                  {filteredRecordsForFollowUp.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-gray-100">
                      <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-xs font-semibold">ไม่พบข้อมูลคนไข้ที่ต้องติดตาม</p>
                    </div>
                  ) : (
                    filteredRecordsForFollowUp.map((patient) => {
                      const latestFollowUp = patient.followUps?.[0];
                      const followUpCount = patient.followUps?.length || 0;
                      
                      return (
                        <div
                          key={patient.id}
                          onClick={() => setSelectedPatientId(patient.id)}
                          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-black transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden"
                        >
                          <div className={cn("absolute top-0 left-0 w-1 h-full", RISK_LEVELS[patient.riskLevel].dot)} />
                          
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4 className="font-bold text-base truncate">
                                {patient.fullName}
                              </h4>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0",
                                RISK_LEVELS[patient.riskLevel].color
                              )}>
                                {patient.riskLevel}
                              </span>
                            </div>
                            <div className="space-y-0.5 text-xs text-gray-500 font-semibold">
                              <p>HN: {patient.hn} | อายุ {patient.age} ปี</p>
                              <p className="truncate">Dx: {patient.dx || '-'}</p>
                              {latestFollowUp ? (
                                <p className={cn(
                                  "flex items-center gap-1 text-[11px] mt-2 px-2 py-1 rounded-lg w-fit font-bold",
                                  latestFollowUp.outcome === 'ReferToMD' ? "bg-red-50 text-red-600" :
                                  latestFollowUp.outcome === 'Discharged' ? "bg-green-50 text-green-600" :
                                  "bg-blue-50 text-blue-600"
                                )}>
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    latestFollowUp.outcome === 'ReferToMD' ? "bg-red-500 animate-pulse" :
                                    latestFollowUp.outcome === 'Discharged' ? "bg-green-500" : "bg-blue-500"
                                  )} />
                                  ล่าสุด: {latestFollowUp.woundStatus === 'Normal' ? 'แผลปกติ' 
                                    : latestFollowUp.woundStatus === 'Erythema' ? 'แผลแดง/บวม'
                                    : latestFollowUp.woundStatus === 'Discharge' ? 'มีสารคัดหลั่ง'
                                    : latestFollowUp.woundStatus === 'InfectionSuspected' ? 'สงสัยติดเชื้อ'
                                    : 'อื่นๆ'} ({latestFollowUp.outcome === 'Continue' ? 'ติดตามต่อ' : latestFollowUp.outcome === 'Discharged' ? 'จำหน่าย' : 'ส่งต่อแพทย์'})
                                </p>
                              ) : (
                                <p className="text-amber-600 flex items-center gap-1 text-[11px] mt-2 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  ยังไม่ได้ติดตามหลังผ่าตัด
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all">
                            {followUpCount > 0 && (
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {followUpCount} ครั้ง
                              </span>
                            )}
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              selectedPatient && (
                <div className="space-y-6">
                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setSelectedPatientId(null);
                      setShowAddFollowUp(false);
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors bg-white px-4 py-2.5 rounded-2xl border border-gray-100 w-fit"
                  >
                    <ArrowLeft size={16} />
                    กลับไปหน้าผู้ป่วยทั้งหมด
                  </button>

                  {/* Patient Header Summary Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className={cn("absolute top-0 left-0 w-1 h-full", RISK_LEVELS[selectedPatient.riskLevel].dot)} />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">ข้อมูลผู้ป่วยหลังผ่าตัด</p>
                        <h3 className="text-lg font-bold">{selectedPatient.fullName}</h3>
                        <p className="text-xs text-gray-500">HN: {selectedPatient.hn} | อายุ {selectedPatient.age} ปี</p>
                      </div>
                      <div className={cn("px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5", RISK_LEVELS[selectedPatient.riskLevel].color)}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", RISK_LEVELS[selectedPatient.riskLevel].dot)} />
                        {selectedPatient.riskLevel}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-gray-400 mb-0.5 font-bold">Dx การวินิจฉัย:</p>
                        <p className="font-semibold text-gray-800">{selectedPatient.dx || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5 font-bold">วันที่ประเมินความเสี่ยง:</p>
                        <p className="font-semibold text-gray-800">{selectedPatient.date}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 mb-1 font-bold">ปัจจัยเสี่ยงเดิม:</p>
                        <div className="flex gap-1 flex-wrap">
                          {RISK_FACTORS_CONFIG.filter(f => selectedPatient.riskFactors[f.id as keyof RiskFactors]).map(f => (
                            <span key={f.id} className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                              {f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Follow-up Toggle Form */}
                  {!showAddFollowUp ? (
                    <button
                      onClick={() => setShowAddFollowUp(true)}
                      className="w-full bg-black text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Plus size={20} />
                      บันทึกการติดตามอาการใหม่
                    </button>
                  ) : (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-black space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-black flex items-center gap-2">
                          <Activity className="text-red-500 animate-pulse" size={18} />
                          ฟอร์มติดตามอาการหลังผ่าตัด
                        </h4>
                        <button
                          onClick={() => setShowAddFollowUp(false)}
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Date and Assessor */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold w-24 shrink-0">วันที่ติดตาม:</span>
                          <input
                            type="date"
                            value={followUpForm.date}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                            className="flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-black"
                          />
                        </div>

                        {/* Wound Status Selector */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold">ลักษณะบาดแผลผ่าตัด:</span>
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { key: 'Normal', label: 'แผลปกติ (Normal)' },
                              { key: 'Erythema', label: 'ขอบแผลแดง/บวม' },
                              { key: 'Discharge', label: 'มีสารคัดหลั่ง/หนอง' },
                              { key: 'InfectionSuspected', label: 'สงสัยติดเชื้อ (SSI)' },
                              { key: 'Other', label: 'อื่นๆ' }
                            ] as const).map((ws) => (
                              <button
                                key={ws.key}
                                type="button"
                                onClick={() => setFollowUpForm({ ...followUpForm, woundStatus: ws.key })}
                                className={cn(
                                  "px-3 py-2 text-left rounded-xl text-[11px] font-bold border transition-all",
                                  followUpForm.woundStatus === ws.key
                                    ? "bg-black border-black text-white"
                                    : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                                )}
                              >
                                {ws.label}
                              </button>
                            ))}
                          </div>
                          {followUpForm.woundStatus === 'Other' && (
                            <input
                              type="text"
                              placeholder="โปรดระบุลักษณะแผล..."
                              value={followUpForm.woundStatusCustom}
                              onChange={(e) => setFollowUpForm({ ...followUpForm, woundStatusCustom: e.target.value })}
                              className="mt-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-black animate-slideIn"
                            />
                          )}
                        </div>

                        {/* SSI Checkboxes */}
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">ประเมินอาการและอาการแสดงของการติดเชื้อ (SSI):</span>
                          <div className="space-y-2.5">
                            {[
                              { key: 'hasPain', label: 'ปวดบาดแผลผ่าตัดมากผิดปกติ' },
                              { key: 'hasSwelling', label: 'แผลบวม ผิวหนังตึง' },
                              { key: 'hasRedness', label: 'แผลแดงเป็นบริเวณกว้าง' },
                              { key: 'hasHeat', label: 'ผิวหนังรอบแผลร้อนจัด' },
                              { key: 'hasPus', label: 'มีหนอง (Pus) ไหลซึมออกจากแผล' },
                              { key: 'hasFever', label: 'มีไข้หลังผ่าตัด (> 38 องศาเซลเซียส)' },
                              { key: 'isWoundDehiscence', label: 'แผลแยก หรือไหมเย็บขาด (Dehiscence)' }
                            ].map((item) => (
                              <label key={item.key} className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={followUpForm[item.key as keyof typeof followUpForm] as boolean}
                                  onChange={(e) => setFollowUpForm({ ...followUpForm, [item.key]: e.target.checked })}
                                  className="rounded border-gray-300 text-black focus:ring-black w-4 h-4"
                                />
                                <span className="text-xs text-gray-700 font-semibold">{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Outcome Choice */}
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-xs font-bold block mb-2">ผลการติดตามอาการ:</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { key: 'Continue', label: 'ติดตามอาการต่อ', color: 'border-blue-100 text-blue-700 bg-blue-50' },
                              { key: 'Discharged', label: 'จำหน่าย/แผลหาย', color: 'border-green-100 text-green-700 bg-green-50' },
                              { key: 'ReferToMD', label: 'ส่งต่อแพทย์ ⚠️', color: 'border-red-100 text-red-700 bg-red-50' }
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => setFollowUpForm({ ...followUpForm, outcome: opt.key as any })}
                                className={cn(
                                  "px-2 py-2 rounded-xl text-[10px] font-bold border transition-all text-center",
                                  followUpForm.outcome === opt.key
                                    ? "bg-black border-black text-white"
                                    : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold">บันทึกเพิ่มเติม/การพยาบาลที่ให้:</span>
                          <textarea
                            rows={2}
                            value={followUpForm.notes}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                            placeholder="เช่น แนะนำเรื่องสุขวิทยาส่วนบุคคล, สังเกตไข้, สมานแผลเรียบร้อย..."
                            className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-black transition-all"
                          />
                        </div>

                        {/* Follow-up assessor name */}
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                          <span className="text-xs font-bold w-24 shrink-0">ผู้ติดตามอาการ:</span>
                          <input
                            type="text"
                            value={followUpForm.assessorName}
                            onChange={(e) => setFollowUpForm({ ...followUpForm, assessorName: e.target.value })}
                            placeholder="ชื่อ-นามสกุล ของพยาบาล"
                            className="flex-1 bg-gray-50 border-none rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setShowAddFollowUp(false)}
                          className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => handleAddFollowUp(selectedPatient.id)}
                          className="flex-1 py-3 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-2xl transition-all shadow-md"
                        >
                          บันทึกข้อมูลการติดตาม
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Follow-up History Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">ประวัติการติดตามอาการ ({selectedPatient.followUps?.length || 0})</h4>
                    
                    {(!selectedPatient.followUps || selectedPatient.followUps.length === 0) ? (
                      <div className="bg-white rounded-3xl p-8 text-center border border-gray-100">
                        <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-xs font-semibold">ยังไม่มีประวัติการติดตามสำหรับผู้ป่วยรายนี้</p>
                      </div>
                    ) : (
                      <div className="relative border-l border-gray-200 ml-4 space-y-6 pt-2">
                        {selectedPatient.followUps.map((fu) => {
                          const hasAnySymptom = fu.hasPain || fu.hasSwelling || fu.hasRedness || fu.hasHeat || fu.hasPus || fu.hasFever || fu.isWoundDehiscence;
                          
                          return (
                            <div key={fu.id} className="relative pl-6">
                              {/* Dot on timeline */}
                              <div className={cn(
                                "absolute -left-1.5 top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                                fu.outcome === 'ReferToMD' ? "bg-red-500 animate-pulse" : 
                                fu.outcome === 'Discharged' ? "bg-green-500" : "bg-blue-500"
                              )} />

                              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative group">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-xs font-black text-gray-800">{format(new Date(fu.date), 'dd MMM yyyy')}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold">ผู้บันทึก: {fu.assessorName}</p>
                                  </div>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-bold",
                                    fu.outcome === 'Continue' ? 'bg-blue-50 text-blue-600 font-bold' : 
                                    fu.outcome === 'Discharged' ? 'bg-green-50 text-green-600 font-bold' : 
                                    'bg-red-50 text-red-600 font-bold'
                                  )}>
                                    {fu.outcome === 'Continue' ? 'ติดตามอาการต่อ' : 
                                     fu.outcome === 'Discharged' ? 'จำหน่าย/แผลหายดี' : 'ส่งต่อแพทย์ ⚠️'}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-700">
                                  <p className="font-semibold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    ลักษณะแผล: {fu.woundStatus === 'Normal' ? <span className="text-green-600 font-bold">ปกติ (Normal)</span>
                                      : fu.woundStatus === 'Erythema' ? <span className="text-amber-600 font-bold">ขอบแผลแดง/บวม</span>
                                      : fu.woundStatus === 'Discharge' ? <span className="text-red-500 font-bold">มีสารคัดหลั่ง/หนอง</span>
                                      : fu.woundStatus === 'InfectionSuspected' ? <span className="text-red-600 font-bold">สงสัยติดเชื้อ (SSI) ⚠️</span>
                                      : <span className="text-gray-700 font-bold">อื่นๆ ({fu.woundStatusCustom})</span>}
                                  </p>

                                  {hasAnySymptom && (
                                    <div className="bg-red-50/50 p-2 rounded-lg border border-red-100/50 space-y-1">
                                      <p className="text-[10px] font-bold text-red-600">อาการติดเชื้อที่ตรวจพบ:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {fu.hasPain && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">ปวดแผลมาก</span>}
                                        {fu.hasSwelling && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">แผลบวม</span>}
                                        {fu.hasRedness && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">แผลแดง</span>}
                                        {fu.hasHeat && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">แผลร้อน</span>}
                                        {fu.hasPus && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">มีหนอง</span>}
                                        {fu.hasFever && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">มีไข้</span>}
                                        {fu.isWoundDehiscence && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">แผลแยก</span>}
                                      </div>
                                    </div>
                                  )}

                                  {fu.notes && (
                                    <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg text-[11px]">
                                      "{fu.notes}"
                                    </p>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteFollowUp(selectedPatient.id, fu.id)}
                                  className="absolute bottom-2.5 right-2.5 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-50"
                                  title="ลบรายการ"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Floating History Button */}
      <button
        onClick={() => setIsHistoryOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border border-gray-100"
      >
        <History size={24} />
        {records.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {records.length}
          </span>
        )}
      </button>

      {/* Risk Alert (Corner Notification) */}
      <AnimatePresence>
        {showRiskAlert && (
          <>
            {riskLevel === 'High' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-red-600/10 backdrop-blur-[2px] pointer-events-none"
              />
            )}
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={cn(
                "fixed top-6 right-6 z-[80] p-5 rounded-[32px] shadow-2xl border-2 flex items-center gap-5 min-w-[280px] bg-white backdrop-blur-md transition-all",
                riskLevel === 'High' ? 'border-red-500 ring-4 ring-red-50' : 
                riskLevel === 'Moderate' ? 'border-yellow-100' : 
                'border-green-100'
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", 
                RISK_LEVELS[riskLevel].color,
                riskLevel === 'High' && "animate-bounce"
              )}>
                {riskLevel === 'High' ? (
                  <div className="relative">
                    <Check size={32} strokeWidth={4} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  </div>
                ) : (
                  <Check size={28} strokeWidth={3} />
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] mb-1",
                  riskLevel === 'High' ? "text-red-400" : "text-gray-400"
                )}>ระดับความเสี่ยง</p>
                <p className={cn(
                  "font-black text-xl leading-none tracking-tight", 
                  RISK_LEVELS[riskLevel].color.split(' ')[0],
                  riskLevel === 'High' && "text-red-600"
                )}>
                  {RISK_LEVELS[riskLevel].label}
                </p>
                <p className={cn(
                  "text-xs mt-1.5 font-bold",
                  riskLevel === 'High' ? "text-red-500" : "text-gray-500"
                )}>พบ {riskScore} ปัจจัยเสี่ยง</p>
              </div>
              <button 
                onClick={() => setShowRiskAlert(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </motion.div>
          </>
        )}

        {validationError && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 right-6 z-[60] p-4 rounded-3xl shadow-2xl border-2 border-red-100 flex items-center gap-4 min-w-[240px] bg-white backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 shadow-inner">
              <Trash2 size={24} strokeWidth={3} className="rotate-180" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-0.5">ข้อมูลไม่ครบถ้วน</p>
              <p className="font-black text-base leading-none text-red-500">
                {validationError}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">กรุณากรอกข้อมูลให้ครบก่อนดำเนินการ</p>
            </div>
          </motion.div>
        )}

        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 right-6 z-[60] p-4 rounded-3xl shadow-2xl border-2 border-green-100 flex items-center gap-4 min-w-[240px] bg-white backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center shrink-0 shadow-inner">
              <Save size={24} strokeWidth={3} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-0.5">บันทึกสำเร็จ</p>
              <p className="font-black text-base leading-none text-green-500">
                เก็บข้อมูลเรียบร้อย
              </p>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">ข้อมูลถูกบันทึกลงในประวัติแล้ว</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-[#F5F5F5] h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <History size={20} className="text-gray-400" />
                  <h3 className="font-bold text-lg">ประวัติการบันทึก</h3>
                </div>
                <div className="flex items-center gap-2">
                  {records.length > 0 && (
                    <button 
                      onClick={clearAllRecords}
                      className="text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                  <button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Check size={24} className="rotate-45" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {records.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 mt-10">
                    <History size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">ยังไม่มีข้อมูลที่บันทึกไว้</p>
                  </div>
                ) : (
                  records.map((record) => (
                    <div key={record.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative group overflow-hidden">
                      <div className={cn("absolute top-0 left-0 w-1 h-full", RISK_LEVELS[record.riskLevel].dot)} />
                      
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-base">
                            {record.fullName || 'ไม่ระบุชื่อ'} {record.age && `(${record.age} ปี)`}
                          </h4>
                          <p className="text-xs text-gray-600">HN: {record.hn}</p>
                          <p className="text-[10px] text-gray-500 font-medium">ผู้ประเมิน: {record.assessorName || '-'}</p>
                          <p className="text-[10px] text-gray-400">{format(record.timestamp, 'dd MMM yyyy HH:mm')}</p>
                        </div>
                        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", RISK_LEVELS[record.riskLevel].color)}>
                          {record.riskLevel}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-xs"><span className="font-semibold">Dx:</span> {record.dx || '-'}</p>
                        
                        {record.riskFactors && Object.entries(record.riskFactors).some(([_, v]) => v) && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {RISK_FACTORS_CONFIG.filter(f => record.riskFactors?.[f.id as keyof RiskFactors]).map(f => (
                              <span key={f.id} className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                                {f.label}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">การพยาบาล:</p>
                          <ul className="space-y-1">
                            {RISK_LEVELS[record.riskLevel].instructions.slice(0, 2).map((inst, i) => (
                              <li key={i} className="text-[10px] text-gray-600 flex gap-1">
                                <span>•</span> {inst}
                              </li>
                            ))}
                            {RISK_LEVELS[record.riskLevel].instructions.length > 2 && (
                              <li className="text-[10px] text-gray-400 italic">...และอื่นๆ</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1 transition-all">
                        <button 
                          onClick={() => editRecord(record)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="แก้ไข"
                        >
                          <Save size={14} className="rotate-180" />
                        </button>
                        <button 
                          onClick={() => deleteRecord(record.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center overflow-hidden"
            >
              <div className={cn(
                "w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center",
                confirmModal.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-500'
              )}>
                <Trash2 size={32} />
              </div>

              <h3 className="text-xl font-black mb-2">{confirmModal.title}</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                {confirmModal.message}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="py-4 rounded-2xl font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95",
                    confirmModal.type === 'danger' ? 'bg-red-500 shadow-red-100' : 'bg-black shadow-gray-200'
                  )}
                >
                  ยืนยัน
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
