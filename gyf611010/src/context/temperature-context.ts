import { createContext } from '@lit-labs/context';
import type { Context } from '@lit-labs/context';
import type { ProbeGuideState, AnomalyEvent } from '../types/index';

export type AnomalySubscriber = (event: AnomalyEvent) => void;

export interface TemperatureContextType {
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  probeGuideState: ProbeGuideState;
  updateProbeDepth: (depth: number) => void;
  confirmProbePosition: () => void;
  dataInterruptionTimer: number;
  currentTemperature: number;
  anomalyDetected: AnomalyEvent | null;
  subscribeToAnomalies: (subscriber: AnomalySubscriber) => () => void;
}

export const temperatureContext = createContext<TemperatureContextType, symbol>(
  Symbol('temperature-context')
);

export type TemperatureContext = Context<symbol, TemperatureContextType>;

export const temperatureContextDefaultValue: TemperatureContextType = {
  isMonitoring: false,
  startMonitoring: () => {},
  stopMonitoring: () => {},
  probeGuideState: {
    currentStep: 0,
    totalSteps: 3,
    currentDepth: 0,
    targetDepth: 5,
    isConfirmed: false,
  },
  updateProbeDepth: () => {},
  confirmProbePosition: () => {},
  dataInterruptionTimer: 600,
  currentTemperature: 0,
  anomalyDetected: null,
  subscribeToAnomalies: () => () => {},
};

export type TemperatureContextProvider = (value: TemperatureContextType) => void;
