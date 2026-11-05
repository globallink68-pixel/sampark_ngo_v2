import dotenv from 'dotenv';
import {validateEnvironment} from './validate-env.js';
dotenv.config({quiet:true});
export const env=validateEnvironment(process.env);
