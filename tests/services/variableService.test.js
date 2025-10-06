"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// Import will fail until implementation exists - this is expected for TDD
const variableService_1 = require("../../src/services/variableService");
suite('Variable Service Tests', () => {
    let variableService;
    setup(() => {
        variableService = new variableService_1.VariableService();
    });
    test('Should process date variables with current timestamp', () => {
        const filename = 'report-$YYYY-$MM-$DD.txt';
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'test',
            currentDate: new Date('2025-10-01'),
            environment: {}
        });
        assert.strictEqual(processed, 'report-2025-10-01.txt');
    });
    test('Should process all date/time variables correctly', () => {
        const date = new Date('2025-10-01T14:30:45.123Z');
        const filename = '$YYYY-$YY-$Y-$MMMM-$MMM-$MM-$M-$DDDD-$DDD-$DD-$D-$hh-$h-$mm-$m-$ss-$s-$fff-$ff-$f.txt';
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'test',
            currentDate: date,
            environment: {}
        });
        // Should replace with proper date formatting
        assert.ok(processed.includes('2025')); // $YYYY
        assert.ok(processed.includes('25')); // $YY  
        assert.ok(processed.includes('5')); // $Y
        assert.ok(processed.includes('October')); // $MMMM
        assert.ok(processed.includes('Oct')); // $MMM
        assert.ok(processed.includes('10')); // $MM
        assert.ok(processed.includes('1')); // $M
    });
    test('Should process environment variables case-insensitively', () => {
        const filename = 'report-for-%USERNAME%-in-%USERPROFILE%.txt';
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'test',
            currentDate: new Date(),
            environment: {
                'USERNAME': 'JohnDoe',
                'USERPROFILE': 'C:\\Users\\JohnDoe'
            }
        });
        assert.strictEqual(processed, 'report-for-JohnDoe-in-C:\\Users\\JohnDoe.txt');
    });
    test('Should process special variables like $PARENT_FOLDER_NAME', () => {
        const filename = 'component-in-$PARENT_FOLDER_NAME.tsx';
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'MyComponent',
            currentDate: new Date(),
            environment: {}
        });
        assert.strictEqual(processed, 'component-in-MyComponent.tsx');
    });
    test('Should replace invalid filename characters with spaces', () => {
        const filename = 'file<with>invalid:chars|in?name*.txt';
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'test',
            currentDate: new Date(),
            environment: {}
        });
        // Should replace < > : | ? * with spaces
        assert.strictEqual(processed, 'file with invalid chars in name .txt');
    });
    test('Should return original filename when processing disabled', () => {
        const filename = 'file-$YYYY-$MM-$DD.txt';
        variableService.setProcessingEnabled(false);
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'test',
            currentDate: new Date(),
            environment: {}
        });
        assert.strictEqual(processed, filename);
    });
    test('Should handle mixed variable types in single filename', () => {
        const filename = '$PARENT_FOLDER_NAME-report-$YYYY-$MM-$DD-by-%USERNAME%.pdf';
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'ProjectX',
            currentDate: new Date('2025-10-01'),
            environment: { 'USERNAME': 'JohnDoe' }
        });
        assert.strictEqual(processed, 'ProjectX-report-2025-10-01-by-JohnDoe.pdf');
    });
    test('Should be case-sensitive for date variables', () => {
        const filename = 'test-$yyyy-$YYYY.txt'; // lowercase should not be processed
        const processed = variableService.processFilename(filename, {
            parentFolderName: 'test',
            currentDate: new Date('2025-10-01'),
            environment: {}
        });
        assert.ok(processed.includes('$yyyy')); // Should remain unchanged
        assert.ok(processed.includes('2025')); // $YYYY should be processed
    });
});
//# sourceMappingURL=variableService.test.js.map