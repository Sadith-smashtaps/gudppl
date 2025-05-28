import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { loginTestData } from './data/loginData';

test.describe('Login Tests', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigateToLoginPage();
    });

    test('successful login with valid credentials', async ({ page }) => {
        const { email, password } = loginTestData.validUser;
        
        await loginPage.login(email, password);
        await loginPage.verifySuccessfulLogin();
    });

    test('failed login with invalid credentials', async ({ page }) => {
        const { email, password } = loginTestData.invalidUser;
        
        await loginPage.login(email, password);
        await loginPage.verifyErrorMessage('Invalid email or password');
    });

    test('login with empty credentials', async ({ page }) => {
        await loginPage.clickContinue();
        await loginPage.verifyErrorMessage('Please enter your email and password');
    });

    test('login with invalid email format', async ({ page }) => {
        await loginPage.fillEmail('invalid-email');
        await loginPage.fillPassword('anypassword');
        await loginPage.clickContinue();
        await loginPage.verifyErrorMessage('Please enter a valid email address');
    });

    test('login with multiple test users', async ({ page }) => {
        for (const user of loginTestData.testUsers) {
            await loginPage.navigateToLoginPage();
            await loginPage.login(user.email, user.password);
            // Add appropriate assertions based on expected behavior
            // This could be success or failure depending on your test data
        }
    });
}); 