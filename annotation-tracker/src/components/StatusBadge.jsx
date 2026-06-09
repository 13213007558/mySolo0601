import {
  ANNOTATION_STATUS_LABELS,
  ANNOTATION_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  SOURCE_LABELS,
  ERROR_TYPE_LABELS
} from '../db';
import { FileText, MessageCircle, Table, AlertTriangle } from 'lucide-react';

export function StatusBadge({ status }) {
  const label = ANNOTATION_STATUS_LABELS[status] || status;
  const colorClass = ANNOTATION_STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';
  
  return (
    <span className={`badge ${colorClass}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const label = PRIORITY_LABELS[priority] || priority;
  const colorClass = PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-700';
  
  return (
    <span className={`badge ${colorClass}`}>
      {label}
    </span>
  );
}

export function SourceBadge({ source }) {
  const label = SOURCE_LABELS[source] || source;
  
  const icons = {
    pdf: <FileText className="w-3 h-3 mr-1" />,
    wechat: <MessageCircle className="w-3 h-3 mr-1" />,
    excel: <Table className="w-3 h-3 mr-1" />
  };
  
  const colors = {
    pdf: 'bg-red-100 text-red-700',
    wechat: 'bg-green-100 text-green-700',
    excel: 'bg-blue-100 text-blue-700'
  };
  
  return (
    <span className={`badge ${colors[source] || 'bg-slate-100 text-slate-700'} flex items-center`}>
      {icons[source]}
      {label}
    </span>
  );
}

export function ErrorBadge({ errorType }) {
  const label = ERROR_TYPE_LABELS[errorType] || errorType;
  
  return (
    <span className="badge bg-amber-100 text-amber-700 flex items-center">
      <AlertTriangle className="w-3 h-3 mr-1" />
      {label}
    </span>
  );
}
