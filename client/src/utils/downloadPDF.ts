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

    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    let result = "";
    let currentNode: Node | null = walker.currentNode;

    while (currentNode) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
            const tag = (currentNode as HTMLElement).tagName.toLowerCase();
            if (tag === "br") {
                result += "\n";
            } else if (tag === "p") {
                if (result.trim() !== "") result += "\n\n";
            }
        } else if (currentNode.nodeType === Node.TEXT_NODE) {
            result += currentNode.textContent;
        }
        currentNode = walker.nextNode();
    }

    return result.trim();
};


/**
 * Generates a PDF blob from the given content.
 * @param content - The text content to include in the PDF.
 * @param fileName - The name of the file to be generated.
 * @returns A Blob representing the generated PDF.
 */
export const generatePDF = (contentBlocks: Record<string, string>): Blob => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 8;
    const maxLineWidth = pageWidth - margin * 2;

    let cursorY = margin;

    pdf.setFont("helvetica", "");
    pdf.setFontSize(12);

    for (const [label, value] of Object.entries(contentBlocks)) {
        if (label.toLowerCase() === "content") {
            // Content block — label on one line, then full paragraph
            pdf.setFont("helvetica", "bold");
            pdf.text(`${label}:`, margin, cursorY);
            cursorY += lineHeight;

            pdf.setFont("helvetica", "normal");

            const paragraphs = value.split(/\n{2,}/g);
            for (const para of paragraphs) {
                const lines = pdf.splitTextToSize(para.trim(), maxLineWidth);
                for (const line of lines) {
                    if (cursorY + lineHeight > pageHeight - margin) {
                        pdf.addPage();
                        cursorY = margin;
                    }
                    pdf.text(line, margin, cursorY);
                    cursorY += lineHeight;
                }
                cursorY += 2; // Small paragraph gap
            }

            cursorY += 4; // Gap before next section (if any)
        } else {
            // All other fields on the same line
            const labelText = `${label}:`;
            // const fullText = `${labelText} ${value}`;

            pdf.setFont("helvetica", "bold");
            pdf.text(labelText, margin, cursorY);

            const labelWidth = pdf.getTextWidth(labelText);

            pdf.setFont("helvetica", "normal");
            pdf.text(value, margin + labelWidth + 2, cursorY);

            cursorY += lineHeight;
        }
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
        const fullName = `${data.last_name} ${data.first_name}`;

        for (const writing of data.writings) {
            const extractResponse = extractTextFromHTML(writing.response);
            const content = {

                Student: fullName,
                "Started Time": writing.started_time,
                "Word Count": writing.words_count.toString(),
                Content: extractResponse
            }
          

            const pdfBlob = generatePDF(content);
            const fileName = `${writing.trait.replace(/\s+/g, "_")}_${fullName}.pdf`;
            zip.file(`${fileName}`, pdfBlob);
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
    const content = {

        "Student Name":data.student_code,
        "Rater Name": data.rater_name,
        Trait: data.trait,

  TA: data.ta?.toString() ?? "N/A",
  GRA: data.gra?.toString() ?? "N/A",
  VOC: data.voc?.toString() ?? "N/A",
  COCO: data.coco?.toString() ?? "N/A",
  Comments: data.comments ?? "N/A",
  "Words Count": data.words_count.toString(),
  "Started Time": data.started_time,
  Content: extractResponse,
}
    

    const pdfBlob = generatePDF(content);

    const fileName = `${data.trait.replace(/\s+/g, "_")}_${data.student_code.replace(/\s+/g, "_")}.pdf`;
    saveAs(pdfBlob, fileName);
};