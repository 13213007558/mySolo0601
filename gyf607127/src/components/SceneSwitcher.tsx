import { motion } from 'framer-motion';
import { Database, AlertOctagon, DatabaseZap } from 'lucide-react';
import type { DataScene } from '@/types';
import { sceneLabels, sceneDescriptions } from '@/data/mockData';

interface SceneSwitcherProps {
  currentScene: DataScene;
  onSceneChange: (scene: DataScene) => void;
}

const sceneConfig: Record<DataScene, { icon: typeof Database; color: string }> = {
  normal: { icon: Database, color: 'emerald' },
  abnormal: { icon: AlertOctagon, color: 'red' },
  empty: { icon: DatabaseZap, color: 'slate' },
};

export const SceneSwitcher = ({ currentScene, onSceneChange }: SceneSwitcherProps) => {
  const scenes: DataScene[] = ['normal', 'abnormal', 'empty'];

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-300 mb-3">数据场景切换</h3>
      <div className="space-y-2">
        {scenes.map((scene) => {
          const config = sceneConfig[scene];
          const Icon = config.icon;
          const isActive = currentScene === scene;
          
          return (
            <motion.button
              key={scene}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSceneChange(scene)}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                isActive
                  ? `bg-${config.color}-500/10 border-${config.color}-500/50`
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isActive ? `text-${config.color}-400` : 'text-slate-500'
                }`} />
                <div className="min-w-0">
                  <p className={`font-medium ${
                    isActive ? `text-${config.color}-400` : 'text-slate-300'
                  }`}>
                    {sceneLabels[scene]}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {sceneDescriptions[scene]}
                  </p>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeScene"
                    className={`w-2 h-2 rounded-full bg-${config.color}-400 mt-2 flex-shrink-0`}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
