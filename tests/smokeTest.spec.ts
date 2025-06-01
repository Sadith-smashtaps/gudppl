import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { UserPreferencesPage } from './pages/UserPreferencesPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { HoursManagementPage } from './pages/HoursManagementPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { testData } from './data/testData';

// Define shared state at the top level
let createdOrgName: string;
let newUserEmail: string;

// Configure global timeout and retries
test.describe.configure({ 
    timeout: 120000, // 2 minutes per test
    retries: 1,      // Only retry once on failure
    mode: 'serial'   // Run tests sequentially instead of parallel
});

// Add test isolation using context
test.beforeEach(async ({ context }) => {
    // Clear cookies for test isolation
    await context.clearCookies();
    // Add logging for test start
    console.log(`Starting test: ${test.info().title}`);
});

// Add test completion logging
test.afterEach(async ({ page }, testInfo) => {
    console.log(`Completed test: ${testInfo.title} - Status: ${testInfo.status}`);
    if (testInfo.status === 'failed') {
        // Take screenshot on failure
        await page.screenshot({ path: `test-results/${testInfo.title}-failure.png`, fullPage: true });
    }
});

// Separate describe blocks for independent test groups
test.describe('User Registration', () => {
    const password = testData.signupCredentials.password;

    test('Create new user with OTP and email verification @regression', async ({ page, request }) => {
        const signupPage = new SignupPage(page);
        
        try {
            // Get webhook UUID for email verification
            const uuid = await signupPage.getWebhookUUID(request);
            newUserEmail = `${uuid}@email.webhook.site`;
            
            // Navigate and fill signup form with retry
            await signupPage.navigateToSignup();
            await signupPage.fillSignupForm(newUserEmail, password);
            
            // Get and enter OTP with timeout
            const otp = await signupPage.getOTPFromWebhook(request, uuid);
            await signupPage.enterOTP(otp);
            
            // Verify success with explicit wait
            const isVerified = await signupPage.verifyEmailSuccess();
            expect(isVerified).toBeTruthy();
            
            console.log('Successfully created user with credentials:', {
                email: newUserEmail,
                password: password
            });
        } catch (error: any) {
            if (error?.message?.includes('Exceeded daily email limit')) {
                console.warn('Cognito email limit reached. Consider configuring SES or using a different user pool for testing.');
                throw new Error('Test failed due to Cognito email limit. Please configure SES or use a different user pool for testing.');
            }
            throw error;
        }
    });
});

test.describe('User Profile and Preferences', () => {
    const password = testData.signupCredentials.password;
    const existingUserEmail = "wishu1219+183@gmail.com";

    test('Login and complete profile preferences @regression', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const preferencesPage = new UserPreferencesPage(page);
        const { firstName, lastName, dateOfBirth, phoneNumber, bio } = testData.profilePreferences;

        try {
            console.log('Starting profile preferences test...');
            
            // Login with existing user
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            await loginPage.login(existingUserEmail, password);
            
            // Wait for navigation and verify login success
            console.log('Waiting for navigation after login...');
            await page.waitForLoadState('networkidle');
            
            // Verify we're logged in
            const isLoggedIn = await page.getByRole('button', { name: 'Profile' }).isVisible();
            if (!isLoggedIn) {
                throw new Error('Login failed - Profile button not visible');
            }
            console.log('Login successful');

            // Fill all preference steps with explicit waits and logging
            console.log('Starting to fill preferences...');
            
            // Fill personal info
            console.log('Filling personal info...');
            await preferencesPage.fillPersonalInfo(
                firstName,
                lastName,
                dateOfBirth.day,
                dateOfBirth.month,
                dateOfBirth.year
            );
            console.log('Personal info filled successfully');

            // Use Promise.all for independent operations
            console.log('Selecting causes and SDGs...');
            await Promise.all([
                preferencesPage.selectCauses(),
                preferencesPage.selectSDGs()
            ]);
            console.log('Causes and SDGs selected successfully');

            console.log('Setting skills and languages...');
            await preferencesPage.setSkillsAndLanguages();
            console.log('Skills and languages set successfully');

            console.log('Setting availability...');
            await preferencesPage.setAvailability();
            console.log('Availability set successfully');

            console.log('Filling contact and location...');
            await preferencesPage.fillContactAndLocation(phoneNumber);
            console.log('Contact and location filled successfully');

            console.log('Completing profile...');
            await preferencesPage.completeProfile(bio);
            console.log('Profile completed successfully');

            // Verify welcome message with explicit wait
            console.log('Verifying welcome message...');
            const welcomeMessage = await preferencesPage.verifyWelcomeMessage(firstName);
            await expect(welcomeMessage).toHaveText(`Hello, ${firstName}. Welcome to gudppl!`);
            console.log('Welcome message verified successfully');

        } catch (error) {
            console.error('Test failed:', error);
            // Take screenshot on failure
            await page.screenshot({ path: 'test-results/profile-preferences-failure.png', fullPage: true });
            throw error;
        }
    });
});

