/**
 * URL Helper utilities for handling base path in reverse proxy deployments
 */

/**
 * Creates a URL with the proper base path prefix
 * @param {string} path - The path to append to the base path
 * @returns {string} - The complete URL with base path prefix
 */
const createUrl = (path) => {
    const basePath = process.env.BASE_PATH || '';
    return basePath + path;
};

module.exports = {
    createUrl
};
