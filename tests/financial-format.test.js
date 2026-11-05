import {it,expect} from 'vitest';import {formatPaise} from '../src/lib/financial-format.js';
it('formats large integer database sums without floating-point loss',()=>expect(formatPaise('900719925474099123')).toBe('₹9007199254740991.23'));
it('formats paise and negative historical values exactly',()=>{expect(formatPaise(12345)).toBe('₹123.45');expect(formatPaise('-1')).toBe('-₹0.01')});
