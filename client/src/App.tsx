import {useState} from 'react'
import './App.css'
import {Button, Form, Row} from 'react-bootstrap'

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
                const result = await fetch(import.meta.env.VITE_API_URL + '/documents', {
                    method: 'POST',
                    body: formData,
                });

                if (result.status === 200) {
                    const data = await result.json();
                    setStatus('File uploaded!');
                    setEmbeddings(data?.metadata)
                } else {
                    setStatus('File already exists')
                }
            } catch (error) {
                setStatus(error.message)
                console.error(error);
            }
        }
    };

    const handleQuery = async () => {
        if (query) {
            try {
                const result = await fetch(import.meta.env.VITE_API_URL + '/query', {
                    method: 'POST',
                    body: JSON.stringify({query: query}),
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
            <Row>
                Status:
                <p>{status}</p>
            </Row>
            <Row>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Control size="lg"
                                  type="file"
                                  accept="application/pdf"
                                  onChange={handleFileChange}/>
                </Form.Group>
            </Row>
            {file && (
                <Row>
                    File details:
                    <ul>
                        <li>Name: {file.name}</li>
                        <li>Type: {file.type}</li>
                        <li>Size: {file.size} bytes</li>
                    </ul>
                </Row>
            )}
            {embeddings && (
                <Row>
                    File details:
                    <ul>
                        <li>Number of chunks: {embeddings['chunksSize']}</li>
                    </ul>
                </Row>
            )}
            {file && file.type === "application/pdf" && (
                <Row>
                    <Button
                        onClick={handleUpload}
                        className="submit"
                    >Upload a file</Button>
                </Row>
            )}
            <div>
                {answer && (
                    <section>
                        <section>
                            {answer['answer']}
                        </section>
                        <section>
                            <ul>
                                {answer['context'].map(c => <li>
                                    Content: c['metadata']['text_content'] <br/>
                                    Score: c['metadata'][]
                                </li>)}
                            </ul>
                        </section>
                    </section>
                )}
                <Form.Group className="mb-3">
                    <Row style={{marginTop: 30}}>
                        <Form.Control as="textarea" rows={3} id="query" onChange={handleQueryChange}/>
                    </Row>
                    <Row>
                        <Button
                            onClick={handleQuery}
                            className="submit"
                            disabled={!(query && query.length > 0)}
                        >Ask the GPT
                        </Button>
                    </Row>
                </Form.Group>
            </div>
        </>
    )
}

export default App
