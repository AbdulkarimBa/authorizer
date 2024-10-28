const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

const SECRET_KEY = 'your_secret_key'; // Replace with your actual secret key
app.use(cookieParser());

// Allow only specific origin
app.use(cors({
    origin: 'https://foreign.pages.dev',
    methods: ['GET', 'POST'], // Add other methods as needed
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => {
    const token = req.cookies?.jwt;

    if (!token) {
        // No JWT present, issue a new one for authenticator on Vercel
        const newToken = jwt.sign({ user: 'test-user' }, SECRET_KEY, { expiresIn: '1h' });
        console.log('User landed on authenticator on Vercel, issuing new JWT:', newToken);

        // Set the new JWT as a cookie
        res.cookie('jwt', newToken, {
            httpOnly: true, // Prevents client-side access to the cookie
            secure: false,  // Set to true when using HTTPS
            maxAge: 3600000 // 1 hour expiration time in milliseconds
        });

        // Send a response indicating the user is authenticated
        return res.send('<h1>Welcome to authenticator on Vercel! You are authenticated.</h1>');
    }

    // JWT exists, authenticate the user and show the page
    console.log('User already authenticated with valid JWT');
    res.send('<h1>Welcome back to authenticator on Vercel! You are authenticated.</h1>');
});

app.get('/checkcookies', (req, res) => {
    const token = req.cookies?.jwt;
    // get the redirect URL from the query string
    const redirectUrl = req.query.redirectUrl;

    if (!redirectUrl) {
        return res.status(400).send('Missing redirectUrl query parameter');
    }
    if (!token) {
        // No JWT, issue a new one
        const newToken = jwt.sign({ user: 'test-user' }, SECRET_KEY, { expiresIn: '1h' });
        console.log('Issuing new JWT for domain cross-site:', newToken);

        // Send the new JWT in the response header
        res.set('Authorization', `Bearer ${newToken}`);
        res.set('Access-Control-Allow-Origin', '${host}');
        res.set('Access-Control-Allow-Credentials', 'true');

        return res.redirect(`${redirectUrl}/setcookies?token=${newToken}`);
    }

    // JWT exists, pass it to bbb.com
    res.set('Authorization', `Bearer ${token}`);
    return res.redirect(`${redirectUrl}/setcookies?token=${token}`);
});

app.listen(3000, () => {
    console.log('JWT Issuer and Authenticator (authenticator on Vercel) running on port 3000');
});