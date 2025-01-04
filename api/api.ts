import {createPineconeIndex, queryPineconeIndex} from './database';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import {processPDF} from './files'

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
const upload = multer({
    storage,
    limits: { fileSize: 1024*1024*10 /* 10 Mb */ },
    fileFilter: (req, file, cb) => {
        //TODO check by hashsum
        if (fs.existsSync(`${uploadDirectory}/${file.originalname}`))
            cb(new Error('File already exists'))
        cb(null, true)
    }
});

app.post('/documents', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({error: 'No file uploaded'});
        }

        const uploadedFile = req.file;

        const fileName = `${uploadedFile.originalname}`;
        const filePath = `${uploadDirectory}/${fileName}`;
        const fileExtension = uploadedFile.mimetype ? uploadedFile.mimetype : null;

        if (fileExtension === 'application/pdf') {
            const content = await processPDF(filePath);
            res.send(content)
        } else {
            res.status(400).json({error: 'File should be in pdf'});
        }
    } catch (error) {
        console.error('An error occurred while processing the file:', error);
        res.status(500).json({error: 'Failed to process the file'});
    }
})

app.post('/query', async (req, res) => {
    const query = req.body.query;
    try {
        const answer = await queryPineconeIndex(query)
        res.send({answer})
    } catch  (error)  {
        console.error('An error occurred while sending the query:', error);
        res.status(500).json({error});
    }
})

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})