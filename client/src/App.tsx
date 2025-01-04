import { useState } from 'react'
import './App.css'

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>("Awaiting the file");
    const [embeddings, setEmbeddings] = useState<string | null>(null);
    const [query, setQuery] = useState<string | null>(null);
    const [answer, setAnswer] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };
    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleUpload = async () => {
        if (file) {
            setStatus('Uploading file...');

            const formData = new FormData();
            formData.append('file', file);

            try {
                const result = await fetch(import.meta.env.VITE_API_URL+'/documents', {
                    method: 'POST',
                    body: formData,
                });

                const data = await result.json();
                setStatus('File uploaded!');
                setEmbeddings(data?.metadata)
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleQuery = async () => {
        if (query) {
            try {
                const result = await fetch(import.meta.env.VITE_API_URL+'/query', {
                    method: 'POST',
                    body: JSON.stringify({ query: query }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                const data = await result.json();
                setAnswer(data['answer'])
            } catch (error) {
                console.error(error);
            }
        }
    };

  // @ts-ignore
    return (
    <>
      <h1>Claude file analizer</h1>
        <section>
            Status:
            <p>{status}</p>
        </section>
        <div className="input-group">
            <input id="file" type="file" accept="application/pdf" onChange={handleFileChange} />
        </div>
        {file && (
            <section>
                File details:
                <ul>
                    <li>Name: {file.name}</li>
                    <li>Type: {file.type}</li>
                    <li>Size: {file.size} bytes</li>
                </ul>
            </section>
        )}
        {embeddings && (
            <section>
                File details:
                <ul>
                    <li>Number of chunks: {embeddings['chunksSize']}</li>
                </ul>
            </section>
        )}
        {file && file.type === "application/pdf" && (
            <button
                onClick={handleUpload}
                className="submit"
            >Upload a file</button>
        )}
        { embeddings &&
        <div>
            {answer && (
              <section>
                <section>
                    {answer['answer']}
                </section>
                <section>
                    <ul>
                    { answer['context'].map(c => <li>
                        Content: c['metadata']['text_content'] <br/>
                        Score: c['metadata'][]
                    </li>) }
                    </ul>
                </section>
              </section>
            )}
            <input id="query" type="text" onChange={handleQueryChange} />
            <button
                onClick={handleQuery}
                className="submit"
                disabled={!(query && query.length > 0)}
            >Ask the GPT
            </button>
        </div>
        }
    </>
  )
}

export default App
