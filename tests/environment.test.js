import {it,expect} from 'vitest';
import {validateEnvironment} from '../server/config/validate-env.js';
it('does not require retired provider keys',()=>{expect(()=>validateEnvironment({NODE_ENV:'production',APP_ORIGIN:'https://staging.example.test',SESSION_SECRET:'x'.repeat(40),DB_HOST:'db.internal',DB_NAME:'staging',DB_USER:'staging',DB_PASSWORD:'example',UPLOAD_ROOT:'/srv/media'})).not.toThrow()});
it('refuses remote test databases',()=>{expect(()=>validateEnvironment({NODE_ENV:'test',DB_HOST:'production.example'})).toThrow(/loopback/)});
it('rejects weak production sessions and HTTP origins',()=>{expect(()=>validateEnvironment({NODE_ENV:'production',SESSION_SECRET:'short',APP_ORIGIN:'http://example.test'})).toThrow()});
