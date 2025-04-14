import { CONFIG, LiteLLMModel } from '../config/config.js';

export async function setModel(dest: 'default' | 'g3' | 'g4', model: LiteLLMModel) {
  if (dest === 'default') {
    CONFIG.OPENAI.DEFAULT_MODEL = model;
  } else if (dest === 'g3') {
    CONFIG.OPENAI.G3_MODEL = model;
  } else if (dest === 'g4') {
    CONFIG.OPENAI.G4_MODEL = model;
  }
}

