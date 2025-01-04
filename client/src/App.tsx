import {useState} from 'react'
import {Button, Form, Row, Col, Alert, Card, CardBody, CardTitle, Table} from 'react-bootstrap'
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
                <Alert variant='light'>
                    Status: {status}
                </Alert>
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
                    <Card>
                        <Card.Header>
                            <CardTitle>
                                File details:
                            </CardTitle>
                        </Card.Header>
                        <Card.Body>
                            <CardBody>
                                <Row><Col>Name:</Col><Col> {file.name}</Col></Row>
                                <Row><Col>Type:</Col><Col> {file.type}</Col></Row>
                                <Row><Col>Size:</Col><Col> {file.size} bytes</Col></Row>
                            </CardBody>
                        </Card.Body>
                    </Card>
                </Row>
            )}
            {embeddings && (
                <Card>
                    <Card.Header>
                    File details:
                    </Card.Header>
                    <Card.Body>
                        <li>Number of chunks: {embeddings['chunksSize']}</li>
                    </Card.Body>
                </Card>
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
                    <Row>
                        <Row>
                            {answer['answer']}
                        </Row>
                        <Table striped bordered hover>
                            <thead>
                            <tr>
                                <th>Content</th>
                                <th>Score</th>
                            </tr>
                            </thead>
                            {answer['context'].map(c => <tr>
                                <td>{c['metadata']['text_content']}</td>
                                <td>TODO</td>
                            </tr>)}
                        </Table>
                    </Row>
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
