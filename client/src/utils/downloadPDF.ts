// utils/downloadWritingsZip.ts
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";


export interface Writing {
    id: number;
    started_time: string;
    trait: string;
    response: string;
    student_code: string;
    words_count: number;
}

export interface StudentData {
    student: string;
    first_name: string;
    last_name: string;
    writings: Writing[];
}

/**
 * Strips actual HTML tags from a string safely using DOM parsing.
 * @param html - The HTML string to clean.
 * @returns Plain text content.
 */
const extractTextFromHTML = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent?.trim() ?? "";
};

/**
 * Generates a PDF blob from the given content.
 * @param content - The text content to include in the PDF.
 * @param fileName - The name of the file to be generated.
 * @returns A Blob representing the generated PDF.
 */
export const generatePDF = (content: string): Blob => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxLineWidth = pageWidth - margin * 2;

    const lines = pdf.splitTextToSize(content, maxLineWidth);
    let cursorY = margin;

    for (const line of lines) {
        if (cursorY + 10 > pageHeight - margin) {
            pdf.addPage();
            cursorY = margin;
        }
        pdf.text(line, margin, cursorY);
        cursorY += 10;
    }

    return pdf.output("blob");
};
/**
 * Downloads a zip file containing PDFs of students' writings.
 * @param dataArray - An array of student data containing their writings.
 */
export const downloadWritingsZip = async (dataArray: StudentData[]) => {
    const zip = new JSZip();

    for (const data of dataArray) {
        const fullName = `${data.last_name}${data.first_name}`;

        for (const writing of data.writings) {
            const extractResponse = extractTextFromHTML(writing.response);
            const content = `
                Student Full Name: ${fullName}
                Started Time: ${writing.started_time}
                Word Count: ${writing.words_count}
                Response:
                ${extractResponse}
            `.trim();

            const pdfBlob = generatePDF(content);
            const fileName = `${writing.trait.replace(/\s+/g, "_")}_${fullName}.pdf`;
            zip.file(`${fullName}/${fileName}`, pdfBlob);
        }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `students_writings.zip`);
};

export interface DownloadData {
    student_code: string;
    rater_name: string;
    trait: string;
    ta: number | null;
    gra: number | null;
    voc: number | null;
    coco: number | null;
    comments: string;
    response: string;
    words_count: number;
    started_time: string;
};
/**
 * Downloads a PDF file with the provided data.
 * @param data - The data to be included in the PDF.
 */
export const downloadPDF = async (data: DownloadData) => {
    const extractResponse = extractTextFromHTML(data.response);
    const content = `
Student Name: ${data.student_code}
Rater Name: ${data.rater_name}
Trait: ${data.trait}
Ratings:
  - TA: ${data.ta ?? "N/A"}
  - GRA: ${data.gra ?? "N/A"}
  - VOC: ${data.voc ?? "N/A"}
  - COCO: ${data.coco ?? "N/A"}
Comments: ${data.comments}
Response: ${extractResponse}
Words Count: ${data.words_count}
Started Time: ${data.started_time}
    `.trim();

    const pdfBlob = generatePDF(content);

    const fileName = `${data.trait.replace(/\s+/g, "_")}_${data.student_code.replace(/\s+/g, "_")}.pdf`;
    saveAs(pdfBlob, fileName);
};