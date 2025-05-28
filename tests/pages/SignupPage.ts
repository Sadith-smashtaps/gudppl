import { Page } from '@playwright/test';

export class SignupPage {
    private page: Page;
    private request: any;

    // Selectors
    private readonly emailInput = 'input[placeholder="Enter your email address"]';
    private readonly passwordInput = 'input[placeholder="Enter a new password"]';
    private readonly termsCheckbox = 'input[type="checkbox"]';
    private readonly createAccountButton = 'button:has-text("Create account")';
    private readonly otpInputs = 'input';
    private readonly submitButton = 'button:has-text("Submit")';

    constructor(page: Page) {
        this.page = page;
    }

    async navigateToSignup() {
        await this.page.goto('https://next.gudppl.com/signup');
    }

    async getWebhookUUID(request: any) {
        const response = await request.post('https://webhook.site/token/');
        const responseBody = JSON.parse(await response.text());
        return responseBody.uuid;
    }

    async fillSignupForm(email: string, password: string) {
        console.log('Creating new user with credentials:', { email, password });
        await this.page.getByPlaceholder('Enter your email address').fill(email);
        await this.page.getByPlaceholder('Enter a new password').fill(password);
        await this.page.getByRole('checkbox').check();
        await this.page.getByRole('button', { name: 'Create account' }).click();
    }

    async getOTPFromWebhook(request: any, uuid: string) {
        await this.page.waitForTimeout(47000); // Wait for email to arrive
        const response = await request.get(`https://webhook.site/token/${uuid}/requests?page=1&password=&query=&sorting=oldest`);
        const responseBody = JSON.parse(await response.text());
        
        const dataArray = responseBody.data;
        let text_content = dataArray[0].text_content;
        const codeMatch = text_content.match(/\d{6}/);
        return codeMatch ? codeMatch[0] : null;
    }

    async enterOTP(otp: string) {
        const charArray = otp.split("");
        for (let i = 0; i < 6; i++) {
            await this.page.locator('input').nth(i).fill(charArray[i]);
        }
        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    async verifyEmailSuccess() {
        await this.page.waitForTimeout(5000);
        return await this.page.getByText('Email Verified Successfully').isVisible();
    }
} 