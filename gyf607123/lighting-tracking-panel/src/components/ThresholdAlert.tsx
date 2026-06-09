import React from 'react';
import { Alert, Tag, Space } from 'antd';
import { useApp } from '../context/AppContext';
import { checkThresholds } from '../utils/validation';
import type { CircuitRecord } from '../types';

interface ThresholdAlertProps {
  record: CircuitRecord;
  showTag?: boolean;
}

export const ThresholdAlert: React.FC<ThresholdAlertProps> = ({ record, showTag = true }) => {
  const { state } = useApp();
  const warnings = checkThresholds(record, state.thresholds);

  if (warnings.length === 0) {
    if (showTag) {
      return <Tag color="green">数值正常</Tag>;
    }
    return null;
  }

  if (warnings.length <= 1) {
    return (
      <Space>
        {showTag && <Tag color="orange">需要留意</Tag>}
        <Alert
          type="warning"
          showIcon
          message={warnings[0]}
          style={{ padding: '4px 12px', fontSize: 12 }}
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {showTag && <Tag color="red">多个异常</Tag>}
      <Alert
        type="error"
        showIcon
        message="检测到多项指标异常"
        description={
          <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
            {warnings.map((warning, index) => (
              <li key={index} style={{ fontSize: 12, marginBottom: 4 }}>
                {warning}
              </li>
            ))}
          </ul>
        }
      />
    </Space>
  );
};
