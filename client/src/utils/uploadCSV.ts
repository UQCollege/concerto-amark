import Papa from 'papaparse';
export const parseCsvFile = async <T>(
    file: File,
    parser: (row: string[]) => T
): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
        
                const result = Papa.parse<Record<string, string>>(text, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    newline: "\n",
                    quoteChar: '"',
                });
        
                if (result.errors.length > 0) {
                    console.error("CSV Parsing errors: ", result.errors);
                    reject(result.errors);
                    return;
                }
        
                const data = result.data.map((row) => {
                    const cleanText = (str: string) =>
                        typeof str === "string"
                            ? str
                            .replace(/\r\n/g, '\n') 
                            .replace(/\uFEFF/g, '') 
                            : str;
                    Object.keys(row).forEach((key) => {
                        row[key] = cleanText(row[key] as string);
                    });
        
                    return parser(Object.values(row)); 
                });
        
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.readAsText(file, 'utf-8');
    
    });
};

