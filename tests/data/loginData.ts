export interface LoginCredentials {
    email: string;
    password: string;
}

export const loginTestData = {
    validUser: {
        email: 'wishu1219+183@gmail.com',
        password: 'Bachu@121989'
    },
    invalidUser: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
    },
    // Add more test data as needed
    testUsers: [
        {
            email: 'test1@example.com',
            password: 'Test@123'
        },
        {
            email: 'test2@example.com',
            password: 'Test@456'
        }
    ]
}; 