test.describe('Organization Management', () => {
    const password = testData.signupCredentials.password;
    const existingUserEmail = "wishu1219+183@gmail.com";

    test('Create multiple organizations', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const organizationPage = new OrganizationPage(page);
        const { numberOfOrganizations, phoneNumber, randomNumberRange } = testData.organization;

        // Login with existing user
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Create multiple organizations
        for (let i = 1; i <= numberOfOrganizations; i++) {
            const randomNumber = organizationPage.getRandomNumber(randomNumberRange.min, randomNumberRange.max) + i;
            const orgName = 'Org' + randomNumber;
            createdOrgName = orgName; // Store in shared state
            console.log(`Creating organization ${i}: ${orgName}`);

            await organizationPage.navigateToOrganizations();
            await organizationPage.fillBasicInfo(orgName);
            await organizationPage.fillAboutAndContact(phoneNumber);
            await organizationPage.selectCausesAndSDGs();
            await organizationPage.fillAdditionalInfo();
            await organizationPage.verifyOrganizationCreation(orgName);

            console.log(`Organization ${orgName} created successfully.`);
        }
    });
});

test.describe('Hours Management', () => {
    const password = testData.signupCredentials.password;
    const existingUserEmail = "wishu1219+183@gmail.com";

    test('Add hours and approve', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const hoursManagementPage = new HoursManagementPage(page);
        const { coordinatorName, startDate, endDate, description, expectedHours } = testData.hoursManagement;

        // Login
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Add hours
        await hoursManagementPage.navigateToAddHours();
        await hoursManagementPage.fillHoursForm(
            createdOrgName,
            coordinatorName,
            startDate,
            endDate,
            description
        );

        // Verify pending hours
        await hoursManagementPage.verifyPendingHours(description, expectedHours);

        // Navigate to pending hours and approve
        await hoursManagementPage.navigateToPendingHours();
        await hoursManagementPage.approveHours();

        // Verify approved hours
        await hoursManagementPage.verifyApprovedHours();
    });

    test('Add hours and decline', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const hoursManagementPage = new HoursManagementPage(page);
        const { coordinatorName, startDate, endDate, description, expectedHours, declineReason } = testData.hoursManagement;

        // Login
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Add hours
        await hoursManagementPage.navigateToAddHours();
        await hoursManagementPage.fillHoursForm(
            createdOrgName,
            coordinatorName,
            startDate,
            endDate,
            description
        );

        // Navigate to organization hours and decline
        await hoursManagementPage.navigateToOrganizationHours(createdOrgName);
        await hoursManagementPage.declineHours(declineReason);

        // Verify declined hours
        await hoursManagementPage.verifyDeclinedHours();
    });

    test('Add hours with amendments', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const hoursManagementPage = new HoursManagementPage(page);
        const { coordinatorName, startDate, endDate, description } = testData.hoursManagement;

        // Login as volunteer
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Submit hours with amendments
        await hoursManagementPage.navigateToAddHours();
        await hoursManagementPage.fillHoursFormWithAmendments(
            createdOrgName,
            coordinatorName,
            startDate,
            endDate,
            'Initial hours submission for testing amendments'
        );

        // Verify pending hours
        await hoursManagementPage.verifyPendingHours('Initial hours submission for testing amendments', '8h 30m');

        // Logout as volunteer
        await loginPage.navigateToLoginPage();
        

        // Login as organization
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Navigate to pending hours and make amendments
        await hoursManagementPage.navigateToPendingHoursForAmendment(createdOrgName);
        await hoursManagementPage.makeAmendments(
            'Updated hours submission with amendments',
            'Updated causes and description to better reflect the work done'
        );

        // Verify amended hours
        await hoursManagementPage.verifyAmendedHours();

        // Logout as organization
        await loginPage.navigateToLoginPage();
    });
});

