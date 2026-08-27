import { isNonNull } from "./IsNonNull";
import { of } from "rxjs";

interface TestInterface {
    myTest: 'always succeeds';
}

describe('isNonNull', () => {
    it('should filter out null and undefined values', () => {
        const testObject = { key: 'value' };
        const testArray = [1, 2, 3];
        const source = of('hello', null, 123, undefined, true, testObject, testArray);
        const expected = ['hello', 123, true, testArray, testObject];

        source.pipe(isNonNull()).subscribe((value) => {
            expect(expected.includes(value)).toBe(true);
        });
    });

    it('should return data of the correct type', () => {
        function testFunction(input: TestInterface): void {
            expect(input.myTest).toBe('always succeeds');
        }
        const input: TestInterface = { myTest: 'always succeeds' };
        const source = of(null, input, undefined);
        source.pipe(isNonNull()).subscribe((value) => {
            // This should not compile if null/undefined are allowed to pass through.
            testFunction(value);
        });
    });
});
