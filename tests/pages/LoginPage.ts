import { Page, expect } from '@playwright/test';

export class LoginPage {
    private page: Page;

    // Selectors using role-based locators for better reliability
    private readonly selectors = {
        emailInput: 'input[placeholder="Enter your email address"]',
        passwordInput: 'input[placeholder="Enter your password"]',
        continueButton: 'button:has-text("Continue")',
        errorMessage: '[data-testid="error-message"]'
    };

    constructor(page: Page) {
        this.page = page;
    }

    async navigateToLoginPage() {
        await this.page.goto('https://next.gudppl.com');
        await this.page.waitForLoadState('networkidle');
    }

    async fillEmail(email: string) {
        await this.page.getByPlaceholder('Enter your email address').click();
        await this.page.getByPlaceholder('Enter your email address').fill(email);
    }

    async fillPassword(password: string) {
        await this.page.getByPlaceholder('Enter your password').fill(password);
    }

    async clickContinue() {
        await this.page.getByRole('button', { name: 'Continue', exact: true }).click();
    }

    async login(email: string, password: string) {
        console.log('Logging in with credentials:', { email });
        await this.fillEmail(email);
        await this.fillPassword(password);
        await this.clickContinue();
        await this.page.waitForLoadState('networkidle');
    }

    async verifyErrorMessage(expectedMessage: string) {
        const errorElement = await this.page.locator(this.selectors.errorMessage);
        await expect(errorElement).toBeVisible();
        await expect(errorElement).toHaveText(expectedMessage);
    }

    async verifySuccessfulLogin() {
        // Wait for navigation after successful login
        await this.page.waitForURL('**/dashboard');
        // Verify we're on the dashboard
        await expect(this.page).toHaveURL(/.*dashboard/);
    }
} 