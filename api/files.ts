import fs from 'fs';
import PDFParser from 'pdf-parse';
import {updatePineconeIndex} from './database'

// Function to process the PDF and count word occurrences
export const processPDF = async (pdfFilePath: string) => {
    try {
        const pdfBuffer = fs.readFileSync(pdfFilePath);
        const data = await PDFParser(pdfBuffer);
        const metadata = Object.fromEntries(
            Object.entries(data.info).map(([k, v]) => [k.toLowerCase(), v])
        );
        const pdfText = {content: data.text, metadata};

        return await updatePineconeIndex(pdfText);
    } catch (error) {
        console.error('An error occurred while processing the PDF:', error);
    }
}