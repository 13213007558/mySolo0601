import type { DecompressionStep, User } from "~/data/types";
import LadderCard from "./LadderCard";

interface Props {
  steps: DecompressionStep[];
  currentUser: User;
  users: User[];
  isEmergency: boolean;
  onCheckin: (stepId: string) => void;
  onDiverSign: (stepId: string, signature: string) => void;
  onInstructorSign: (stepId: string, signature: string) => void;
}

export default function DecompressionLadder({
  steps,
  currentUser,
  users,
  isEmergency,
  onCheckin,
  onDiverSign,
  onInstructorSign,
}: Props) {
  const sorted = [...steps].sort((a, b) => a.index - b.index);

  return (
    <div className="space-y-4">
      {sorted.map((step) => (
        <div key={step.id} className="relative">
          {step.index > 0 && (
            <div className="absolute -top-4 left-8 md:left-12 lg:left-16 w-0.5 h-4 bg-gradient-to-b from-nautical-700 to-indicator-cyan/40" />
          )}
          <LadderCard
            step={step}
            currentUser={currentUser}
            users={users}
            isEmergency={isEmergency}
            isSupport={currentUser.role === "support"}
            onCheckin={onCheckin}
            onDiverSign={onDiverSign}
            onInstructorSign={onInstructorSign}
          />
        </div>
      ))}
    </div>
  );
}
