import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { UserPreferencesPage } from './pages/UserPreferencesPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { HoursManagementPage } from './pages/HoursManagementPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { testData } from './data/testData';

// Define test users at the top level for clarity
const TEST_USERS = {
    EXISTING_USER: {
        email: "wishu1219+183@gmail.com",
        password: "Bachu@121989",
        description: "Existing test user for organization join/leave test"
    }
} as const;

// Define shared state at the top level
let createdOrgName: string;
let newUserEmail: string;  // This will store the email of the newly created user
let newUserPassword: string = testData.signupCredentials.password;  // Store the password for the new user

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
    test('Create new user with OTP and email verification @regression', async ({ page, request }) => {
        const signupPage = new SignupPage(page);
        
        try {
            // Get webhook UUID for email verification
            const uuid = await signupPage.getWebhookUUID(request);
            newUserEmail = `${uuid}@email.webhook.site`;
            console.log('Created new test user:', { email: newUserEmail, password: newUserPassword });
            
            // Navigate and fill signup form with retry
            await signupPage.navigateToSignup();
            await signupPage.fillSignupForm(newUserEmail, newUserPassword);
            
            // Get and enter OTP with timeout and verification
            console.log('Waiting for OTP...');
            const otp = await signupPage.getOTPFromWebhook(request, uuid);
            console.log('Received OTP, entering...');
            await signupPage.enterOTP(otp);
            
            // Verify success with explicit wait and additional checks
            console.log('Verifying email success...');
            const isVerified = await signupPage.verifyEmailSuccess();
            expect(isVerified).toBeTruthy();
            
            // Additional verification - try to log in immediately after verification
            console.log('Attempting immediate login after verification...');
            const loginPage = new LoginPage(page);
            await loginPage.navigateToLoginPage();
            await loginPage.login(newUserEmail, newUserPassword);
            
            // Wait for navigation and verify login success
            await page.waitForLoadState('networkidle');
            const isLoggedIn = await page.getByRole('button', { name: 'Profile' }).isVisible();
            if (!isLoggedIn) {
                console.error('Initial login verification failed');
                console.log('Current URL:', await page.url());
                console.log('Page content:', await page.content());
                throw new Error('Initial login verification failed after user creation');
            }
            console.log('Initial login verification successful');
            
            // Logout to ensure clean state for subsequent tests
            await page.getByRole('button', { name: 'Profile' }).click();
            await page.getByRole('button', { name: 'Logout' }).click();
            await page.waitForLoadState('networkidle');
            
            console.log('Successfully created, verified, and tested login for new user:', {
                email: newUserEmail,
                password: newUserPassword
            });
        } catch (error: any) {
            if (error?.message?.includes('Exceeded daily email limit')) {
                console.warn('Cognito email limit reached. Consider configuring SES or using a different user pool for testing.');
                throw new Error('Test failed due to Cognito email limit. Please configure SES or use a different user pool for testing.');
            }
            console.error('User creation/verification failed:', error);
            await page.screenshot({ path: 'test-results/user-creation-failure.png', fullPage: true });
            throw error;
        }
    });
});

test.describe('User Profile and Preferences', () => {
    test('Login and complete profile preferences @regression', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const preferencesPage = new UserPreferencesPage(page);
        const { firstName, lastName, dateOfBirth, phoneNumber, bio } = testData.profilePreferences;

        try {
            console.log(`Starting profile preferences test with newly created user: ${newUserEmail}`);
            
            // Login with newly created user with retry
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            console.log(`Attempting login with email: ${newUserEmail}`);
            
            // Add retry logic for login
            let loginAttempts = 0;
            const maxLoginAttempts = 3;
            let loginSuccessful = false;
            
            while (loginAttempts < maxLoginAttempts && !loginSuccessful) {
                try {
                    await loginPage.login(newUserEmail, newUserPassword);
                    await page.waitForLoadState('networkidle');
                    
                    // Verify login success
                    const isLoggedIn = await page.getByRole('button', { name: 'Profile' }).isVisible();
                    if (isLoggedIn) {
                        loginSuccessful = true;
                        console.log(`Login successful on attempt ${loginAttempts + 1}`);
                        break;
                    }
                    
                    console.log(`Login attempt ${loginAttempts + 1} failed - Profile button not visible`);
                    if (loginAttempts < maxLoginAttempts - 1) {
                        console.log('Waiting before retry...');
                        await page.waitForTimeout(5000); // Wait 5 seconds before retry
                    }
                } catch (error) {
                    console.error(`Login attempt ${loginAttempts + 1} failed:`, error);
                    if (loginAttempts < maxLoginAttempts - 1) {
                        console.log('Waiting before retry...');
                        await page.waitForTimeout(5000);
                    }
                }
                loginAttempts++;
            }
            
            if (!loginSuccessful) {
                console.error('All login attempts failed');
                console.log('Current URL:', await page.url());
                console.log('Page content:', await page.content());
                await page.screenshot({ path: 'test-results/login-failure.png', fullPage: true });
                throw new Error(`Login failed after ${maxLoginAttempts} attempts for user ${newUserEmail}`);
            }

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
            await page.screenshot({ path: 'test-results/profile-preferences-failure.png', fullPage: true });
            throw error;
        }
    });
});

