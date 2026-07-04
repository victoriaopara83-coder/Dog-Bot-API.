const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// xRocket API
const XROCKET_TOKEN = '763c1b85e9cf7b6b3ba95418c';
const XROCKET_API = 'https://pay.xrocket.exchange';

app.post('/api/transfer', async (req, res) => {
    try {
        const { tgUserId, currency, amount, transferId, description } = req.body;

        console.log('[TRANSFER] User:', tgUserId, 'Amount:', amount, 'ID:', transferId);

        const payload = {
            tgUserId: Number(tgUserId),
            currency: currency || 'DOGS',
            amount: Number(amount),
            transferId: transferId,
            description: description || 'Watch & Earn withdrawal successful'
        };

        console.log('[PAYLOAD]', JSON.stringify(payload));

        const response = await fetch(XROCKET_API + '/app/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Rocket-Pay-Key': XROCKET_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('[RESPONSE]', JSON.stringify(data));

        if (response.ok && data.success) {
            res.json({
                success: true,
                txId: data.data?.id || transferId,
                data: data
            });
        } else {
            res.status(400).json({
                success: false,
                error: data.message || 'xRocket transfer failed',
                errors: data.errors || []
            });
        }

    } catch (error) {
        console.error('[ERROR]', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Server error'
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'xrocket-transfer-proxy'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'xrocket-transfer-proxy'
    });
});

// Debug - confirms Railway is running the latest code
console.log("SERVER VERSION 2 - July 4");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 Server running on port ' + PORT);
});
