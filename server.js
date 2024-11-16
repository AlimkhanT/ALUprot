const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const port = 3000;

// Middleware to handle JSON and URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper functions for file operations (e.g., reading users)
const usersFilePath = './users.txt';

const readUsersFromFile = () => {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeUsersToFile = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
};

// Authentication routes (login, register)
app.get('/login.html', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFromFile();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = user;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFromFile();

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Username taken' });
    }

    const newUser = { username, password };
    users.push(newUser);
    writeUsersToFile(users);

    req.session.user = newUser;
    res.json({ success: true });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

// Route for the main dashboard (home page)
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login.html');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// File upload and data processing route
app.post('/upload', upload.single('dataFile'), (req, res) => {
    const filePath = req.file.path;
    let parsedData = []; // Array to hold parsed rows

    // Parse the CSV file
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            parsedData.push({
                balance: parseFloat(row.Balance || 0),
                profit: parseFloat(row.Profit || 0),
                expenditures: parseFloat(row.Expenditures || 0)
            });
        })
        .on('end', () => {
            // Calculate total statistics
            let balance = 0, profit = 0, expenditures = 0;
            parsedData.forEach(entry => {
                balance += entry.balance;
                profit += entry.profit;
                expenditures += entry.expenditures;
            });

            // Calculate growth
            const initialProfit = parsedData[0].profit;
            const finalProfit = parsedData[parsedData.length - 1].profit;
            const revenueGrowth = ((finalProfit - initialProfit) / initialProfit) * 100;

            const initialExpenditure = parsedData[0].expenditures;
            const finalExpenditure = parsedData[parsedData.length - 1].expenditures;
            const expenditureGrowth = ((finalExpenditure - initialExpenditure) / initialExpenditure) * 100;

            // Send response including growth data
            res.json({
                success: true,
                data: parsedData,
                stats: { 
                    balance, 
                    profit, 
                    expenditures, 
                    revenueGrowth, 
                    expenditureGrowth 
                }
            });
        });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

const cors = require('cors');
app.use(cors()); // Enable CORS for all routes