test.describe('User Profile', () => {
    const password = testData.signupCredentials.password;
    const existingUserEmail = "wishu1219+183@gmail.com";

    test('Update and verify user profile ', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const userProfilePage = new UserProfilePage(page);

        // Login
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Navigate to profile and start editing
        await userProfilePage.navigateToProfile();
        await userProfilePage.clickEditProfile();

        // Fill personal information
        await userProfilePage.fillPersonalInfo(
            'Monicaz',
            'Gellerz',
            '5',
            '5',
            '1985',
            'boy/man'
        );

        // Select causes
        await userProfilePage.selectCauses(['Education', 'People']);

        // Select SDGs
        await userProfilePage.selectSDGs(['no_poverty', 'zero_hunger', 'climate_action', 'life_water']);

        // Add skills and languages
        await userProfilePage.addSkillsAndLanguages('Marketing', ['Sinhala', 'Tamil', 'English']);

        // Set availability
        await userProfilePage.setAvailability([
            { day: 'Sunday', timeSlot: 2 },
            { day: 'Saturday', timeSlot: 2 },
            { day: 'Friday', timeSlot: 2 }
        ]);

        // Fill location and contact information
        await userProfilePage.fillLocationAndContact(
            'Sri Lanka',
            'Dehiwala-Mount Lavinia',
            '+971',
            '774611558',
            'Hi my name is Monica Gellerzzzzzzzzzzz'
        );

        // Upload profile picture
        await userProfilePage.uploadProfilePicture();

        // Verify all profile information
        await userProfilePage.verifyProfileInfo({
            name: 'Monicaz Gellerz',
            location: 'Dehiwala-Mount Lavinia, Sri Lanka',
            bio: 'Hi my name is Monica Gellerzzzzzzzzzzz',
            firstName: 'Monicaz',
            lastName: 'Gellerz',
            month: '5',
            year: '1985',
            gender: 'boy/man',
            causes: ['Education', 'People'],
            sdgs: ['no_poverty', 'zero_hunger', 'climate_action', 'life_water'],
            skills: ['Marketing'],
            availability: [
                { day: 'Monday', timeSlots: [true, true, false, false] },
                { day: 'Tuesday', timeSlots: [true, false, true, false] },
                { day: 'Wednesday', timeSlots: [true, false, false, true] },
                { day: 'Thursday', timeSlots: [false, false, false, false] },
                { day: 'Friday', timeSlots: [true, false, true, false] },
                { day: 'Saturday', timeSlots: [true, false, true, false] },
                { day: 'Sunday', timeSlots: [true, false, true, false] }
            ],
            phoneCode: '+971',
            phoneNumber: '774611558'
        });
    });
});

