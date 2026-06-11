import { createContext } from '@lit-labs/context';
import type { Context } from '@lit-labs/context';
import type { CheeseWheel } from '../types/index';
import { cheeseWheels as mockCheeseWheels } from '../utils/mock-data';

export interface CheeseContextType {
  cheeseWheels: CheeseWheel[];
  selectedCheeseWheel: CheeseWheel | null;
  selectCheeseWheel: (wheelId: string | null) => void;
  updateTemperature: (wheelId: string, temperature: number, probeDepth: number) => void;
  bindCheeseWheel: (wheelId: string, cellarPositionId: string, yeastBatchId: string) => void;
}

export const cheeseContext = createContext<CheeseContextType, symbol>(
  Symbol('cheese-context')
);

export type CheeseContext = Context<symbol, CheeseContextType>;

export const cheeseContextDefaultValue: CheeseContextType = {
  cheeseWheels: mockCheeseWheels.map(wheel => ({
    id: wheel.id,
    wheelNumber: wheel.batchNumber,
    cellarPositionId: wheel.positionId,
    yeastBatchId: wheel.yeastBatchId,
    entryTime: wheel.productionDate,
    targetMaturationTime: wheel.estimatedMaturityDate,
    status: mapStatus(wheel.currentStage),
    targetTempRange: [wheel.targetTemperatureMin, wheel.targetTemperatureMax],
    maturationHours: 0,
    temperatureHistory: wheel.temperatureHistory.map((point: any) => ({
      timestamp: point.timestamp,
      temperature: point.temperature,
      probeDepth: 0,
      status: point.isAnomaly ? 'forged' : 'valid' as const,
    })),
  })),
  selectedCheeseWheel: null,
  selectCheeseWheel: () => {},
  updateTemperature: () => {},
  bindCheeseWheel: () => {},
};

function mapStatus(stage: string): CheeseWheel['status'] {
  switch (stage) {
    case 'salting':
    case 'ripening':
      return 'maturing';
    case 'matured':
      return 'ready';
    case 'aging':
      return 'maturing';
    default:
      return 'maturing';
  }
}

export type CheeseContextProvider = (value: CheeseContextType) => void;
