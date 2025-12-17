"""
Bug Scenarios for Debugging Round
Pre-configured codebases with hidden bugs for interview practice
"""
from typing import Dict, List

BUG_SCENARIOS = {
    "payment_checkout_500": {
        "name": "Payment Checkout 500 Error",
        "description": "The checkout button is throwing a 500 error. Find and fix the bug in controllers/payment.js",
        "files": {
            "controllers/payment.js": """const express = require('express');
const router = express.Router();
const PaymentService = require('/services/paymentService');

router.post('/checkout', async (req, res) => {
    try {
        const { amount, userId, items } = req.body;
        
        // BUG 1: Missing validation - amount could be undefined
        if (amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        // BUG 2: items is not checked before using .map()
        const total = items.map(item => item.price).reduce((a, b) => a + b, 0);
        
        // BUG 3: PaymentService.processPayment expects different parameters
        const result = await PaymentService.processPayment(userId, amount);
        
        res.json({ success: true, transactionId: result.id });
    } catch (error) {
        // BUG 4: Error handling doesn't log or provide useful info
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;""",
            "services/paymentService.js": """class PaymentService {
    static async processPayment(userId, amount, currency = 'USD') {
        // BUG 5: Missing null check for userId
        if (!userId || !amount) {
            throw new Error('Missing required parameters');
        }
        
        // Simulate payment processing
        return {
            id: `txn_${Date.now()}`,
            userId: userId,
            amount: amount,
            currency: currency,
            status: 'completed'
        };
    }
}

module.exports = PaymentService;""",
            "package.json": """{
  "name": "payment-service",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  }
}"""
        },
        "bugs": [
            {
                "file": "controllers/payment.js",
                "line": 3,
                "issue": "Incorrect require path - using absolute path instead of relative",
                "fix": "Change require('/services/paymentService') to require('../services/paymentService')"
            },
            {
                "file": "controllers/payment.js",
                "line": 8,
                "issue": "Missing validation for undefined amount",
                "fix": "Add check: if (!amount || amount <= 0)"
            },
            {
                "file": "controllers/payment.js",
                "line": 12,
                "issue": "items.map() called without checking if items exists or is array",
                "fix": "Add check: if (!items || !Array.isArray(items))"
            },
            {
                "file": "controllers/payment.js",
                "line": 15,
                "issue": "processPayment called with wrong number of parameters",
                "fix": "Should include currency parameter or match service signature"
            },
            {
                "file": "controllers/payment.js",
                "line": 18,
                "issue": "Error handling doesn't log error details",
                "fix": "Add: console.error('Payment error:', error);"
            },
            {
                "file": "services/paymentService.js",
                "line": 4,
                "issue": "Missing validation for userId type",
                "fix": "Add type check or validation"
            }
        ]
    },
    "api_rate_limit_bypass": {
        "name": "API Rate Limit Bypass",
        "description": "Users are bypassing rate limits. Find the security vulnerability in middleware/rateLimiter.js",
        "files": {
            "middleware/rateLimiter.js": """const rateLimit = require('express-rate-limit');

// BUG 1: Rate limit key uses req.ip which can be spoofed
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    keyGenerator: (req) => {
        // BUG 2: Trusts X-Forwarded-For header without validation
        return req.headers['x-forwarded-for'] || req.ip;
    },
    // BUG 3: No handler for rate limit exceeded
    skip: (req) => {
        // BUG 4: Allows bypass for certain paths without authentication check
        return req.path.startsWith('/admin');
    }
});

module.exports = limiter;""",
            "app.js": """const express = require('express');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// BUG 5: Rate limiter applied after routes, should be before
app.use('/api', require('./routes/api'));

app.use(rateLimiter);

app.listen(3000);"""
        },
        "bugs": [
            {
                "file": "middleware/rateLimiter.js",
                "line": 7,
                "issue": "X-Forwarded-For header can be spoofed",
                "fix": "Validate and parse X-Forwarded-For properly"
            },
            {
                "file": "middleware/rateLimiter.js",
                "line": 12,
                "issue": "No handler for rate limit exceeded",
                "fix": "Add handler: handler: (req, res) => res.status(429).json({error: 'Too many requests'})"
            },
            {
                "file": "middleware/rateLimiter.js",
                "line": 13,
                "issue": "Admin path bypass without authentication",
                "fix": "Check authentication before skipping"
            },
            {
                "file": "app.js",
                "line": 7,
                "issue": "Rate limiter applied after routes",
                "fix": "Move app.use(rateLimiter) before routes"
            }
        ]
    },
    "database_connection_leak": {
        "name": "Database Connection Leak",
        "description": "Application is running out of database connections. Find the connection leak in db/connection.js",
        "files": {
            "db/connection.js": """const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb',
    connectionLimit: 10
});

// BUG 1: No connection cleanup in error cases
async function getConnection() {
    const connection = await pool.getConnection();
    return connection;
}

// BUG 2: Query function doesn't release connection
async function query(sql, params) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.execute(sql, params);
        // BUG 3: Connection not released on success
        return rows;
    } catch (error) {
        // BUG 4: Connection not released on error
        throw error;
    }
}

module.exports = { query, getConnection };""",
            "controllers/users.js": """const db = require('../db/connection');

async function getUsers() {
    // BUG 5: Multiple connections opened without closing
    const users = await db.query('SELECT * FROM users');
    const profiles = await db.query('SELECT * FROM profiles');
    return { users, profiles };
}

module.exports = { getUsers };"""
        },
        "bugs": [
            {
                "file": "db/connection.js",
                "line": 11,
                "issue": "Connection not released in getConnection",
                "fix": "Should return connection with release method or use pool.query directly"
            },
            {
                "file": "db/connection.js",
                "line": 19,
                "issue": "Connection not released after query",
                "fix": "Add: finally { conn.release(); }"
            },
            {
                "file": "db/connection.js",
                "line": 22,
                "issue": "Connection not released on error",
                "fix": "Add: finally { conn.release(); }"
            },
            {
                "file": "controllers/users.js",
                "line": 5,
                "issue": "Multiple queries without connection pooling properly",
                "fix": "Use pool.query which handles connection automatically"
            }
        ]
    }
}

def get_scenario(scenario_id: str) -> Dict:
    """Get a bug scenario by ID"""
    return BUG_SCENARIOS.get(scenario_id)

def list_scenarios() -> List[Dict]:
    """List all available bug scenarios"""
    return [
        {
            "id": scenario_id,
            "name": scenario["name"],
            "description": scenario["description"]
        }
        for scenario_id, scenario in BUG_SCENARIOS.items()
    ]

