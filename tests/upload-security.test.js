import {it,expect} from 'vitest';
import {sanitizeImage} from '../server/images.js';
it('rejects non-image data declared as an image',async()=>{await expect(sanitizeImage(Buffer.from('<script>alert(1)</script>'))).rejects.toThrow()});
it('rejects SVG even if a browser can display it',async()=>{await expect(sanitizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'))).rejects.toThrow()});
