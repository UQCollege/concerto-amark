// test/parseCsvFile.test.ts

import { describe, it, expect } from 'vitest';
import { parseCsvFile } from './uploadCSV';

const mockCsvContent = `name,age,quote
Alice,30,"Moreover, another factor that should be concerned is social value. Online shopping has undoubtedly brought many conveniences to people’s lives, but it is slowly destroying the real economy. The reason behind it is that online shopping skip many steps compared with traditional in-store shopping. For example, with the development of online shopping, many physical stores have slowly disappeared in recent years, which meas the disappearance of many jobs and many people are unemployed. In addition, online shopping can not support local taxes, which will lead to some local economic recessions. Undoubtedly, this is a clear indication that we should protect traditional in-store shopping."
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
