export const parseCsvFile = async <T>(
    file: File,
    parser: (row: string[]) => T
): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split("\n").filter((r) => r.trim() !== "");
                const headerIndex = 1;

                const data = rows.slice(headerIndex).map((line) => {
                    const values = line.split(",").map((col) => col.trim());
                    return parser(values);
                });

                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
};

