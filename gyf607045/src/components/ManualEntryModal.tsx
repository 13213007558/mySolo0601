import { useState } from 'react';
import { User } from '../types';
import { createManualFlowEntry, createVerificationRecord } from '../store';

interface Props {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualEntryModal({ user, onClose, onSuccess }: Props) {
  const [babyName, setBabyName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [packageType, setPackageType] = useState('日常护理');
  const [flowDate, setFlowDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(2000);
  const [totalSessions, setTotalSessions] = useState(5);
  const [verifyDate, setVerifyDate] = useState(new Date().toISOString().slice(0, 10));
  const [actualSessions, setActualSessions] = useState(1);
  const [reason, setReason] = useState('');
  const [photoDescriptions, setPhotoDescriptions] = useState<string[]>([
    '手工补录护理现场照 1',
  ]);

  const handleSubmit = () => {
    if (!babyName.trim() || !packageName.trim() || !reason.trim()) {
      alert('请填写宝宝姓名、课包名称、处理理由');
      return;
    }
    const flow = createManualFlowEntry(
      {
        babyName,
        packageName,
        packageType,
        flowDate,
        amount,
        totalSessions,
      },
      user,
    );
    createVerificationRecord(
      {
        packageFlowId: flow.id,
        babyName,
        packageName,
        verifyDate,
        actualSessions,
        reason,
        photoDescriptions,
      },
      user,
    );
    alert('手工补录成功！可在列表中对比「系统导入」和「手工补录」来源差异。');
    onSuccess();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>手工补录（新增课包流水 + 核销记录</h3>
        <div className="alert alert-info">
          <span>💡</span>
          <div>
            手工补录会同时创建课包流水和核销记录，方便在列表中与「系统导入」数据对比差异。
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>宝宝姓名 *</label>
            <input
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              placeholder="例如：李安安"
            />
          </div>
          <div className="form-group">
            <label>课包名称 *</label>
            <input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="例如：夜间特级照护补录"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>课包类型</label>
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
            >
              <option>日常护理</option>
              <option>特色护理</option>
              <option>特级护理</option>
              <option>康复配套</option>
              <option>专项护理</option>
              <option>补录护理</option>
            </select>
          </div>
          <div className="form-group">
            <label>流水日期</label>
            <input
              type="date"
              value={flowDate}
              onChange={(e) => setFlowDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>金额（元）</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>总次数</label>
            <input
              type="number"
              value={totalSessions}
              onChange={(e) => setTotalSessions(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>核销日期</label>
            <input
              type="date"
              value={verifyDate}
              onChange={(e) => setVerifyDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>实际执行次数</label>
            <input
              type="number"
              value={actualSessions}
              onChange={(e) => setActualSessions(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label>处理理由 *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入核销处理理由"
          />
        </div>

        <div className="form-group">
          <label>照片说明（每行一张）</label>
          {photoDescriptions.map((d, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 6, marginBottom: 6 }}
            >
              <input
                value={d}
                onChange={(e) => {
                  const arr = [...photoDescriptions];
                  arr[i] = e.target.value;
                  setPhotoDescriptions(arr);
                }}
              />
              {photoDescriptions.length > 1 && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    setPhotoDescriptions(photoDescriptions.filter((_, idx) => idx !== i))
                  }
                >
                  删除
                </button>
              )}
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setPhotoDescriptions([
                ...photoDescriptions,
                `手工补录护理现场照 ${photoDescriptions.length + 1}`,
              ])
            }
          >
            + 新增照片说明
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            确认补录
          </button>
        </div>
      </div>
    </div>
  );
}
