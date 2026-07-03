const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// YOUR XROCKET TOKEN - STORED SECURELY ON SERVER ONLY
const XROCKET_TOKEN = '763c1b85e9cf7b6b3ba95418c';
const XROCKET_API = 'https://pay.xrocket.tg';

app.post('/api/transfer', async (req, res) => {
    try {
        const { tgUserId, currency, amount, transferId, description } = req.body;
        console.log('[TRANSFER] User:', tgUserId, 'Amount:', amount, 'ID:', transferId);

        const response = await fetch(XROCKET_API + '/app/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Rocket-Pay-Key': XROCKET_TOKEN
            },
            body: JSON.stringify({
                userId: tgUserId.toString(),
                currency: currency || 'DOGS',
                amount: amount.toString(),
                transferId: transferId,
                description: description || 'Watch & Earn withdrawal successful'
            })
        });

        const data = await response.json();
        console.log('[RESPONSE]', JSON.stringify(data));

        if (response.ok && (data.id || data.transferId || data.success)) {
            res.json({ success: true, txId: data.id || data.transferId || transferId, data: data });
        } else {
            res.status(400).json({ success: false, error: data.message || data.error || 'xRocket transfer failed' });
        }
    } catch (error) {
        console.error('[ERROR]', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'xrocket-transfer-proxy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Server running on port ' + PORT));
