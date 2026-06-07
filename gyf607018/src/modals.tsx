import React, { useState, useEffect } from 'react';
import { useApp } from './store';
import { FollowUpRecord, ParentVisibleInfo, InternalInfo } from './types';

interface Props {
  record: FollowUpRecord | null;
  isManual?: boolean;
  onClose: () => void;
}

const emptyParent: ParentVisibleInfo = {
  infantName: '',
  gender: 'male',
  birthDate: '',
  guardianName: '',
  guardianPhone: '',
  vaccineName: '',
  vaccineBatch: '',
  vaccinationDate: '',
  vaccinationSite: '西门社区卫生服务中心',
  nextFollowUpDate: '',
  publicRemarks: '',
};

const emptyInternal: InternalInfo = {
  medicalRecordNo: '',
  nurseId: 'nurse-01',
  nurseName: '王护士',
  internalNotes: '',
  abnormalSymptoms: [],
  contraindications: [],
};

export function RecordFormModal({ record, isManual = false, onClose }: Props) {
  const { createRecord, updateRecord, getCurrentUser } = useApp();
  const isEdit = !!record;
  const user = getCurrentUser();

  const [parent, setParent] = useState<ParentVisibleInfo>(emptyParent);
  const [internal, setInternal] = useState<InternalInfo>({ ...emptyInternal, nurseId: user.id, nurseName: user.name });
  const [manualNote, setManualNote] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [contra, setContra] = useState('');

  useEffect(() => {
    if (record) {
      setParent(record.parentVisible);
      setInternal(record.internal);
      setSymptoms(record.internal.abnormalSymptoms.join('；'));
      setContra(record.internal.contraindications.join('；'));
    }
  }, [record]);

  function updateParent<K extends keyof ParentVisibleInfo>(key: K, val: ParentVisibleInfo[K]) {
    setParent(p => ({ ...p, [key]: val }));
  }
  function updateInternal<K extends keyof InternalInfo>(key: K, val: InternalInfo[K]) {
    setInternal(i => ({ ...i, [key]: val }));
  }

  function handleSubmit() {
    if (!parent.infantName || !parent.vaccineName || !parent.vaccineBatch || !parent.vaccinationDate) {
      alert('请填写必填项：婴幼儿姓名、疫苗名称、疫苗批号、接种日期');
      return;
    }
    const finalInternal: InternalInfo = {
      ...internal,
      abnormalSymptoms: symptoms ? symptoms.split(/[;；]/).map(s => s.trim()).filter(Boolean) : [],
      contraindications: contra ? contra.split(/[;；]/).map(s => s.trim()).filter(Boolean) : [],
      internalNotes: isManual && !isEdit && manualNote
        ? `【手工补录】${manualNote}\n${internal.internalNotes}`.trim()
        : internal.internalNotes,
    };
    if (isEdit && record) {
      updateRecord(record.id, { ...parent, internal: finalInternal });
    } else {
      createRecord({ parentVisible: parent, internal: finalInternal, isManualEntry: isManual });
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isEdit ? '修改随访记录' : isManual ? '手工补录随访记录' : '新增随访记录'}
            {isManual && <span className="badge-manual">补录</span>}
          </h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {isManual && !isEdit && (
            <div className="form-notice manual">
              正在进行手工补录，请在下方填写补录原因。补录记录将带有"补录"标记，并在审计日志中单独记录。
            </div>
          )}
          <div className="form-grid">
            <div className="form-section-title">家长可见信息</div>

            <label className="required">婴幼儿姓名</label>
            <input value={parent.infantName} onChange={e => updateParent('infantName', e.target.value)} />

            <label className="required">性别</label>
            <select value={parent.gender} onChange={e => updateParent('gender', e.target.value as 'male' | 'female')}>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>

            <label className="required">出生日期</label>
            <input type="date" value={parent.birthDate} onChange={e => updateParent('birthDate', e.target.value)} />

            <label>监护人姓名</label>
            <input value={parent.guardianName} onChange={e => updateParent('guardianName', e.target.value)} />

            <label>联系电话</label>
            <input value={parent.guardianPhone} onChange={e => updateParent('guardianPhone', e.target.value)} />

            <label className="required">疫苗名称</label>
            <input value={parent.vaccineName} onChange={e => updateParent('vaccineName', e.target.value)} placeholder="如：乙肝疫苗第二剂" />

            <label className="required">疫苗批号</label>
            <input value={parent.vaccineBatch} onChange={e => updateParent('vaccineBatch', e.target.value)} placeholder="如：HB20240301A" />

            <label className="required">接种日期</label>
            <input type="date" value={parent.vaccinationDate} onChange={e => updateParent('vaccinationDate', e.target.value)} />

            <label>接种部位/单位</label>
            <input value={parent.vaccinationSite} onChange={e => updateParent('vaccinationSite', e.target.value)} />

            <label>下次随访日期</label>
            <input type="date" value={parent.nextFollowUpDate} onChange={e => updateParent('nextFollowUpDate', e.target.value)} />

            <label>公开备注（家长可见）</label>
            <textarea value={parent.publicRemarks} onChange={e => updateParent('publicRemarks', e.target.value)} />

            <div className="form-section-title internal">内部信息（家长不可见）</div>

            <label>档案编号</label>
            <input value={internal.medicalRecordNo} onChange={e => updateInternal('medicalRecordNo', e.target.value)} />

            <label>异常症状（；分隔）</label>
            <input value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="如：接种部位红肿；发热" />

            <label>禁忌症（；分隔）</label>
            <input value={contra} onChange={e => setContra(e.target.value)} placeholder="如：鸡蛋过敏史" />

            <label>内部备注</label>
            <textarea value={internal.internalNotes} onChange={e => updateInternal('internalNotes', e.target.value)} />

            {isManual && !isEdit && (
              <>
                <label className="required">补录原因</label>
                <textarea value={manualNote} onChange={e => setManualNote(e.target.value)} placeholder="请填写补录原因，如：系统升级造成数据丢失，已与家长电话核实" />
              </>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={handleSubmit}>{isEdit ? '保存修改' : isManual ? '提交补录' : '提交'}</button>
        </div>
      </div>
    </div>
  );
}

interface ReviewProps {
  record: FollowUpRecord;
  onClose: () => void;
}

export function ReviewModal({ record, onClose }: ReviewProps) {
  const { reviewRecord } = useApp();
  const [result, setResult] = useState<'pass' | 'fail'>('pass');
  const [comments, setComments] = useState('');

  function handleSubmit() {
    reviewRecord(record.id, result, comments);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>复核记录 - {record.parentVisible.infantName}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label>复核结果</label>
            <select value={result} onChange={e => setResult(e.target.value as 'pass' | 'fail')}>
              <option value="pass">通过</option>
              <option value="fail">驳回</option>
            </select>
            <label>复核意见</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="请填写复核意见" />
          </div>
          <div className="diff-box" style={{ marginTop: 12 }}>
            <div className="diff-title">待复核记录摘要</div>
            <div>婴幼儿：{record.parentVisible.infantName}（{record.parentVisible.gender === 'male' ? '男' : '女'}，{record.parentVisible.birthDate}）</div>
            <div>疫苗：{record.parentVisible.vaccineName}（批号 {record.parentVisible.vaccineBatch}）</div>
            <div>接种日期：{record.parentVisible.vaccinationDate}</div>
            {record.isManualEntry && <div style={{ color: '#d97706' }}>⚠ 此条为手工补录记录，请重点核对纸质档案</div>}
            {record.anomalies.length > 0 && <div style={{ color: '#c0392b' }}>⚠ 存在异常标记：{record.anomalies.map(a => a.description).join('，')}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>取消</button>
          <button className={result === 'pass' ? 'success' : 'danger'} onClick={handleSubmit}>
            {result === 'pass' ? '确认通过' : '确认驳回'}
          </button>
        </div>
      </div>
    </div>
  );
}
