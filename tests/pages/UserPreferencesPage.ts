import { Page, expect } from '@playwright/test';

export class UserPreferencesPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async waitForPersonalInfoForm() {
        // Wait for the form to be visible
        await this.page.waitForSelector('form', { state: 'visible', timeout: 30000 });
        
        // Wait for the first name input specifically
        const firstNameInput = this.page.getByPlaceholder('Enter your first name');
        await firstNameInput.waitFor({ state: 'visible', timeout: 30000 });
        
        // Log the current URL for debugging
        console.log('Current URL:', await this.page.url());
        
        // Verify we're on the correct page
        const isOnPreferencesPage = await this.page.getByText('Personal Information').isVisible();
        if (!isOnPreferencesPage) {
            throw new Error('Not on preferences page. Current URL: ' + await this.page.url());
        }
    }

    async fillPersonalInfo(firstName: string, lastName: string, day: string, month: string, year: string) {
        try {
            // Wait for the form to be ready
            await this.waitForPersonalInfoForm();
            
            // Fill the form with explicit waits and logging
            console.log('Filling personal info form...');
            
            const firstNameInput = this.page.getByPlaceholder('Enter your first name');
            await firstNameInput.waitFor({ state: 'visible', timeout: 30000 });
            await firstNameInput.fill(firstName);
            console.log('Filled first name');
            
            const lastNameInput = this.page.getByPlaceholder('Enter your last name');
            await lastNameInput.waitFor({ state: 'visible', timeout: 30000 });
            await lastNameInput.fill(lastName);
            console.log('Filled last name');
            
            const dayInput = this.page.getByPlaceholder('DD');
            await dayInput.waitFor({ state: 'visible', timeout: 30000 });
            await dayInput.fill(day);
            console.log('Filled day');
            
            const monthInput = this.page.getByPlaceholder('MM');
            await monthInput.waitFor({ state: 'visible', timeout: 30000 });
            await monthInput.fill(month);
            console.log('Filled month');
            
            const yearInput = this.page.getByPlaceholder('YYYY');
            await yearInput.waitFor({ state: 'visible', timeout: 30000 });
            await yearInput.fill(year);
            console.log('Filled year');
            
            // Select gender with explicit wait
            const genderCheckbox = this.page.locator('label').filter({ hasText: 'girl/woman' }).getByLabel('controlled');
            await genderCheckbox.waitFor({ state: 'visible', timeout: 30000 });
            await genderCheckbox.check();
            console.log('Selected gender');
            
            // Click next with explicit wait
            const nextButton = this.page.getByRole('button', { name: 'Next' });
            await nextButton.waitFor({ state: 'visible', timeout: 30000 });
            await nextButton.click();
            console.log('Clicked next button');
            
            // Wait for navigation
            await this.page.waitForLoadState('networkidle');
        } catch (error) {
            console.error('Error in fillPersonalInfo:', error);
            // Take screenshot on error
            await this.page.screenshot({ path: 'test-results/personal-info-error.png', fullPage: true });
            throw error;
        }
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