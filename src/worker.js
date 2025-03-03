/* eslint-disable no-restricted-globals */

import { pipeline } from '@huggingface/transformers';

let model = null;

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "loadModel") {
    model = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M', { dtype: 'q8' });
    self.postMessage({ type: "modelLoaded" });
  }

  if (type === "generateText") {
    if (!model) {
      self.postMessage({ type: "error", payload: "Model not loaded yet." });
      return;
    }
    const result = await model(payload.input, { max_new_tokens: 100 });
    self.postMessage({ type: "result", payload: result[0].generated_text });
  }
};