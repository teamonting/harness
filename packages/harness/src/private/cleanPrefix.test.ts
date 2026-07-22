import expect from 'expect';
import { test } from 'node:test';
import cleanPrefix from './cleanPrefix.ts';

test("cleanPrefix('abc')", () => expect(cleanPrefix('abc')).toBe('abc'));
test("cleanPrefix('abc123')", () => expect(cleanPrefix('abc123')).toBe('abc123'));
test("cleanPrefix('.abc.123.')", () => expect(cleanPrefix('.abc.123.')).toBe('abc-123'));
test("cleanPrefix('.a.b.c.1.2.3.')", () => expect(cleanPrefix('.a.b.c.1.2.3.')).toBe('a-b-c-1-2-3'));
test("cleanPrefix('.a..b..c.')", () => expect(cleanPrefix('.a..b..c.')).toBe('a-b-c'));
