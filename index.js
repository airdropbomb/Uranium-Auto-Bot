const axios = require('axios');
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const figlet = require('figlet'); 
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

// Random User-Agent တွေအတွက် array
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64，没有 x64; rv:130.0) Gecko/20100101 Firefox/130.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
];

const screen = blessed.screen({
    smartCSR: true,
    title: 'URANIUM AUTO MINING - ADB NODE'
});

const walletRefs = [];
for (let i = 1; process.env[`WALLET_${i}`]; i++) {
    walletRefs.push({
        wallet: process.env[`WALLET_${i}`],
        refAddress: process.env[`REF_${i}`] || process.env.DEFAULT_REF_ADDRESS,
        label: `Wallet${i}`
    });
}

const proxies = fs.existsSync('proxies.txt') ? 
    fs.readFileSync('proxies.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0) : [];

const _0x5a7e = ['minAmount', 'MIN_AMOUNT', 'maxAmount', 'MAX_AMOUNT'];
const _0x31f2 = function(_0x5e6ef8, _0x25c254, _0x29ea93) {
    return parseInt(process.env[_0x5e6ef8]) || _0x25c254 * _0x29ea93 / _0x29ea93;
};

const config = {
    baseUrl: process.env.BASE_URL || 'https://www.geturanium.io/',
    [_0x5a7e[0]]: _0x31f2(_0x5a7e[1], 30, 1),
    [_0x5a7e[2]]: _0x31f2(_0x5a7e[3], 150, 1),
    // Mining interval ကို ပိုကြာအောင်ထားတယ် (20 စက္ကန့်)
    miningInterval: parseInt(process.env.MINING_INTERVAL) || 20000,
    logFile: process.env.LOG_FILE || 'mining-logs.txt'
};

const colors = {
    green: '#00ff 00',
    cyan: '#00ffff',
    red: '#ff0000',
    yellow: '#ffff00',
    gray: '#888888',
    white: '#ffffff'
};

const generateBannerText = (text, font = 'Standard') => {
    return new Promise((resolve, reject) => {
        figlet.text(text, { font, horizontalLayout: 'default', verticalLayout: 'default' }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
};

const createBanner = async () => {
    let bannerText = 'URANIUM AUTO MINING';
    let asciiBanner;

    const maxWidth = screen.width - 4; 
    if (maxWidth < 40) {
        bannerText = 'URANIUM MINING';
    } else if (maxWidth < 70) {
        bannerText = 'URANIUM MINING - AIRDROP';
    }

    try {
        asciiBanner = await generateBannerText(bannerText);
    } catch (err) {
        console.error('Error generating ASCII banner:', err);
        asciiBanner = bannerText; 
    }

    const bannerLines = asciiBanner.split('\n');
    const bannerHeight = bannerLines.length;

    const banner = blessed.box({
        top: 0,
        left: 'center',
        width: '100%',
        height: bannerHeight + 2, 
        content: asciiBanner,
        align: 'center',
        tags: true,
        border: { type: 'line' },
        style: {
            fg: 'white',
            border: { fg: 'yellow' }
        }
    });

    return { banner, bannerHeight };
};

const createNoteBox = (bannerHeight) => {
    return blessed.box({
        top: bannerHeight + 2, 
        left: 'center',
        width: '100%',
        height: 1,
        content: '{white-fg}Join Us: {cyan-fg}https://t.me/airdropbombnode{/cyan-fg}{/white-fg}',
        align: 'center',
        tags: true,
        style: {
            fg: 'white'
        }
    });
};

const initUI = async () => {
    const { banner, bannerHeight } = await createBanner();
    const noteBox = createNoteBox(bannerHeight);

    const statusBox = blessed.box({
        top: bannerHeight + 4, 
        left: 0,
        width: '100%',
        height: 5,
        content: '{white-fg}Bot Status:{/white-fg} {green-fg}Initializing...{/green-fg}',
        tags: true,
        border: { type: 'line' },
        style: {
            fg: 'white',
            border: { fg: 'yellow' }
        }
    });

    const logBox = blessed.log({
        top: bannerHeight + 9, 
        left: 0,
        width: '100%',
        height: `100%-${bannerHeight + 9}`,
        scrollable: true,
        alwaysScroll: true,
        scrollbar: {
            ch: '┃',
            style: { bg: 'green' }
        },
        tags: true,
        border: { type: 'line' },
        style: {
            fg: 'white',
            border: { fg: 'yellow' }
        }
    });

    screen.append(banner);
    screen.append(noteBox);
    screen.append(statusBox);
    screen.append(logBox);

    return { statusBox, logBox };
};

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

// Random User-Agent ရွေးတဲ့ function
const getRandomUserAgent = () => {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const getRandomProxy = () => {
    if (proxies.length === 0) return { agent: null, address: null };
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    const proxyUrl = proxy.includes('@') ? 
        `http://${proxy}` : 
        `http://${proxy.split(':')[0]}:${proxy.split(':')[1]}`;
    return { agent: new HttpsProxyAgent(proxyUrl), address: proxy };
};

const getRandomInt = (min, max) => {
    const _0x28bf = ['floor', 'random'];
    return Math[_0x28bf[0]](Math[_0x28bf[1]]() * (max - min + 1)) + min;
};

const centerText = (text, width) => {
    const padding = width - text.length;
    const leftPadding = Math.floor(padding / 2);
    const rightPadding = padding - leftPadding;
    return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
};

const getHeaders = (walletObj) => ({
    "accept": "text/x-component,application/json", // Accept JSON ထည့်ထားတယ်
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json", // Content-Type ကို JSON အဖြစ်ပြောင်းတယ်
    "next-action": "64df0feae9b403e3d0763d6903a72b2d277484d3",
    "next-router-state-tree": `%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%3Fref%3D${encodeURIComponent(walletObj.refAddress)}%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D`,
    "priority": "u=1, i",
    "sec-ch-ua": `"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"`, // ပိုသဘာဝကျတဲ့ sec-ch-ua
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": getRandomUserAgent(), // Random User-Agent သုံးတယ်
    "Referer": `${config.baseUrl}?ref=${walletObj.refAddress}`,
    "Referrer-Policy": "strict-origin-when-cross-origin"
});

const getVerificationHeaders = (walletObj) => ({
    ...getHeaders(walletObj),
    "next-action": "b9831338d461ae5ee5262a46ec7e728810a40c67"
});

const log = (message, walletObj = {}, proxyAddress = null, type = 'info') => {
    const timestamp = new Date().toISOString();
    const label = walletObj.label ? `{yellow-fg}[${walletObj.label}]{/yellow-fg} ` : '';
    const proxyText = proxyAddress ? `Using Proxy: ${proxyAddress}` : '';
    let formattedMessage;
    switch (type) {
        case 'success': formattedMessage = `{green-fg}[${timestamp}] ${label}✓ ${message} ${proxyText}{/green-fg}`; break;
        case 'error': formattedMessage = `{red-fg}[${timestamp}] ${label}✗ ${message} ${proxyText}{/red-fg}`; break;
        case 'warning': formattedMessage = `{yellow-fg}[${timestamp}] ${label}⚠ ${message} ${proxyText}{/yellow-fg}`; break;
        case 'system': formattedMessage = `{white-fg}[${timestamp}] ${label}${message} ${proxyText}{/white-fg}`; break;
        case 'muted': formattedMessage = `{gray-fg}[${timestamp}] ${label}${message} ${proxyText}{/gray-fg}`; break;
        default: formattedMessage = `{white-fg}[${timestamp}] ${label}ℹ ${message} ${proxyText}{/white-fg}`;
    }
    
    logBox.log(formattedMessage);
    screen.render();
    fs.appendFileSync(path.join(__dirname, config.logFile), `[${timestamp}] ${walletObj.label || ''} ${message} ${proxyText}\n`);
};

let statusBox, logBox; 

const updateStatus = (status, color = 'green', walletObj = {}) => {
    statusBox.setContent(
        `{white-fg}Bot Status:{/white-fg} {${color}-fg}${status}{/${color}-fg}\n` +
        `{white-fg}Current Wallet:{/white-fg} {yellow-fg}${walletObj.label || 'N/A'} (${walletObj.wallet?.substring(0, 6) || 'N/A'}...){/yellow-fg}\n` +
        `{white-fg}Ref Address:{/white-fg} {yellow-fg}${walletObj.refAddress?.substring(0, 6) || 'N/A'}...{/yellow-fg}`
    );
    screen.render();
};

const addShards = async (walletIndex = 0, retryCount = 0) => {
    if (walletRefs.length === 0) {
        log('No wallets configured in .env', {}, null, 'error');
        return;
    }

    const maxRetries = 3; // Retry အကြိမ်အရေအတွက်
    const walletObj = walletRefs[walletIndex];
    const proxyInfo = getRandomProxy();
    const proxyAgent = proxyInfo.agent;
    const proxyAddress = proxyInfo.address;

    try {
        const amount = getRandomInt(config[_0x5a7e[0]], config[_0x5a7e[2]]);
        const miningBody = JSON.stringify([{
            walletAddress: walletObj.wallet,
            operation: "ADD_SHARDS",
            amount: amount,
            metadata: {}
        }]);
        const verificationBody = JSON.stringify([]);

        updateStatus(`Mining in progress... Adding ${amount} shards`, 'yellow', walletObj);
        log(`Mining started - Adding ${amount} shards`, walletObj, proxyAddress, 'system');

        const miningResponse = await axios({
            method: 'post',
            url: `${config.baseUrl}?ref=${walletObj.refAddress}`,
            headers: getHeaders(walletObj),
            data: miningBody,
            httpsAgent: proxyAgent,
            timeout: 10000 // Timeout ထည့်ထားတယ်
        });

        // Vercel Security Checkpoint စစ်ဆေးမှုကို တွေ့လား စစ်တယ်
        if (miningResponse.data.includes('Vercel Security Checkpoint')) {
            throw new Error('Vercel Security Checkpoint detected');
        }

        log(`Mining success Status: ${miningResponse.status}`, walletObj, proxyAddress, 'success');
        log(`Starting verification`, walletObj, proxyAddress, 'system');

        for (let i = 0; i < 3; i++) {
            try {
                updateStatus(`Verifying (${i+1}/3)...`, 'white', walletObj);
                const verificationResponse = await axios({
                    method: 'post',
                    url: `${config.baseUrl}?ref=${walletObj.refAddress}`,
                    headers: getVerificationHeaders(walletObj),
                    data: verificationBody,
                    httpsAgent: proxyAgent,
                    timeout: 10000
                });
                log(`Verification ${i+1} success Status: ${verificationResponse.status}`, walletObj, proxyAddress, 'success');
            } catch (verError) {
                log(`Verification ${i+1} failed: ${verError.message}`, walletObj, proxyAddress, 'error');
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Verification တစ်ခုချင်းကြားမှာ delay ထည့်တယ်
        }
        
        log(`Cycle complete Added ${amount} shards`, walletObj, proxyAddress, 'success');
        updateStatus(`Waiting for next cycle`, 'green', walletObj);

        const nextWalletIndex = (walletIndex + 1) % walletRefs.length;
        setTimeout(() => addShards(nextWalletIndex), config.miningInterval);

    } catch (error) {
        if (error.message.includes('Vercel Security Checkpoint') && retryCount < maxRetries) {
            log(`Vercel Security Checkpoint detected. Retrying (${retryCount + 1}/${maxRetries})...`, walletObj, proxyAddress, 'warning');
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 စက္ကန့်စောင့်ပြီး retry
            return addShards(walletIndex, retryCount + 1);
        }

        updateStatus(`Mining Error - Retrying Soon`, 'red', walletObj);
        if (error.response) {
            log(`Mining failed Status ${error.response.status}`, walletObj, proxyAddress, 'error');
            log(`Error data: ${JSON.stringify(error.response.data)}`, walletObj, proxyAddress, 'error');
        } else if (error.request) {
            log(`Mining failed: No response`, walletObj, proxyAddress, 'error');
        } else {
            log(`Mining failed: ${error.message}`, walletObj, proxyAddress, 'error');
        }

        const nextWalletIndex = (walletIndex + 1) % walletRefs.length;
        log(`Next wallet in ${config.miningInterval / 1000}s`, walletObj, proxyAddress, 'warning');
        setTimeout(() => addShards(nextWalletIndex), config.miningInterval);
    }
};

const initLogs = () => {
    const logFilePath = path.join(__dirname, config.logFile);
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, `=== Uraniumio Mining Bot Logs ===\nStarted at: ${new Date().toISOString()}\n\n`);
        log('Log file initialized', {}, null, 'system');
    }
};

const main = async () => {
    try {
        initLogs();
        
        if (walletRefs.length === 0) {
            log('Configure wallets in .env', {}, null, 'error');
            process.exit(1);
        }

        const uiElements = await initUI();
        statusBox = uiElements.statusBox;
        logBox = uiElements.logBox;
        logBox.focus();

        const boxWidth = 49;

        log('╔' + '═'.repeat(boxWidth - 2) + '╗', {}, null, 'system');
        log(`║${centerText('URANIUM.IO MINING BOT INITIALIZED', boxWidth - 2)}║`, {}, null, 'system');
        log(`║${centerText(`Loaded ${walletRefs.length} wallets`, boxWidth - 2)}║`, {}, null, 'system');
        log(`║${centerText(`Proxies: ${proxies.length} available`, boxWidth - 2)}║`, {}, null, 'system');
        log('╚' + '═'.repeat(boxWidth - 2) + '╝', {}, null, 'system');
        
        walletRefs.forEach(walletObj => {
            log(`Loaded: ${walletObj.label} (${walletObj.wallet})`, {}, null, 'info');
        });

        updateStatus('Starting mining operations', 'white');
        addShards(0);
        
    } catch (error) {
        updateStatus('Critical Error', 'red');
        log(`Critical error: ${error.message}`, {}, null, 'error');
        process.exit(1);
    }
};

main();
screen.render();
