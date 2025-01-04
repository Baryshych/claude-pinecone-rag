import {createPineconeIndex, queryPineconeIndex} from './database';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { processPDF, processFileData } from './files'
const app = express()

const port = 3000
const uploadDirectory = './uploads';

app.use(cors());
app.use(express.json())

createPineconeIndex();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({storage});

app.post('/documents', upload.single('file'), async (req, res) => {
    try {
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const uploadedFile = req.file;

        const fileName = `${uploadedFile.originalname}`;
        const filePath = `${uploadDirectory}/${fileName}`;
        const fileData = fs.readFileSync(filePath, 'utf8');

        processFileData(fileData);

        const fileExtension = uploadedFile.mimetype ?uploadedFile.mimetype : null;

        if (fileExtension === 'application/pdf') {
            const content = await processPDF(filePath);
            res.send(content)
        } else {
            res.status(400).json({ error: 'File should be in pdf' });
        }
    } catch (error) {
        console.error('An error occurred while processing the file:', error);
        res.status(500).json({ error: 'Failed to process the file' });
    }
})

app.post('/query', async (req, res) => {
    const query = req.body.query;
    const answer = await queryPineconeIndex(query)
    res.send({answer})
})

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})