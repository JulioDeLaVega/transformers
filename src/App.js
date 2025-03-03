import './App.css';
import { useState, useEffect } from "react";
import { ArrowRight, LampDesk } from "lucide-react";

function App() {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [result, setResult] = useState(null);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    const newWorker = new Worker(new URL("./worker.js", import.meta.url))

    newWorker.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === "modelLoaded") setLoading(false);
      if (type === "result") {
        setResult(payload);
        setWaiting(false);
      }
      if (type === "error") {
        console.error(payload);
        setWaiting(false);
      }
    };

    newWorker.postMessage({ type: "loadModel" });
    setWorker(newWorker);

    return () => newWorker.terminate();
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleClick();
  };

  const handleClick = () => {
    if (!worker || !inputText) return;
    setWaiting(true);
    setResult("");
    worker.postMessage({ type: "generateText", payload: { input: inputText } });
  };

  return (
    <div className="container">
      <h1>How can I help?</h1>

      {loading ? (
        <div className='small-container'>
          <span className="spinner"></span>
          <p style={{ color: "grey" }}>Loading model...</p>
        </div>
      ) : (
        <>
          <div className='small-container'>
            <LampDesk strokeWidth={1} style={{ color: "grey" }} />
            <p style={{ color: "grey" }}>You are asking questions to Xenova/LaMini-Flan-T5-783M, running locally.</p>
          </div>

          <br />
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
              <ArrowRight className='arrow' onClick={handleClick} />
            )}
          </div>

          {result && <p>{result}</p>}
        </>
      )}
    </div>
  );
}

export default App;