test.describe('Organization Management', () => {
    test('Create multiple organizations', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const organizationPage = new OrganizationPage(page);
        const { numberOfOrganizations, phoneNumber, randomNumberRange } = testData.organization;

        try {
            console.log(`Starting organization creation test with newly created user: ${newUserEmail}`);
            
            // Login with newly created user
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            console.log(`Attempting login with email: ${newUserEmail}`);
            await loginPage.login(newUserEmail, newUserPassword);
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
        } catch (error) {
            console.error('Test failed:', error);
            await page.screenshot({ path: 'test-results/org-creation-failure.png', fullPage: true });
            throw error;
        }
    });
});

test.describe('Hours Management', () => {
    test('Add hours and approve', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const hoursManagementPage = new HoursManagementPage(page);
        const { coordinatorName, startDate, endDate, description, expectedHours } = testData.hoursManagement;

        try {
            console.log(`Starting hours approval test with newly created user: ${newUserEmail}`);
            
            // Login with newly created user
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            console.log(`Attempting login with email: ${newUserEmail}`);
            await loginPage.login(newUserEmail, newUserPassword);
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
        } catch (error) {
            console.error('Test failed:', error);
            await page.screenshot({ path: 'test-results/hours-approval-failure.png', fullPage: true });
            throw error;
        }
    });

    test('Add hours and decline', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const hoursManagementPage = new HoursManagementPage(page);
        const { coordinatorName, startDate, endDate, description, expectedHours, declineReason } = testData.hoursManagement;

        // Login
        await loginPage.navigateToLoginPage();
        await loginPage.login(newUserEmail, newUserPassword);
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
        await loginPage.login(newUserEmail, newUserPassword);
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
        await loginPage.login(newUserEmail, newUserPassword);
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
    test('Update and verify user profile', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const userProfilePage = new UserProfilePage(page);

        try {
            console.log(`Starting profile update test with newly created user: ${newUserEmail}`);
            
            // Login with newly created user
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            console.log(`Attempting login with email: ${newUserEmail}`);
            await loginPage.login(newUserEmail, newUserPassword);
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
        } catch (error) {
            console.error('Test failed:', error);
            await page.screenshot({ path: 'test-results/profile-update-failure.png', fullPage: true });
            throw error;
        }
    });
});

test.describe('Organization', () => {
    test('Login with existing user, join and leave organization @regression', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const organizationPage = new OrganizationPage(page);

        try {
            console.log(`Starting organization join/leave test with existing user: ${TEST_USERS.EXISTING_USER.email}`);
            
            // Login with existing user
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            console.log(`Attempting login with email: ${TEST_USERS.EXISTING_USER.email}`);
            await loginPage.login(TEST_USERS.EXISTING_USER.email, TEST_USERS.EXISTING_USER.password);
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
            const emailPrefix = TEST_USERS.EXISTING_USER.email.split('@')[0];
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
        } catch (error) {
            console.error('Test failed:', error);
            await page.screenshot({ path: 'test-results/org-join-leave-failure.png', fullPage: true });
            throw error;
        }
    });

    test('Edit organization', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const organizationPage = new OrganizationPage(page);

        try {
            console.log(`Starting organization edit test with newly created user: ${newUserEmail}`);
            
            // Login with newly created user
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            console.log(`Attempting login with email: ${newUserEmail}`);
            await loginPage.login(newUserEmail, newUserPassword);
            
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
        } catch (error) {
            console.error('Test failed:', error);
            await page.screenshot({ path: 'test-results/org-edit-failure.png', fullPage: true });
            throw error;
        }
    });

    test('Access and share Impact Report @regression', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // Login
        await loginPage.navigateToLoginPage();
        await loginPage.login(TEST_USERS.EXISTING_USER.email, TEST_USERS.EXISTING_USER.password);
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

    test('Check organization list visibility for wishu1219+183@gmail.com @debug', async ({ page }) => {
        const loginPage = new LoginPage(page);

        try {
            console.log(`Starting organization list visibility test with user: ${TEST_USERS.EXISTING_USER.email} (${TEST_USERS.EXISTING_USER.description})`);
            
            // Login with the specific account
            console.log('Logging in...');
            await loginPage.navigateToLoginPage();
            console.log(`Attempting login with email: ${TEST_USERS.EXISTING_USER.email}`);
            await loginPage.login(TEST_USERS.EXISTING_USER.email, TEST_USERS.EXISTING_USER.password);
            await page.waitForLoadState('networkidle');

            // Take screenshot after login
            await page.screenshot({ path: 'test-results/org-list-post-login.png', fullPage: true });

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
        } catch (error) {
            console.error('Test failed:', error);
            await page.screenshot({ path: 'test-results/org-list-failure.png', fullPage: true });
            throw error;
        }
    });
});
