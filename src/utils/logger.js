/**
 * Logger entry point - automatically selects the right implementation
 */
import browserLogger from './loggerBrowser';

// Use the browser implementation for client-side
export default browserLogger;


