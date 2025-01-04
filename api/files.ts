import fs from 'fs';
import PDFParser from 'pdf-parse';
import {updatePineconeIndex} from './database'
// Function to process the file data (perform your file processing logic here)
export const processFileData = (fileData) => {
    fs.writeFile('output.txt', fileData, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('File written successfully');
        }
    });
}

// Function to process the PDF and count word occurrences
export const processPDF = async (pdfFilePath: string) => {
    try {
        // Parse the PDF content
        const pdfBuffer = fs.readFileSync(pdfFilePath);
        const data = await PDFParser(pdfBuffer);
        const metadata = Object.fromEntries(
            Object.entries(data.info).map(([k, v]) => [k.toLowerCase(), v])
        );
        const pdfText = {content: data.text, metadata};
        //TODO: add file hashsum check to skip upload of existing files
        return await updatePineconeIndex(pdfText);
    } catch (error) {
        console.error('An error occurred while processing the PDF:', error);
    }
}