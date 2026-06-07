import { Link } from 'react-router-dom';
import { ChevronRight, FileSpreadsheet, Baby, Thermometer, FileText } from 'lucide-react';

interface Crumb {
  label: string;
  icon?: 'sheet' | 'baby' | 'thermometer' | 'leave';
  onClick?: () => void;
  to?: string;
  active?: boolean;
}

const iconMap = {
  sheet: FileSpreadsheet,
  baby: Baby,
  thermometer: Thermometer,
  leave: FileText,
};

export default function TraceBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((item, idx) => {
        const Icon = item.icon ? iconMap[item.icon] : null;
        const content = (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              item.active
                ? 'bg-medical-500 text-white shadow-inset-medical'
                : 'bg-white text-medical-700 border border-medical-100 hover:border-medical-300 hover:shadow-soft cursor-pointer'
            }`}
            onClick={item.onClick}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{item.label}</span>
          </div>
        );
        return (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <ChevronRight className="w-4 h-4 text-medical-400" />}
            {item.to && !item.active ? <Link to={item.to}>{content}</Link> : content}
          </div>
        );
      })}
    </div>
  );
}
