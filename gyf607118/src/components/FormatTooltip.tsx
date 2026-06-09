import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface FormatTooltipProps {
  message: string | null;
  children: React.ReactNode;
}

export const FormatTooltip = ({ message, children }: FormatTooltipProps) => {
  const [show, setShow] = useState(false);

  if (!message) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="flex items-center gap-1 text-warning-100 font-mono">
        {children}
        <AlertTriangle className="w-4 h-4 text-warning-400" />
      </div>
      {show && (
        <div className="tooltip-baihua">
          {message}
        </div>
      )}
    </div>
  );
};
