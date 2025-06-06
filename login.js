// Using Array data structure to store credentials
const adminCredentials = [
    { username: "admin1", password: "admin123" },
    { username: "admin2", password: "admin456" }
];

// Using Array data structure to store user data
let userData = JSON.parse(localStorage.getItem('userData')) || [
    { 
        username: "user1", 
        password: "user123",
        fullname: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        address: "123 Main St"
    }
];

// Using Hash Map (Object) for quick lookups
const adminMap = {};
let userMap = JSON.parse(localStorage.getItem('userMap')) || {};

// Initialize hash maps
adminCredentials.forEach(cred => {
    adminMap[cred.username] = cred.password;
});

// Initialize user map if empty
if (Object.keys(userMap).length === 0) {
    userData.forEach(user => {
        userMap[user.username] = {
            password: user.password,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            address: user.address
        };
    });
    // Save initial user map to localStorage
    localStorage.setItem('userMap', JSON.stringify(userMap));
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Login validation functions
function validateAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Using hash map for O(1) lookup
    if (adminMap[username] === password) {
        alert('Admin login successful!');
        // Store logged in admin info
        localStorage.setItem('currentUser', JSON.stringify({
            username: username,
            isAdmin: true
        }));
        // Redirect to admin dashboard
        window.location.href = 'admin-dashboard.html';
    } else {
        alert('Invalid admin credentials!');
    }
    
    return false;
}

function validateUserLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Using hash map for O(1) lookup
    if (userMap[username] && userMap[username].password === password) {
        alert('User login successful!');
        // Store logged in user info
        localStorage.setItem('currentUser', JSON.stringify({
            username: username,
            fullname: userMap[username].fullname
        }));
        // Redirect to user dashboard
        window.location.href = 'user-dashboard.html';
    } else {
        alert('Invalid user credentials!');
    }
    
    return false;
}

// Registration handling function
function handleRegistration(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation checks
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return false;
    }

    // Check if username already exists (O(1) lookup using hash map)
    if (userMap[username]) {
        alert('Username already exists!');
        return false;
    }

    // Create new user object
    const newUser = {
        username,
        password,
        fullname,
        email,
        phone,
        address
    };

    // Add to array (O(1) operation)
    userData.push(newUser);

    // Add to hash map (O(1) operation)
    userMap[username] = {
        password,
        fullname,
        email,
        phone,
        address
    };

    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userMap', JSON.stringify(userMap));

    alert('Registration successful! Please login.');
    // window.location.href = 'user-login.html';
    return false;
}

// Function to add new credentials (demonstrating array operations)
function addNewAdmin(username, password) {
    adminCredentials.push({ username, password });
    adminMap[username] = password;
}

function addNewUser(username, password) {
    userData.push({ username, password });
    userMap[username] = { password };
    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userMap', JSON.stringify(userMap));
}

// Function to remove credentials (demonstrating array operations)
function removeAdmin(username) {
    const index = adminCredentials.findIndex(cred => cred.username === username);
    if (index !== -1) {
        adminCredentials.splice(index, 1);
        delete adminMap[username];
    }
}

function removeUser(username) {
    const index = userData.findIndex(user => user.username === username);
    if (index !== -1) {
        userData.splice(index, 1);
        delete userMap[username];
        // Save to localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userMap', JSON.stringify(userMap));
    }
} 