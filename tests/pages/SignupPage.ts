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
        
        // Enable request logging
        this.page.on('request', request => {
            console.log(`>> ${request.method()} ${request.url()}`);
        });
        
        this.page.on('response', response => {
            console.log(`<< ${response.status()} ${response.url()}`);
            if (response.status() >= 400) {
                response.text().then(text => {
                    console.error(`Error response for ${response.url()}:`, text);
                });
            }
        });
    }

    async getWebhookUUID(request: any) {
        try {
            const response = await request.post(testData.urls.webhookBase);
            const responseBody = JSON.parse(await response.text());
            console.log('Created webhook with UUID:', responseBody.uuid);
            console.log('Webhook URL:', `${testData.urls.webhookBase}${responseBody.uuid}`);
            return responseBody.uuid;
        } catch (error) {
            console.error('Failed to create webhook:', error);
            throw error;
        }
    }

    async fillSignupForm(email: string, password: string) {
        try {
            console.log('Starting signup process for:', { email });
            
            // Wait for the form to be ready
            await this.page.waitForSelector(this.emailInput, { state: 'visible', timeout: 10000 });
            await this.page.waitForSelector(this.passwordInput, { state: 'visible', timeout: 10000 });
            
            // Clear any existing values
            await this.page.getByPlaceholder('Enter your email address').clear();
            await this.page.getByPlaceholder('Enter a new password').clear();
            
            // Fill the form with explicit waits
            await this.page.getByPlaceholder('Enter your email address').fill(email);
            await this.page.getByPlaceholder('Enter a new password').fill(password);
            await this.page.getByRole('checkbox').check();
            
            // Log the form state before submission
            console.log('Form state before submission:', {
                email: await this.page.getByPlaceholder('Enter your email address').inputValue(),
                passwordLength: (await this.page.getByPlaceholder('Enter a new password').inputValue()).length,
                termsChecked: await this.page.getByRole('checkbox').isChecked()
            });
            
            // Wait for the button to be enabled
            const createAccountButton = this.page.getByRole('button', { name: 'Create account' });
            await createAccountButton.waitFor({ state: 'visible', timeout: 5000 });
            
            // Start waiting for navigation before clicking
            const navigationPromise = this.page.waitForURL('**/verify-email', { timeout: 30000 });
            
            // Submit the form
            console.log('Clicking create account button...');
            await createAccountButton.click();
            
            // Wait for navigation
            console.log('Waiting for navigation to verify-email page...');
            try {
                await navigationPromise;
                console.log('Successfully navigated to verify-email page');
            } catch (error) {
                // If navigation fails, check for error messages
                const errorMessages = await this.page.getByRole('alert').allTextContents();
                if (errorMessages.length > 0) {
                    console.error('Error messages after signup:', errorMessages);
                    throw new Error(`Signup failed: ${errorMessages.join(', ')}`);
                }
                
                // Check current URL
                const currentUrl = this.page.url();
                console.error('Navigation failed. Current URL:', currentUrl);
                
                // Check if we're still on the signup page
                if (currentUrl.includes('/signup')) {
                    // Check for any network errors
                    const failedRequests = await this.page.evaluate(() => {
                        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
                        return entries
                            .filter(entry => entry.name.includes('/api/') && entry.duration > 5000)
                            .map(entry => ({
                                url: entry.name,
                                duration: entry.duration,
                                type: entry.initiatorType
                            }));
                    });
                    
                    if (failedRequests.length > 0) {
                        console.error('Slow or failed API requests:', failedRequests);
                    }
                    
                    throw new Error(`Expected to be redirected to verify-email page, but got: ${currentUrl}. Check network requests for errors.`);
                }
            }
            
            // Final verification
            const finalUrl = this.page.url();
            if (!finalUrl.includes('/verify-email')) {
                throw new Error(`Expected to be on verify-email page, but got: ${finalUrl}`);
            }
            
            console.log('Signup form submitted successfully');
        } catch (error) {
            console.error('Error during signup:', error);
            
            // Take a screenshot for debugging
            await this.page.screenshot({ 
                path: `signup-error-${Date.now()}.png`,
                fullPage: true 
            });
            
            throw error;
        }
    }

    async getOTPFromWebhook(request: any, uuid: string, maxRetries = 3) {
        const webhookUrl = `${testData.urls.webhookBase}${uuid}/requests?page=1&password=&query=&sorting=oldest`;
        console.log('Checking webhook URL:', webhookUrl);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`Attempt ${attempt} of ${maxRetries} to get OTP`);
            
            try {
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
            } catch (error) {
                console.error(`Error during attempt ${attempt}:`, error);
            }
        }

        // If we get here, all attempts failed
        console.error('All attempts to get OTP failed');
        throw new Error(`Failed to get OTP after ${maxRetries} attempts`);
    }

    async enterOTP(otp: string) {
        try {
            console.log('Entering OTP:', otp);
            const charArray = otp.split("");
            for (let i = 0; i < 6; i++) {
                await this.page.locator('input').nth(i).fill(charArray[i]);
            }
            await this.page.getByRole('button', { name: 'Submit' }).click();
            console.log('OTP submitted');
            
            // Wait for any network requests to complete
            await this.page.waitForLoadState('networkidle');
            
            // Check for any error messages
            const errorMessages = await this.page.getByRole('alert').allTextContents();
            if (errorMessages.length > 0) {
                console.error('Error messages after OTP submission:', errorMessages);
                throw new Error(`OTP verification failed: ${errorMessages.join(', ')}`);
            }
        } catch (error) {
            console.error('Error during OTP entry:', error);
            throw error;
        }
    }

    async verifyEmailSuccess() {
        try {
            console.log('Verifying email success');
            await this.page.waitForTimeout(5000);
            const isVisible = await this.page.getByText('Email Verified Successfully').isVisible();
            console.log('Email verification success:', isVisible);
            
            if (!isVisible) {
                // Check for any error messages
                const errorMessages = await this.page.getByRole('alert').allTextContents();
                if (errorMessages.length > 0) {
                    console.error('Error messages during verification:', errorMessages);
                }
            }
            
            return isVisible;
        } catch (error) {
            console.error('Error during email verification:', error);
            throw error;
        }
    }
} 