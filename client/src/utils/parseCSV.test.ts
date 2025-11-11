// test/parseCsvFile.test.ts

import { describe, it, expect } from 'vitest';
import { parseCsvFile } from './uploadCSV';

const mockCsvContent = `name,age,quote
Alice,30,"It's a sunny day"
Bob,25,"He's going to the market"`;

const parser = ([name, age, quote]: string[]) => ({
    name,
    age: Number(age),
    quote,
});

function createMockCsvFile(content: string, filename = 'test.csv'): File {
    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], filename, { type: 'text/csv' });
}

describe('parseCsvFile', () => {
    it('should parse a CSV file and return parsed objects', async () => {
        const file = createMockCsvFile(mockCsvContent);

        const result = await parseCsvFile(file, parser);

        expect(result).toEqual([
            { name: 'Alice', age: 30, quote: "It's a sunny day" },
            { name: 'Bob', age: 25, quote: "He's going to the market" },
        ]);
    });
});
