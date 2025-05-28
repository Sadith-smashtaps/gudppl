import { Page } from '@playwright/test';
import { testData } from '../data/testData';

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
        await this.page.goto(`${testData.urls.baseUrl}/signup`);
    }

    async getWebhookUUID(request: any) {
        const response = await request.post(testData.urls.webhookBase);
        const responseBody = JSON.parse(await response.text());
        console.log('Created webhook with UUID:', responseBody.uuid);
        console.log('Webhook URL:', `${testData.urls.webhookBase}${responseBody.uuid}`);
        return responseBody.uuid;
    }

    async fillSignupForm(email: string, password: string) {
        console.log('Creating new user with credentials:', { email, password });
        await this.page.getByPlaceholder('Enter your email address').fill(email);
        await this.page.getByPlaceholder('Enter a new password').fill(password);
        await this.page.getByRole('checkbox').check();
        await this.page.getByRole('button', { name: 'Create account' }).click();
        console.log('Signup form submitted');
        
        // Wait for any network requests to complete
        await this.page.waitForLoadState('networkidle');
    }

    async getOTPFromWebhook(request: any, uuid: string, maxRetries = 3) {
        const webhookUrl = `${testData.urls.webhookBase}${uuid}/requests?page=1&password=&query=&sorting=oldest`;
        console.log('Checking webhook URL:', webhookUrl);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`Attempt ${attempt} of ${maxRetries} to get OTP`);
            
            // Wait between attempts
            if (attempt > 1) {
                const waitTime = 30000; // 30 seconds
                console.log(`Waiting ${waitTime/1000} seconds before next attempt...`);
                await this.page.waitForTimeout(waitTime);
            }

            const response = await request.get(webhookUrl);
            const responseBody = JSON.parse(await response.text());
            
            console.log(`Webhook response (attempt ${attempt}):`, JSON.stringify(responseBody, null, 2));
            
            if (responseBody.data && Array.isArray(responseBody.data) && responseBody.data.length > 0) {
                const firstRequest = responseBody.data[0];
                console.log('First request data:', JSON.stringify(firstRequest, null, 2));

                if (firstRequest && firstRequest.text_content) {
                    const text_content = firstRequest.text_content;
                    console.log('Email content:', text_content);
                    
                    const codeMatch = text_content.match(/\d{6}/);
                    if (codeMatch) {
                        console.log('Found OTP code:', codeMatch[0]);
                        return codeMatch[0];
                    } else {
                        console.error('No OTP code found in email content');
                    }
                } else {
                    console.error('Invalid request data:', firstRequest);
                }
            } else {
                console.log(`No data in webhook response (attempt ${attempt})`);
            }
        }

        throw new Error(`Failed to get OTP after ${maxRetries} attempts`);
    }

    async enterOTP(otp: string) {
        console.log('Entering OTP:', otp);
        const charArray = otp.split("");
        for (let i = 0; i < 6; i++) {
            await this.page.locator('input').nth(i).fill(charArray[i]);
        }
        await this.page.getByRole('button', { name: 'Submit' }).click();
        console.log('OTP submitted');
    }

    async verifyEmailSuccess() {
        console.log('Verifying email success');
        await this.page.waitForTimeout(5000);
        const isVisible = await this.page.getByText('Email Verified Successfully').isVisible();
        console.log('Email verification success:', isVisible);
        return isVisible;
    }
} 