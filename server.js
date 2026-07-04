const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

app.use(cors());
app.use(express.json());

/* ================= FIREBASE INIT ================= */
// IMPORTANT: add your Firebase service account JSON file
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* ================= XROCKET CONFIG ================= */

const XROCKET_TOKEN = process.env.XROCKET_TOKEN;
const XROCKET_API = 'https://pay.xrocket.exchange';

/* ================= HEALTH CHECK ================= */

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server running'
    });
});

/* ================= TRANSFER ROUTE ================= */

app.post('/api/transfer', async (req, res) => {
    try {

        const { userId, amount, transferId } = req.body;

        console.log('[REQUEST]', req.body);

        // STEP 1: GET USER FROM FIRESTORE
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userSnap.data();

        const tgUserId = Number(userData.telegramId);

        if (!tgUserId || tgUserId <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Telegram ID in database'
            });
        }

        console.log('[TG USER ID]', tgUserId);

        // STEP 2: BUILD PAYLOAD FOR XROCKET
        const payload = {
            tgUserId: tgUserId,
            currency: 'DOGS',
            amount: Number(amount),
            transferId: String(transferId),
            description: 'Withdrawal from WATCH REWARD'
        };

        console.log('[XROCKET PAYLOAD]', payload);

        // STEP 3: CALL XROCKET
        const response = await fetch(`${XROCKET_API}/app/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Rocket-Pay-Key': XROCKET_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('[XROCKET RESPONSE]', data);

        // STEP 4: RETURN RESULT
        if (response.ok && data.success) {
            return res.json({
                success: true,
                txId: data.data?.id || transferId,
                data
            });
        }

        return res.status(400).json({
            success: false,
            error: data.message || 'Transfer failed',
            details: data.errors || []
        });

    } catch (err) {
        console.error('[ERROR]', err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 Server running on port ' + PORT);
});
