const baseUrl = process.env.IMAGE_URL || "";

/**
 * Checks if a given path is a full URL.
 * @param {string} path - The image path to check.
 * @returns {boolean} - Returns true if the path is a full URL.
 */
function isFullUrl(path) {
    return /^(http|https):\/\//.test(path);
}

/**
 * Determines if a path needs the base URL.
 * @param {string} path - The path to check.
 * @returns {boolean} - Returns true if the path should have the base URL.
 */
function shouldAddBaseUrl(path) {
    const validFolders = ["uploads/", "images/", "banners/", "products/","pages/","local/"];  // Add valid folders
    return validFolders.some(folder => path.startsWith(folder));
}

/**
 * Adds base URL to image paths in strings, arrays, or objects.
 * @param {any} data - The data to process (string, array, or object).
 * @returns {any} - The processed data with base URLs added where needed.
 */
function addBaseUrlToImages(data) {
    if (typeof data === "string") {
        return (isFullUrl(data) || !shouldAddBaseUrl(data)) ? data : `${baseUrl}${data}`;
    }

    if (Array.isArray(data)) {
        return data.map(item => addBaseUrlToImages(item));
    }

    if (typeof data === "object" && data !== null) {
        for (let key in data) {
            data[key] = addBaseUrlToImages(data[key]);
        }
    }

    return data;
}

module.exports = { addBaseUrlToImages };
