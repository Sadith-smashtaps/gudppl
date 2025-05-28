import { Page, expect } from '@playwright/test';

export class OrganizationPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateToOrganizations() {
        await this.page.getByRole('button', { name: 'Organizations' }).click();
        await this.page.getByRole('button', { name: 'Create an organization' }).click();
    }

    async fillBasicInfo(orgName: string) {
        await this.page.getByPlaceholder('Enter organization name').fill(orgName);
        await this.page.getByLabel('BusinessSmall/medium business, company, or multi-national company').check();
        await this.page.getByLabel('Yes').check();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(500);
    }

    async fillAboutAndContact(phoneNumber: string) {
        await this.page.getByPlaceholder('Who we are and the positive impact we wish to make in the community')
            .fill('This is created by automation');
        await this.page.getByPlaceholder('Your phone number').fill(phoneNumber);
        
        // Country selection
        await this.page.getByRole('button', { name: 'Open' }).click();
        await this.page.getByPlaceholder('Select your country').fill('Sri lanka');
        await this.page.getByRole('option', { name: 'Sri Lanka' }).click();
        await this.page.waitForTimeout(500);

        // Location selection
        await this.page.locator("//span[normalize-space()='Location *']/../div/div[2]//div//div//div//div[2]").click();
        await this.page.locator("//span[normalize-space()='Location *']/../div/div[2]//div//div//div//div[2]//input")
            .fill('Dehiwala');
        await this.page.waitForTimeout(500);
        await this.page.getByText('Dehiwala-Mount Lavinia', { exact: true }).click();
    }

    async selectCausesAndSDGs() {
        // Select causes
        await this.page.getByText('Animal welfare').click();
        await this.page.getByText('Education').click();
        await this.page.getByText('People').click();

        // Select SDGs
        await this.page.getByRole('button', { name: 'No Poverty' }).click();
        await this.page.getByRole('button', { name: 'Clean Water and Sanitation' }).click();
        await this.page.getByRole('button', { name: 'Sustainable Cities and Communities' }).click();
        await this.page.getByRole('button', { name: 'Peace, Justice and Strong Institutions' }).click();
        await this.page.getByRole('button', { name: 'Next' }).click();
    }

    async fillAdditionalInfo() {
        await this.page.getByLabel('51-100').check();
        await this.page.locator('input[name="website"]').fill('https://www.rugbyworldcup.com/2024');
        await this.page.locator('input[name="profileInformation"]').fill('https://www.espncricinfo.com/');
        await this.page.getByLabel('I verify that I am an authorized representative of this organization and have the right to act on its behalf in the creation and management of this profile. The organization and I agree to gudppl\'s Terms & Conditions.').check();
        await this.page.getByRole('button', { name: 'Complete' }).click();
        await this.page.getByRole('button', { name: 'Got it' }).click();
        await this.page.waitForTimeout(500);
    }

    async verifyOrganizationCreation(orgName: string) {
        // Verify organization name is visible
        await expect.soft(this.page.getByText(orgName)).toBeVisible();
        
        // Verify organization type
        expect.soft(this.page.getByRole('cell', { name: `groupIcon ${orgName} Business` }).getByText('Business')).not.toBeNull();
        
        // Verify causes
        expect.soft(
            await this.page.getByRole('row', { name: `groupIcon ${orgName} Business Animal welfare Education People 0 hours 1` })
                      .getByRole('cell', { name: 'Animal welfare Education People' })
        ).not.toBeNull();
        
        // Verify hours
        expect.soft(
            await this.page.getByRole('row', { name: `groupIcon ${orgName} Business Animal welfare Education People 0 hours 1` })
                      .getByText('0 hours')
        ).not.toBeNull();
        
        // Verify member count
        expect.soft(
            await this.page.getByRole('row', { name: `groupIcon ${orgName} Business Animal welfare Education People 0 hours 1` })
                      .getByText('1', { exact: true })
        ).not.toBeNull();
    }

    getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Edit an existing organization with the provided details and verify the update.
     */
    async editOrganization({
        orgName,
        phoneNumber = '774444455',
        country = 'United States',
        city = 'Castro Valley',
        about = 'This is created by automation update',
        website = 'https://www.rugbyworldcup.com/2024',
        profileInformation = 'https://www.espncricinfo2024.com/',
        causes = ['Disaster relief', 'Animal welfare'],
        sdgs = [
            'No Poverty',
            'Zero Hunger',
            'Good Health and Well-being',
            'Clean Water and Sanitation',
            'Sustainable Cities and Communities',
            'Peace, Justice and Strong Institutions'
        ],
        sizeLabel = '1-50',
        acceptTerms = false
    }: {
        orgName: string,
        phoneNumber?: string,
        country?: string,
        city?: string,
        about?: string,
        website?: string,
        profileInformation?: string,
        causes?: string[],
        sdgs?: string[],
        sizeLabel?: string,
        acceptTerms?: boolean
    }) {
        // Go to Organizations and open the first org for editing
        await this.page.getByRole('button', { name: 'Organizations' }).click();
        await this.page.locator('.MuiGrid-root > button').first().click();
        await this.page.getByRole('button', { name: 'Edit Organization' }).click();
        
        // Step 1: Basic Info
        await this.page.getByPlaceholder('Enter organization name').click();
        await this.page.getByPlaceholder('Enter organization name').fill(orgName);
        await this.page.getByText('Association, club/society, or community group').click();
        await this.page.getByLabel('No', { exact: true }).check();
        await this.page.locator('div').filter({ hasText: /^BackNext$/ }).first().click();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);

        // Step 2: About & Contact
        await this.page.getByPlaceholder('Who we are and the positive impact we wish to make in the community').click();
        await this.page.getByPlaceholder('Who we are and the positive impact we wish to make in the community').fill(about);
        await this.page.getByPlaceholder('Your phone number').click();
        await this.page.getByPlaceholder('Your phone number').fill(phoneNumber);
        await this.page.getByRole('button', { name: 'Open' }).click();
        await this.page.getByPlaceholder('Select your country').fill(country.slice(0, 3));
        await this.page.getByRole('option', { name: country, exact: true }).click();
        await this.page.locator('#react-select-3-input').fill(city.slice(0, 3));
        await this.page.getByText(city, { exact: true }).click();
        for (const cause of causes) {
            await this.page.getByRole('button', { name: cause }).click();
        }
        for (const sdg of sdgs) {
            await this.page.getByRole('button', { name: sdg }).click();
        }
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.waitForTimeout(1500);

        // Step 3: Additional Info
        await this.page.getByLabel('I verify that I am an authorized representative of this organization and have the right to act on its behalf in the creation and management of this profile. The organization and I agree to gudppl\'s Terms & Conditions.').uncheck();
        await this.page.getByRole('button', { name: 'Update' }).click();
        // Accept terms if required
        if (!acceptTerms) {
            await this.page.getByLabel('I verify that I am an authorized representative of this organization and have the right to act on its behalf in the creation and management of this profile. The organization and I agree to gudppl\'s Terms & Conditions.Please accept the terms and conditions').check();
        }
        await this.page.getByLabel(sizeLabel, { exact: true }).check();
        await this.page.locator('input[name="website"]').click();
        await this.page.locator('input[name="website"]').fill(website);
        await this.page.locator('input[name="profileInformation"]').click();
        await this.page.locator('input[name="profileInformation"]').fill(profileInformation);
        await this.page.getByRole('button', { name: 'Update' }).click();
    }

    async verifyOrganizationProfile(expectedInfo: {
        name: string,
        about?: string,
        phoneNumber?: string,
        website?: string,
        profileInformation?: string,
        location?: string
    }) {
        // Verify organization name
        await expect.soft(this.page.getByRole('heading', { name: expectedInfo.name, level: 2 })).toBeVisible();
        
        if (expectedInfo.about) {
            await expect.soft(this.page.getByText(expectedInfo.about)).toBeVisible();
        }
        
        if (expectedInfo.phoneNumber) {
            await expect.soft(this.page.getByText(expectedInfo.phoneNumber)).toBeVisible();
        }
        
        if (expectedInfo.website) {
            await expect.soft(this.page.getByRole('link', { name: new RegExp(expectedInfo.website.slice(0, 20)) })).toBeVisible();
        }
        
        if (expectedInfo.profileInformation) {
            await expect.soft(this.page.getByRole('link', { name: new RegExp(expectedInfo.profileInformation.slice(0, 20)) })).toBeVisible();
        }
        
        if (expectedInfo.location) {
            await expect.soft(this.page.getByText(expectedInfo.location)).toBeVisible();
        }
    }
} 