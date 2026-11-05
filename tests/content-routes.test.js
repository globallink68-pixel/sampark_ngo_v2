import {it,expect} from 'vitest';
import {contentKind,contentPath} from '../src/lib/content-routes.js';
it('maps activities to the stored activity type',()=>expect(contentKind('activities')).toBe('activity'));
it('links activity search results to their real route',()=>expect(contentPath({kind:'activity',slug:'qa'})).toBe('/activities/qa'));
