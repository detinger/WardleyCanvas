// LRN-01: Content registry — single source of all learning modules.
// Import here; every other part of the app uses this registry.

import { LearningModule } from '../types';
import module01 from './module-01';
import module02 from './module-02';
import module03 from './module-03';
import { module04, module05, module06, module07, module08 } from './modules-04-08';

export const ALL_MODULES: LearningModule[] = [
  module01,
  module02,
  module03,
  module04,
  module05,
  module06,
  module07,
  module08,
];

export function getModule(id: string): LearningModule | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export function getModuleByIndex(index: number): LearningModule | undefined {
  return ALL_MODULES.find((m) => m.index === index);
}

export const PUBLISHED_MODULES = ALL_MODULES.filter((m) => m.published);
