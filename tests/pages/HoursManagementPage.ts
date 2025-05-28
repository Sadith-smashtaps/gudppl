import { Page, expect } from '@playwright/test';

export class HoursManagementPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateToAddHours() {
        await this.page.getByRole('button', { name: 'Add hours' }).click();
    }

    async fillHoursForm(orgName: string, coordinatorName: string, startDate: string, endDate: string, description: string) {
        // Organization selection
        await this.page.getByPlaceholder('Host organization name').fill(orgName);
        await this.page.getByRole('heading', { name: orgName }).click();
        
        // Coordinator name
        await this.page.getByPlaceholder('Name of coordinator/supervisor').fill(coordinatorName);

        // Date selection
        await this.page.getByPlaceholder('DD/MM/YYYY').first().fill(startDate);
        await this.page.getByPlaceholder('DD/MM/YYYY').nth(1).fill(endDate);

        // Hours selection
        for (let i = 0; i < 2; i++) {
            await this.page.locator('.MuiButtonGroup-root > button').first().click();
        }
        
        for (let i = 0; i < 6; i++) {
            await this.page.locator('div:nth-child(3) > .MuiFormControl-root > .MuiInputBase-root > .MuiButtonGroup-root > button').first().click();
        }

        // Description and other details
        await this.page.getByPlaceholder('Add description').fill(description);
        await this.page.getByLabel('Remote').check();
        
        // Causes and SDGs
        await this.page.getByRole('button', { name: 'Animal welfare' }).click();
        await this.page.getByRole('button', { name: 'Zero Hunger' }).click();
        await this.page.getByRole('button', { name: 'No Poverty' }).click();

        // Skills
        await this.page.getByPlaceholder('Add skills and talents').fill('art ');
        await this.page.getByRole('option', { name: 'Art exhibitions and curation' }).click();

        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.getByRole('button', { name: 'Got it' }).click();
    }

    async verifyPendingHours(description: string, hours: string) {
        await this.page.getByRole('button', { name: 'Profile', exact: true }).click();
        await expect.soft(this.page.locator('p').filter({ hasText: 'Pending' })).toBeVisible();
        await expect.soft(this.page.getByText(description)).toBeVisible();
        await expect.soft(this.page.getByRole('heading', { name: hours })).toBeVisible();
    }

    async navigateToPendingHours() {
        await this.page.getByRole('tab', { name: 'Pending' }).click();
        await this.page.getByText('Pending').nth(1).click();
        await this.page.getByRole('heading', { name: '2h 30m' }).first().click();
        await this.page.getByText('activity description').first().click();
    }

    async approveHours() {
        await this.page.getByRole('button', { name: 'Organizations' }).click();
        await this.page.getByRole('button', { name: 'Verify Hours' }).first().click();
        await this.page.getByText('pending').nth(1).click();
        await this.page.getByRole('table', { name: 'responsive table' }).getByRole('button').first().click();
        await this.page.getByRole('button', { name: 'Approve' }).click();
        await this.page.getByRole('button', { name: 'Got it' }).click();
    }

    async verifyApprovedHours() {
        await this.page.getByText('approved').first().click();
        await this.page.getByRole('button', { name: 'Profile', exact: true }).click();
        await this.page.getByText('Verified').first().click();
        await this.page.getByRole('tab', { name: 'Approved' }).click();
        await this.page.getByText('Verified').first().click();
    }

    async navigateToOrganizationHours(orgName: string) {
        await this.page.getByRole('button', { name: 'Organizations' }).click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('table', { name: 'responsive table' }).getByText(orgName).click();
        await this.page.waitForTimeout(5000);
        await this.page.getByTestId('ChevronRightIcon').nth(1).click();
    }

    async declineHours(reason: string) {
        await this.page.getByRole('table', { name: 'responsive table' }).getByRole('button').first().click();
        await this.page.getByRole('button', { name: 'Deny' }).click();
        await this.page.getByRole('textbox').fill(reason);
        await this.page.getByRole('button', { name: 'Decline' }).click();
        await this.page.getByText('declined', { exact: true }).click();
        await this.page.waitForTimeout(3000);
    }

    async verifyDeclinedHours() {
        await this.page.getByRole('button', { name: 'Profile' }).click();
        await this.page.getByRole('paragraph').filter({ hasText: 'Declined' }).click();
        await this.page.getByText('16/09/2023 - 17/09/2023').first().click();
        await this.page.getByRole('tab', { name: 'Declined' }).click();
        await this.page.getByRole('paragraph').filter({ hasText: 'Declined' }).click();
    }

    async fillHoursFormWithAmendments(orgName: string, coordinatorName: string, startDate: string, endDate: string, description: string) {
        // Organization selection
        await this.page.getByPlaceholder('Host organization name').fill(orgName);
        await this.page.getByRole('heading', { name: orgName }).click();
        
        // Coordinator name
        await this.page.getByPlaceholder('Name of coordinator/supervisor').fill(coordinatorName);

        // Date selection
        await this.page.getByPlaceholder('DD/MM/YYYY').first().fill(startDate);
        await this.page.getByPlaceholder('DD/MM/YYYY').nth(1).fill(endDate);

        // Hours selection - Modified for amendments test
        for (let i = 0; i < 8; i++) {
            await this.page.locator('.MuiButtonGroup-root > button').first().click();
        }
        
        for (let i = 0; i < 6; i++) {
            await this.page.locator('div:nth-child(3) > .MuiFormControl-root > .MuiInputBase-root > .MuiButtonGroup-root > button').first().click();
        }

        // Description and other details
        await this.page.getByPlaceholder('Add description').fill(description);
        await this.page.getByLabel('Remote').check();
        
        // Causes and SDGs
        await this.page.getByRole('button', { name: 'Animal welfare' }).click();
        await this.page.getByRole('button', { name: 'Zero Hunger' }).click();
        await this.page.getByRole('button', { name: 'No Poverty' }).click();

        // Skills
        await this.page.getByPlaceholder('Add skills and talents').fill('art ');
        await this.page.getByRole('option', { name: 'Art exhibitions and curation' }).click();

        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.getByRole('button', { name: 'Got it' }).click();
    }

    async navigateToPendingHoursForAmendment(orgName: string) {
        await this.page.getByRole('button', { name: 'Organizations' }).click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('table', { name: 'responsive table' }).getByText(orgName).click();
        await this.page.waitForTimeout(5000);
        await this.page.getByTestId('ChevronRightIcon').nth(1).click();
        await this.page.getByRole('cell', { name: 'pending' }).getByRole('button').click();
    }

    async makeAmendments(amendedDescription: string, amendmentReason: string) {
        await this.page.getByRole('button', { name: 'Amend' }).click();
        
        // Update description and causes
        await this.page.getByPlaceholder('Add description').fill(amendedDescription);
        await this.page.getByRole('button', { name: 'Disaster relief' }).click();
        await this.page.getByRole('button', { name: 'Good Health and Well-being' }).click();

        // Add amendment reason
        await this.page.locator('textarea').nth(2).fill(amendmentReason);

        // Submit amendments
        await this.page.getByRole('button', { name: 'Amend & Approve' }).click();
        await this.page.getByRole('button', { name: 'Got it' }).click();
    }

    async verifyAmendedHours() {
        await this.page.getByRole('button', { name: 'Profile', exact: true }).click();
        await this.page.getByText('Verified').first().click();
        await this.page.getByRole('tab', { name: 'Approved' }).click();
        await this.page.getByText('Verified').first().click();
    }
} 