test.describe('Organization', () => {
    const password = testData.signupCredentials.password;
    const existingUserEmail = "wishu1219+183@gmail.com";

    test('Edit organization', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const organizationPage = new OrganizationPage(page);
        // Login
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Generate a new org name for editing
        const randomNumber = organizationPage.getRandomNumber(1, 100588);
        const orgName = 'Org1' + randomNumber;
        console.log('Editing organization to new name:', orgName);

        // Edit the organization
        await organizationPage.editOrganization({ orgName });

        // Verify organization details on the profile page
        await organizationPage.verifyOrganizationProfile({
            name: orgName,
            about: 'This is created by automation update',
            phoneNumber: '+94774444455',
            website: 'https://www.rugbyworldcup.com/2024',
            profileInformation: 'https://www.espncricinfo2024.com/',
            location: 'Castro Valley, United States'
        });
    });

    test('Access and share Impact Report @regression', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // Login
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Navigate to Impact Report
        await page.getByRole('button', { name: 'Profile', exact: true }).click();
        await page.getByRole('button', { name: 'Impact Report' }).click();
        await page.waitForLoadState('networkidle');

        // Copy and verify link sharing
        await page.getByRole('button', { name: 'Copy link' }).click();
        await expect.soft(page.getByText('Link copied to clipboard')).toBeVisible();
        await page.waitForLoadState('networkidle');
    });

    test('Login with existing user, join and leave organization @regression', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const organizationPage = new OrganizationPage(page);

        // Login with existing user
        await loginPage.navigateToLoginPage();
        await loginPage.login(existingUserEmail, password);
        await page.waitForLoadState('networkidle');

        // Join Organization
        await page.getByRole('button', { name: 'Organizations' }).click();
        await page.waitForLoadState('networkidle');

        // Search for any organization (using a partial name that should match)
        await page.getByPlaceholder('Search by name').fill('Org');
        await page.waitForLoadState('networkidle');

        // Get the first organization that appears
        const firstOrg = await page.getByRole('cell').filter({ hasText: 'Org' }).first();
        if (!firstOrg) {
            throw new Error('No organizations found matching search criteria');
        }
        
        const orgNameText = await firstOrg.textContent();
        if (!orgNameText) {
            throw new Error('Could not get organization name');
        }
        const orgName = orgNameText.trim();
        console.log('Found organization:', orgName);

        // Click the organization
        await firstOrg.click();
        await page.waitForLoadState('networkidle');

        // Join the organization
        await page.getByRole('button', { name: 'Join group' }).click();
        await page.waitForLoadState('networkidle');
        
        // Select roles
        await page.locator('input[name="isVolunteer"]').check();
        await page.locator('input[name="isDonor"]').check();
        await page.getByRole('button', { name: 'Join group' }).click();
        await page.waitForLoadState('networkidle');

        // Verify supporters list
        await page.getByRole('button', { name: 'View supporters' }).click();
        await page.waitForLoadState('networkidle');
        
        // Verify the user is in supporters list (using email prefix)
        const emailPrefix = existingUserEmail.split('@')[0];
        await expect(page.getByText(emailPrefix, { exact: false })).toBeVisible();
        await page.waitForLoadState('networkidle');
        
        await page.locator('.MuiGrid-root > .MuiButtonBase-root').first().click();
        await page.waitForLoadState('networkidle');

        // Verify organization in joined groups
        await page.getByRole('button', { name: 'Organizations' }).click();
        await page.getByRole('tab', { name: 'Groups joined' }).click();
        await page.waitForLoadState('networkidle');
        
        // Verify the organization is in joined groups
        await expect(page.getByText(orgName)).toBeVisible();
        
        // Leave organization
        await page.getByText(orgName).click();
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: 'Edit groups' }).click();
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: 'Leave group' }).click();
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: 'Yes' }).click();
        await page.waitForLoadState('networkidle');

        // Verify organization is no longer in joined groups
        await page.getByRole('button', { name: 'Organizations' }).click();
        await page.getByRole('tab', { name: 'Groups joined' }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(orgName)).not.toBeVisible();
    });

    test('Check organization list visibility for wishu1219+183@gmail.com @debug', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // Login with the specific account
        await loginPage.navigateToLoginPage();
        await loginPage.login("wishu1219+183@gmail.com", "Bachu@121989");
        await page.waitForLoadState('networkidle');

        // Navigate to Organizations
        await page.getByRole('button', { name: 'Organizations' }).click();
        await page.waitForLoadState('networkidle');

        // Check which tab is active and switch if needed
        const activeTab = (await page.getByRole('tab', { selected: true }).textContent()) || 'All organizations';
        console.log('Initial active tab:', activeTab);

        // Force switch to All organizations tab
        await page.getByRole('tab', { name: 'All organizations' }).click();
        await page.waitForLoadState('networkidle');

        // Check if table exists
        const tableExists = await page.getByRole('table', { name: 'responsive table' }).isVisible();
        console.log('Table exists:', tableExists);

        // Check if "No results found" is displayed
        const noResults = await page.getByText('No results found').isVisible();
        console.log('No results found message visible:', noResults);

        // Check if any filters are applied
        const causesFilter = (await page.getByRole('button', { name: 'All causes' }).textContent()) || 'All causes';
        const sortBy = (await page.getByRole('button', { name: 'Newest First' }).textContent()) || 'Newest First';
        console.log('Active filters:', { causes: causesFilter, sortBy });

        // Try to clear filters
        if (causesFilter !== 'All causes') {
            await page.getByRole('button', { name: causesFilter }).click();
            await page.getByRole('option', { name: 'All causes' }).click();
            await page.waitForLoadState('networkidle');
        }

        // Check if search box exists and try searching
        const searchBox = page.getByPlaceholder('Search by name');
        if (await searchBox.isVisible()) {
            await searchBox.fill('Org'); // Try searching for any organization
            await page.waitForLoadState('networkidle');
            console.log('Search results after searching "Org":', await page.getByText('No results found').isVisible() ? 'No results' : 'Results found');
        }

        // Check if we're logged in as the correct user
        await page.getByRole('button', { name: 'Profile', exact: true }).click();
        await page.waitForLoadState('networkidle');
        const userEmail = await page.getByText('wishu1219+183@gmail.com').isVisible();
        console.log('Logged in as correct user:', userEmail);

        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/org-list-debug.png', fullPage: true });

        // Log the current URL
        console.log('Current URL:', page.url());

        // Check if there are any error messages
        const errorMessages = await page.getByRole('alert').allTextContents();
        console.log('Error messages:', errorMessages);
    });
});
