/**
 * Reads a File object and returns a promise that resolves with the Data URL (base64).
 * @param file The file to read
 * @returns Promise<string>
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file as string'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
