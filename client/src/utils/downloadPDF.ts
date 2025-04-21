// utils/downloadWritingsZip.ts
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { Rating, RatingAspects } from "../apiTypes";

export interface Writing {
    id: number;
    started_time: string;
    trait: string;
    response: string;
    student_name: string;
    words_count: number;
}

export interface StudentData {
    student: string;
    first_name: string;
    last_name: string;
    writings: Writing[];
}

export const downloadWritingsZip = async (dataArray: StudentData[]) => {
    const zip = new JSZip();

    for (const data of dataArray) {
        const fullName = `${data.last_name}${data.first_name}`;

        for (const writing of data.writings) {
            const pdf = new jsPDF();
            const content = `
student full name: ${fullName}
started_time: ${writing.started_time}
word_count: ${writing.words_count}
response: ${writing.response}
            `.trim();

            pdf.text(content, 10, 10);
            const pdfBlob = pdf.output("blob");

            const fileName = `${writing.trait.replace(/\s+/g, "_")}_${fullName}.pdf`;
            zip.file(`${fullName}/${fileName}`, pdfBlob);
        }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `students_writings.zip`);
};

export interface DownloadData {
    student_name: string;
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
export const downloadPDF = async (data: DownloadData) => {
    const pdf = new jsPDF();

    const content = `
Student Name: ${data.student_name}
Rater Name: ${data.rater_name}
Trait: ${data.trait}
Ratings:
  - TA: ${data.ta ?? "N/A"}
  - GRA: ${data.gra ?? "N/A"}
  - VOC: ${data.voc ?? "N/A"}
  - COCO: ${data.coco ?? "N/A"}
Comments: ${data.comments}
Response: ${data.response}
Words Count: ${data.words_count}
Started Time: ${data.started_time}
    `.trim();

    pdf.text(content, 10, 10);
    const pdfBlob = pdf.output("blob");

    const fileName = `${data.trait.replace(/\s+/g, "_")}_${data.student_name.replace(/\s+/g, "_")}.pdf`;
    saveAs(pdfBlob, fileName);
};