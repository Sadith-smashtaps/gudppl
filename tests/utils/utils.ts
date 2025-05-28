import { Page } from '@playwright/test';

export class utils {
    constructor(private page: Page) {}
 
    async isCharacterCountMoreThan400(path: string): Promise<boolean> {
        return path.length > 400;
    }
} 