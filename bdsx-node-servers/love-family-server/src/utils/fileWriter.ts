import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

export const readFileText = async (filePath: string) => {
    return await promisify(fs.readFile)(filePath, { encoding: 'utf-8' });
};

const createAppendFileWriter = (filePath: string) => {

    return {
        // getPlayerFilePath: () => filePath,
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

    const getPlayerFilePath = (playerName: string, fileName: string) => path.join(rootPath, 'playerData', playerName, fileName);
    return {
        getPlayerFilePath,
        createPlayerAppendFileWriter: (playerName: string, fileName: string) => createAppendFileWriter(getPlayerFilePath(playerName, fileName)),
    };
};
export type FileWriterServiceType = ReturnType<typeof createFileWriterService>;