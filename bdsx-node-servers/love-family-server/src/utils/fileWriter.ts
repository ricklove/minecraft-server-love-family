import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const createAppendFileWriter = (filePath: string) => {

    return {
        appendToFile: async (text: string) => {
            console.log('appendToFile', { filePath, text });

            // Ensure directory exists
            const dirPath = path.dirname(filePath);
            await promisify(fs.mkdir)(dirPath, { recursive: true });

            // Will create if it doesn't exist
            await promisify(fs.appendFile)(filePath, text);
        }
    };
};

export const createFileWriterService = (rootPath: string) => {

    return {
        createPlayerAppendFileWriter: (playerName: string, fileName: string) => createAppendFileWriter(path.join(rootPath, 'playerData', playerName, fileName)),
    };
};
export type FileWriterServiceType = ReturnType<typeof createFileWriterService>;