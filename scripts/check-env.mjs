import {validateEnvironment} from '../server/config/validate-env.js';
validateEnvironment(process.env);
console.log('Server environment validation passed. Payment and mail providers remain disabled.');
