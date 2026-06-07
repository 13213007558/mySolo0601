import { ChevronRight, Baby, Calendar, Clock, MessageSquareText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { FollowUpRecord } from "@/types";
import { formatDate, formatDateTime, formatGender } from "@/utils/format";
import StatusTag from "./StatusTag";

interface Props {
  record: FollowUpRecord;
}

const statusBarColor: Record<string, string> = {
  normal: "bg-status-normal",
  abnormal: "bg-status-abnormal",
  revised: "bg-status-revised",
  manual: "bg-status-manual",
};

export default function RecordCard({ record }: Props) {
  const navigate = useNavigate();
  const barColor = record.isManualEntry
    ? statusBarColor.manual
    : statusBarColor[record.status];

  const abnormalCount = record.threeDayMeals.reduce(
    (acc, day) => acc + day.meals.filter((m) => m.isAbnormal).length,
    0
  );

  return (
    <div
      onClick={() => navigate(`/record/${record.id}`)}
      className="card-hoverable overflow-hidden flex animate-slide-up">
      <div className="flex">
        <div className={`w-1.5 flex-shrink-0 ${barColor}`} />
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-gray-800 font-serif text-base font-semibold">
                  <Baby size={18} className="text-medical-600" />
                  {record.infant.name}
                </div>
                <span className="text-sm text-gray-500">
                  {record.infant.ageMonths}月龄 · {formatGender(record.infant.gender)}
                </span>
                <StatusTag
                  status={record.status}
                  isManual={record.isManualEntry}
                />
                {abnormalCount > 0 && (
                  <span className="tag bg-red-50 text-red-600 border border-red-200">
                    {abnormalCount} 项风险
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={14} />
                  随访 {formatDate(record.followUpDate)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} />
                  更新 {formatDateTime(record.updatedAt)}
                </span>
                {record.lastOperator && (
                    <span className="inline-flex items-center gap-1">
                      复核人：{record.lastOperator}
                    </span>
                  )}
              </div>

              {record.parentNote && (
                <div className="mt-2.5 flex items-start gap-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <MessageSquareText size={14} className="mt-0.5 flex-shrink-0 text-medical-600" />
                  <p className="line-clamp-2 leading-relaxed">
                    {record.parentNote}
                  </p>
                </div>
              )}
            </div>

            <ChevronRight size={20} className="text-gray-300 flex-shrink-0 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
