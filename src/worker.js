/* eslint-disable no-restricted-globals */

import { pipeline as hf_pipeline } from '@huggingface/transformers';

let model = null;

let embedder = null;

// // Function to load embedder model
// async function loadEmbedder() {
//   embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: 'q8' });
// }

// Function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Function to split text into chunks
function splitIntoChunks(text, chunkSize = 200) {
  const words = text.split(" ");
  let chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  
  return chunks;
}

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "loadModel") {
    model = await hf_pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M', { dtype: 'q8' });
    self.postMessage({ type: "modelLoaded" });
  }

  if (type === "loadEmbedder") {
    embedder = await hf_pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: 'q8' });
    self.postMessage({ type: "embedderLoaded" });
  }

  if (type === "generation") {

    if (!embedder) {
      self.postMessage({ type: "error", payload: "Embedder not loaded yet." });
      return;
    }

    if (!model) {
      self.postMessage({ type: "error", payload: "Model not loaded yet." });
      return;
    }

    // Step 1: Split context into chunks
    const chunks = splitIntoChunks(payload.context);

    // Step 2: Compute embeddings for each chunk
    const chunkEmbeddings = await embedder(chunks, { pooling: "mean", normalize: true });
    const chunkVectors = chunkEmbeddings.tolist();

    // Step 3: Compute embedding for the input text
    const inputEmbeddingTensor = await embedder(payload.input, { pooling: "mean", normalize: true });
    const inputEmbedding = inputEmbeddingTensor.tolist();

    const topChunks = chunks
    .map((chunk, i) => ({
      chunk,
      similarity: cosineSimilarity(inputEmbedding[0], chunkVectors[i]),
    }))
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
    .slice(0, 3); // Select top 3

    const chunksArray = topChunks.map(item => item.chunk);

    // model inference with context
    const result = await model("Answer the question based on this context:" + JSON.stringify(chunksArray, null, 2) + ". " + payload.input, { min_new_tokens: 50, max_new_tokens: 500 });

    self.postMessage({ type: "inference", payload: [result[0].generated_text, topChunks]});

  }


};