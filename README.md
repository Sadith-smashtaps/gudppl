# GUDPPL - Automated Testing Suite

This repository contains the automated testing suite for the GUDPPL application using Playwright.

## 🚀 Features

- End-to-end testing of user registration and login flows
- Organization management testing (create, join, leave)
- Profile management and preferences testing
- Hours management testing
- Impact report testing

## 🛠️ Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 📦 Installation

1. Clone the repository:
```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/gudppl.git
cd gudppl
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## 🧪 Running Tests

Run all tests:
```bash
npx playwright test
```

Run tests in headed mode (with browser UI):
```bash
npx playwright test --headed
```

Run specific test file:
```bash
npx playwright test tests/smokeTest.spec.ts
```

Run tests with specific tag:
```bash
npx playwright test -g "@regression"
```

## 📝 Test Structure

- `tests/smokeTest.spec.ts` - Main test suite containing:
  - User registration and login flows
  - Organization management
  - Profile management
  - Hours management
  - Impact report testing

- `tests/pages/` - Page Object Models for:
  - LoginPage
  - SignupPage
  - UserPreferencesPage
  - OrganizationPage
  - HoursManagementPage
  - UserProfilePage

## 🔧 Configuration

- `playwright.config.ts` - Playwright configuration
- `tests/data/testData.ts` - Test data and credentials

## 📊 Test Reports

View test reports:
```bash
npx playwright show-report
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- [YOUR_NAME] - Initial work

## 🙏 Acknowledgments

- GUDPPL Team
- Playwright Team 