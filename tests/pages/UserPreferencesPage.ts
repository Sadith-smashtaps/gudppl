import { Page } from '@playwright/test';

export class UserPreferencesPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async fillPersonalInfo(firstName: string, lastName: string, day: string, month: string, year: string) {
        await this.page.getByPlaceholder('Enter your first name').fill(firstName);
        await this.page.getByPlaceholder('Enter your last name').fill(lastName);
        await this.page.getByPlaceholder('DD').fill(day);
        await this.page.getByPlaceholder('MM').fill(month);
        await this.page.getByPlaceholder('YYYY').fill(year);
        await this.page.locator('label').filter({ hasText: 'girl/woman' }).getByLabel('controlled').check();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(3400);
    }

    async selectCauses() {
        await this.page.getByLabel('Animal welfare').check();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(4000);
    }

    async selectSDGs() {
        await this.page.getByRole('button', { name: 'climate_action' }).click();
        await this.page.getByRole('button', { name: 'life_water' }).click();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(3400);
    }

    async setSkillsAndLanguages() {
        await this.page.getByPlaceholder('Add skills and talents').fill('Account');
        await this.page.getByRole('option', { name: 'Accounting', exact: true }).click();
        await this.page.getByRole('row', { name: 'English' }).getByRole('checkbox').nth(1).check();
        await this.page.getByRole('row', { name: 'Sinhala delete' }).getByRole('checkbox').nth(3).check();
        await this.page.getByRole('row', { name: 'Tamil delete' }).getByRole('checkbox').nth(4).check();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(3400);
    }

    async setAvailability() {
        await this.page.getByRole('row', { name: 'Monday' }).getByRole('checkbox').nth(1).check();
        await this.page.getByRole('row', { name: 'Tuesday' }).getByRole('checkbox').nth(2).check();
        await this.page.getByRole('row', { name: 'Wednesday' }).getByRole('checkbox').nth(3).check();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(4000);
    }

    async fillContactAndLocation(phoneNumber: string) {
        await this.page.getByPlaceholder('Your phone number').fill(phoneNumber);
        await this.page.getByLabel('Open').click();
        await this.page.getByPlaceholder('Select your country').fill('Sri');
        await this.page.getByRole('option', { name: 'Sri Lanka' }).click();

        const dropDownXPath = "//label[normalize-space()='Country']/../..//div[2]//div//div//div//div[2]";
        await this.page.locator(dropDownXPath).click();
        
        const dropDownType = "//label[normalize-space()='Country']/../..//div[2]//div//div//div//div[2]//input";
        await this.page.locator(dropDownType).fill('Colombo');
        await this.page.getByText('Colombo', { exact: true }).click({ timeout: 3000 });
    }

    async completeProfile(bio: string) {
        await this.page.getByPlaceholder('Write few sentences about you').fill(bio);
        await this.page.getByRole('button', { name: 'Complete' }).click();
        await this.page.waitForTimeout(3500);
    }

    async verifyWelcomeMessage(firstName: string) {
        return this.page.getByRole('heading', { name: `Hello, ${firstName}. Welcome to gudppl!` });
    }
} 