import './App.css';
import { useState, useEffect } from "react";
import { ArrowRight, Check, TextSearch, FilePlus2 } from "lucide-react";

function App() {
  const [worker, setWorker] = useState(null);
  const [loading1, setLoading1] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [result, setResult] = useState(null);
  const [inputText, setInputText] = useState("");

  const [context, setContext] = useState("");
  const [topChunks, setTopChunks] = useState([]);
  const [loading2, setLoading2] = useState(true);

  const [showContext, setShowContext] = useState(false);
  

  useEffect(() => {
    const newWorker = new Worker(new URL("./worker.js", import.meta.url))

    newWorker.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === "modelLoaded") setLoading1(false);
      if (type === "embedderLoaded") setLoading2(false);

      if (type === "result") {
        setResult(payload);
        setWaiting(false);
      }
      if (type === "error") {
        console.error(payload);
        setWaiting(false);
      }

      if (type === "inference") {
        setResult(payload[0]);
        setTopChunks(payload[1]);
        setWaiting(false);
      }

    };

    newWorker.postMessage({ type: "loadModel" });
    newWorker.postMessage({ type: "loadEmbedder" });
    setWorker(newWorker);

    return () => newWorker.terminate();
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleClick();
  };

  const handleClick = () => {
    if (!worker || !inputText) return;
    setWaiting(true);
    setTopChunks([]);
    setResult("");
    worker.postMessage({ type: "generation", payload: { input: inputText, context: context } });
  };

  return (
    <div className="container">
      <h1>How can I help?</h1>

      {loading1 ?
        <div className='small-container'>
          <span className="spinner"></span>
          <p style={{ color: "grey" }}>Loading inference model...</p>
        </div>: 
        <div className='small-container'>
        <Check strokeWidth={1} style={{ color: "grey" }} />
        <span style={{ color: "grey" }}>Inferences are computed by Xenova/LaMini-Flan-T5-783M, running locally.</span>
      </div>}
      

        {loading2 ?
        <div className='small-container'>
          <span className="spinner"></span>
          <p style={{ color: "grey" }}>Loading embeddings model...</p>
        </div>: 
        <div className='small-container'>
        <Check strokeWidth={1} style={{ color: "grey" }} />
        <span style={{ color: "grey" }}>Embeddings are computed with Xenova/all-MiniLM-L6-v2, also running locally.</span>
      </div>
        }

        

      {!loading1 && !loading2 &&
        <>

          <br></br><br></br>
          <div className='small-container'>
          <FilePlus2 strokeWidth={1} style={{ color: "grey" }}/><span style={{ color: "grey" }}>You can add here context which will help the model answer your question:</span>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <textarea
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Pretty much anything. You can paste a contract, a news article, some part of a book, etc."
              style={{ height:"5em", marginRight: "1em" }}
            />
            
          </div>

         
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your question"
              style={{ marginRight: "1em" }}
            />
            {waiting ? (
              <div className='spinner-wrapper'>
                <div className="spinner"></div>
              </div>
            ) : (
              <ArrowRight className='icon' onClick={handleClick} />
            )}
          </div>
          <div>{result && <p className='small-container'>{result} <TextSearch strokeWidth={2} className='icon' onClick={(e) => (setShowContext(!showContext))}/></p>}</div>

          <br></br>
          {showContext && topChunks.length > 0 && (
            <div className="context">
              <p style={{color:"grey"}}>The model used the following chunks from the context</p>
              <p>
                {topChunks.map((chunk, index) => (
                  <li key={index}>
                    Chunk {index + 1} (Similarity: {chunk.similarity.toFixed(4)})
                    <p className="text-gray-700"><i>{chunk.chunk}</i></p>
                  </li>
                ))}
              </p>
            </div>
          )}
        </>}

    </div>
  );
}

export default App;
