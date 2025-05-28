import { Page, expect } from '@playwright/test';
import { utils } from '../utils/utils';

export class UserProfilePage {
    constructor(private page: Page) {}

    async navigateToProfile() {
        await this.page.getByRole('button', { name: 'Profile', exact: true }).click();
    }

    async clickEditProfile() {
        await this.page.getByRole('button', { name: 'Edit profile' }).click();
        await this.page.waitForTimeout(1500);
    }

    async fillPersonalInfo(firstName: string, lastName: string, day: string, month: string, year: string, gender: 'boy/man' | 'girl/woman') {
        await this.page.getByPlaceholder('Enter your first name').fill(firstName);
        await this.page.getByPlaceholder('Enter your last name').fill(lastName);
        await this.page.getByPlaceholder('DD').fill(day);
        await this.page.getByPlaceholder('MM').fill(month);
        await this.page.getByPlaceholder('YYYY').fill(year);
        await this.page.locator('label').filter({ hasText: gender }).getByRole('checkbox', { name: 'controlled' }).check();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);
    }

    async selectCauses(causes: string[]) {
        for (const cause of causes) {
            await this.page.getByLabel(cause).check();
        }
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);
    }

    async selectSDGs(sdgs: string[]) {
        for (const sdg of sdgs) {
            await this.page.getByRole('button', { name: sdg }).click();
        }
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);
    }

    async addSkillsAndLanguages(skill: string, languages: string[]) {
        await this.page.locator("//h3[normalize-space()='Your skills & talents']/../div/div/div[2]/div[1]//*[name()='svg']").click();
        await this.page.getByPlaceholder('Add skills and talents').fill(skill);
        await this.page.getByRole('option', { name: skill, exact: true }).click();

        for (const language of languages) {
            await this.page.getByRole('row', { name: language }).getByRole('checkbox').first().check();
        }
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);
    }

    async setAvailability(days: { day: string, timeSlot: number }[], remoteWork: boolean = false) {
        for (const { day, timeSlot } of days) {
            await this.page.getByLabel(day).check();
            await this.page.getByRole('row', { name: day }).getByRole('checkbox').nth(timeSlot).check();
        }
        if (!remoteWork) {
            await this.page.locator('.MuiSwitch-root > .MuiButtonBase-root > .PrivateSwitchBase-input').uncheck();
        }
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);
    }

    async fillLocationAndContact(country: string, city: string, phoneCode: string, phoneNumber: string, bio: string) {
        await this.page.getByRole('button', { name: 'Open' }).click();
        await this.page.getByPlaceholder('Select your country').fill(country);
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('option', { name: country }).click();

        const dropDownXPath = "//label[normalize-space()='Country']/../..//div[2]//div//div//div//div[2]";
        const dropDownElement = await this.page.locator(dropDownXPath);
        await dropDownElement.click();

        const dropDownType = "//label[normalize-space()='Country']/../..//div[2]//div//div//div//div[2]//input";
        const dropDownElementType = await this.page.locator(dropDownType);
        await dropDownElementType.fill(city);
        await this.page.waitForTimeout(1000);
        await this.page.getByText(city, { exact: true }).click({ timeout: 3000 });

        await this.page.getByPlaceholder('Write few sentences about you').fill(bio);

        // Check current phone code and only change if different
        const currentPhoneCode = await this.page.getByRole('button', { name: /^\+\d+$/ }).textContent() || '+94';
        if (currentPhoneCode !== phoneCode) {
            await this.page.getByRole('button', { name: currentPhoneCode }).click();
            await this.page.waitForSelector('[role="listbox"]');
            await this.page.getByRole('option', { name: phoneCode }).click();
        }

        await this.page.getByPlaceholder('Your phone number').fill(phoneNumber);
        await this.page.getByRole('button', { name: 'Complete' }).click();
        await this.page.waitForTimeout(1000);
    }

    async uploadProfilePicture() {
        await this.navigateToProfile();
        await this.page.locator('.css-1gcqr0l > .MuiButtonBase-root').click();
        await this.page.getByRole('img', { name: '/images/profilePictures/ambulance.png' }).click();
        await expect.soft(this.page.getByText('Profile picture uploaded successfully')).toHaveText("Profile picture uploaded successfully");
        await this.page.waitForTimeout(1500);
    }

    async verifyProfileInfo(expectedInfo: {
        name: string,
        location: string,
        bio: string,
        firstName: string,
        lastName: string,
        month: string,
        year: string,
        gender: string,
        causes: string[],
        sdgs: string[],
        skills: string[],
        availability: { day: string, timeSlots: boolean[] }[],
        phoneCode: string,
        phoneNumber: string
    }) {
        // Verify basic info
        await expect.soft(this.page.getByText(expectedInfo.location)).toHaveText(expectedInfo.location);
        await expect.soft(this.page.getByText(expectedInfo.bio)).toHaveText(expectedInfo.bio);
        await expect.soft(this.page.locator('h2')).toHaveText(expectedInfo.name);

        // Verify edit profile form
        await this.clickEditProfile();
        await expect.soft(this.page.getByPlaceholder('Enter your first name')).toHaveValue(expectedInfo.firstName);
        await expect.soft(this.page.getByPlaceholder('Enter your last name')).toHaveValue(expectedInfo.lastName);
        await expect.soft(this.page.getByPlaceholder('MM')).toHaveValue(expectedInfo.month);
        await expect.soft(this.page.getByPlaceholder('YYYY')).toHaveValue(expectedInfo.year);
        expect.soft(await this.page.locator('label').filter({ hasText: expectedInfo.gender }).getByRole('checkbox', { name: 'controlled' }).isChecked()).toBeTruthy();

        // Verify causes
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);
        for (const cause of expectedInfo.causes) {
            expect.soft(await this.page.getByLabel(cause).isChecked()).toBeTruthy();
        }

        // Skip SDG verification and move to skills
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);

        // Verify skills
        await this.page.waitForSelector('h3:has-text("Your skills & talents")');
        for (const skill of expectedInfo.skills) {
            expect.soft(await this.page.locator(`//span[normalize-space()='${skill}']`).isVisible()).toBeTruthy();
        }

        // Verify availability
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(3500);
        for (const { day, timeSlots } of expectedInfo.availability) {
            const dayCheckbox = this.page.getByRole('row', { name: day }).getByRole('checkbox').first();
            const isChecked = await dayCheckbox.isChecked();
            expect.soft(isChecked).toBe(timeSlots[0]); // First timeSlot represents the day checkbox

            // Verify time slots
            for (let i = 1; i < timeSlots.length; i++) {
                const timeSlotCheckbox = this.page.getByRole('row', { name: day }).getByRole('checkbox').nth(i);
                expect.soft(await timeSlotCheckbox.isChecked()).toBe(timeSlots[i]);
            }
        }

        // Verify contact info
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1000);
        expect.soft(await this.page.locator(`//input[@value='${expectedInfo.phoneCode}']`)).toHaveValue(expectedInfo.phoneCode);
        await expect.soft(this.page.getByPlaceholder('Your phone number')).toHaveValue(expectedInfo.phoneNumber);
    }
} 