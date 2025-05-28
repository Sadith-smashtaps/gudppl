import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HoursManagementPage } from './pages/HoursManagementPage';

test.describe('Hours Amendments Flow', () => {
    test('should allow organization to amend and approve volunteer hours', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const signupPage = new SignupPage(page);
        const hoursManagementPage = new HoursManagementPage(page);

        // Login as volunteer
        await loginPage.navigateToLoginPage();
        await loginPage.login('volunteer@example.com', 'password123');

        // Submit hours
        await hoursManagementPage.navigateToAddHours();
        await hoursManagementPage.fillHoursFormWithAmendments(
            'Test Organization',
            'John Coordinator',
            '01/01/2024',
            '31/01/2024',
            'Initial hours submission for testing amendments'
        );

        // Logout as volunteer
        await page.getByRole('button', { name: 'Profile', exact: true }).click();
        await page.getByRole('button', { name: 'Logout' }).click();

        // Login as organization
        await loginPage.navigateToLoginPage();
        await loginPage.login('org@example.com', 'password123');

        // Navigate to pending hours and make amendments
        await hoursManagementPage.navigateToPendingHoursForAmendment('Test Organization');
        await hoursManagementPage.makeAmendments(
            'Updated hours submission with amendments',
            'Updated causes and description to better reflect the work done'
        );

        // Verify amended hours
        await hoursManagementPage.verifyAmendedHours();

        // Logout as organization
        await page.getByRole('button', { name: 'Profile', exact: true }).click();
        await page.getByRole('button', { name: 'Logout' }).click();
    });
}); 