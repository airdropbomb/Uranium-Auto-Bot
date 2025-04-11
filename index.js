const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const figlet = require('figlet');
const axios = require('axios');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const screen = blessed.screen({
    smartCSR: true,
    title: 'URANIUM AUTO MINING - ADB NODE'
});

const walletRefs = [];
for (let i = 1; process.env[`WALLET_${i}`]; i++) {
    walletRefs.push({
        wallet: process.env[`WALLET_${i}`],
        refAddress: process.env[`REF_${i}`] || process.env.DEFAULT_REF_ADDRESS || 'default-ref',
        label: `Wallet${i}`
    });
}

const proxies = fs.existsSync('proxies.txt') ?
    fs.readFileSync('proxies.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0) : [];

const _0x5a7e = ['minAmount', 'MIN_AMOUNT', 'maxAmount', 'MAX_AMOUNT'];
const _0x31f2 = function (_0x5e6ef8, _0x25c254, _0x29ea93) {
    return parseInt(process.env[_0x5e6ef8]) || _0x25c254 * _0x29ea93 / _0x29ea93;
};

const config = {
    baseUrl: process.env.BASE_URL || 'https://www.geturanium.io/',
    [_0x5a7e[0]]: _0x31f2(_0x5a7e[1], 30, 1),
    [_0x5a7e[2]]: _0x31f2(_0x5a7e[3], 150, 1),
    miningInterval: parseInt(process.env.MINING_INTERVAL) || 60000,
    logFile: process.env.LOG_FILE || 'mining-logs.txt',
    capmonsterApiKey: process.env.CAPMONSTER_API_KEY // CapMonster API key
};

const colors = {
    green: '#00ff00',
    cyan: '#00ffff',
    red: '#ff0000',
    yellow: '#ffff00',
    gray: '#888888',
    white: '#ffffff'
};

let statusBox = null;
let logBox = null;

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

    if (logBox) {
        logBox.log(formattedMessage);
        screen.render();
    }
    fs.appendFileSync(path.join(__dirname, config.logFile), `[${timestamp}] ${walletObj.label || ''} ${message} ${proxyText}\n`);
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
        log('Error generating ASCII banner: ' + err.message, {}, null, 'error');
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
    try {
        const { banner, bannerHeight } = await createBanner();
        const noteBox = createNoteBox(bannerHeight);

        statusBox = blessed.box({
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

        logBox = blessed.log({
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
    } catch (error) {
        log('Error in initUI: ' + error.message, {}, null, 'error');
        throw new Error('Failed to initialize UI');
    }
};

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

const getRandomProxy = () => {
    if (proxies.length === 0) return null;
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    return proxy;
};

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const centerText = (text, width) => {
    const padding = width - text.length;
    const leftPadding = Math.floor(padding / 2);
    const rightPadding = padding - leftPadding;
    return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
};

const updateStatus = (status, color = 'green', walletObj = {}) => {
    if (!statusBox) {
        log('StatusBox not initialized yet', walletObj, null, 'error');
        return;
    }
    statusBox.setContent(
        `{white-fg}Bot Status:{/white-fg} {${color}-fg}${status}{/${color}-fg}\n` +
        `{white-fg}Current Wallet:{/white-fg} {yellow-fg}${walletObj.label || 'N/A'} (${walletObj.wallet?.substring(0, 6) || 'N/A'}...){/yellow-fg}\n` +
        `{white-fg}Ref Address:{/white-fg} {yellow-fg}${walletObj.refAddress?.substring(0, 6) || 'N/A'}...{/yellow-fg}`
    );
    screen.render();
};

const simulateHumanBehavior = async (page) => {
    try {
        await page.mouse.move(Math.random() * 500, Math.random() * 500);
        await page.mouse.move(Math.random() * 500, Math.random() * 500);
        await page.evaluate(() => {
            window.scrollBy(0, Math.random() * 200);
        });
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    } catch (error) {
        log(`Failed to simulate human behavior: ${error.message}`, {}, null, 'warning');
    }
};

const solveCaptchaWithCapMonster = async (siteKey, pageUrl) => {
    if (!config.capmonsterApiKey) {
        log('CapMonster API key not configured', {}, null, 'error');
        throw new Error('CapMonster API key missing');
    }

    try {
        const createTask = await axios.post('https://api.capmonster.cloud/createTask', {
            clientKey: config.capmonsterApiKey,
            task: {
                type: 'HCaptchaTaskProxyless',
                websiteURL: pageUrl,
                websiteKey: siteKey
            }
        });

        const taskId = createTask.data.taskId;
        if (!taskId) {
            throw new Error('Failed to create CapMonster task');
        }

        let result;
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const getResult = await axios.post('https://api.capmonster.cloud/getTaskResult', {
                clientKey: config.capmonsterApiKey,
                taskId: taskId
            });

            if (getResult.data.status === 'ready') {
                result = getResult.data.solution;
                break;
            }
        }

        if (!result) {
            throw new Error('CapMonster failed to solve CAPTCHA');
        }

        return result.gRecaptchaResponse;
    } catch (error) {
        throw new Error(`CapMonster error: ${error.message}`);
    }
};

const addShards = async (walletIndex = 0, retryCount = 0) => {
    if (walletRefs.length === 0) {
        log('No wallets configured in .env', {}, null, 'error');
        return;
    }

    const maxRetries = 3;
    const walletObj = walletRefs[walletIndex];
    const proxy = getRandomProxy();
    const proxyArgs = proxy ? [`--proxy-server=${proxy}`] : [];

    try {
        const amount = getRandomInt(config[_0x5a7e[0]], config[_0x5a7e[2]]);
        updateStatus(`Mining in progress... Adding ${amount} shards`, 'yellow', walletObj);
        log(`Mining started - Adding ${amount} shards`, walletObj, proxy, 'system');

        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                ...proxyArgs,
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': `${config.baseUrl}?ref=${walletObj.refAddress}`
        });

        if (proxy && proxy.includes('@')) {
            const [auth, host] = proxy.split('@');
            const [username, password] = auth.split(':');
            await page.authenticate({ username, password });
        }

        log(`Navigating to ${config.baseUrl}?ref=${walletObj.refAddress}`, walletObj, proxy, 'system');
        await page.goto(`${config.baseUrl}?ref=${walletObj.refAddress}`, { waitUntil: 'networkidle2', timeout: 60000 });

        await simulateHumanBehavior(page);

        const captchaSelector = 'iframe[src*="hcaptcha.com"]';
        const hasCaptcha = await page.$(captchaSelector);
        if (hasCaptcha) {
            log('CAPTCHA detected, attempting to solve with CapMonster', walletObj, proxy, 'system');
            const siteKey = await page.evaluate(() => {
                const iframe = document.querySelector('iframe[src*="hcaptcha.com"]');
                return iframe ? iframe.getAttribute('data-hcaptcha-widget-id') : null;
            });

            if (!siteKey) {
                throw new Error('Could not find CAPTCHA site key');
            }

            const captchaSolution = await solveCaptchaWithCapMonster(siteKey, config.baseUrl);
            await page.evaluate((solution) => {
                document.querySelector('textarea[name="h-captcha-response"]').value = solution;
                document.querySelector('iframe[src*="hcaptcha.com"]').dispatchEvent(new Event('checkbox_checked'));
            }, captchaSolution);

            log('CAPTCHA solved with CapMonster', walletObj, proxy, 'success');
            await page.waitForTimeout(2000);
        }

        const checkpointSelector = 'p#footer-text';
        try {
            await page.waitForSelector(checkpointSelector, { timeout: 10000 });
            log('Vercel Security Checkpoint detected', walletObj, proxy, 'warning');
            throw new Error('Vercel Security Checkpoint detected');
        } catch (e) {
            if (!e.message.includes('Vercel Security Checkpoint')) {
                log('No checkpoint detected, proceeding...', walletObj, proxy, 'success');
            } else {
                throw e;
            }
        }

        const miningBody = JSON.stringify([{
            walletAddress: walletObj.wallet,
            operation: "ADD_SHARDS",
            amount: amount,
            metadata: {}
        }]);

        const response = await page.evaluate(async (url, body, refAddress) => {
            const response = await fetch(`${url}?ref=${refAddress}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'next-action': '64df0feae9b403e3d0763d6903a72b2d277484d3'
                },
                body: body
            });
            return {
                status: response.status,
                data: await response.text()
            };
        }, config.baseUrl, miningBody, walletObj.refAddress);

        if (response.data.includes('Vercel Security Checkpoint')) {
            throw new Error('Vercel Security Checkpoint detected in response');
        }

        log(`Mining success Status: ${response.status}`, walletObj, proxy, 'success');

        log(`Starting verification`, walletObj, proxy, 'system');
        for (let i = 0; i < 3; i++) {
            try {
                updateStatus(`Verifying (${i + 1}/3)...`, 'white', walletObj);
                const verificationResponse = await page.evaluate(async (url, refAddress) => {
                    const response = await fetch(`${url}?ref=${refAddress}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'next-action': 'b9831338d461ae5ee5262a46ec7e728810a40c67'
                        },
                        body: JSON.stringify([])
                    });
                    return {
                        status: response.status,
                        data: await response.text()
                    };
                }, config.baseUrl, walletObj.refAddress);

                log(`Verification ${i + 1} success Status: ${verificationResponse.status}`, walletObj, proxy, 'success');
            } catch (verError) {
                log(`Verification ${i + 1} failed: ${verError.message}`, walletObj, proxy, 'error');
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        log(`Cycle complete Added ${amount} shards`, walletObj, proxy, 'success');
        updateStatus(`Waiting for next cycle`, 'green', walletObj);

        await browser.close();

        const nextWalletIndex = (walletIndex + 1) % walletRefs.length;
        setTimeout(() => addShards(nextWalletIndex), config.miningInterval);

    } catch (error) {
        if (error.message.includes('Vercel Security Checkpoint') && retryCount < maxRetries) {
            log(`Vercel Security Checkpoint detected. Retrying (${retryCount + 1}/${maxRetries})...`, walletObj, proxy, 'warning');
            await new Promise(resolve => setTimeout(resolve, 10000));
            return addShards(walletIndex, retryCount + 1);
        }

        updateStatus(`Mining Error - Retrying Soon`, 'red', walletObj);
        log(`Mining failed: ${error.message}`, walletObj, proxy, 'error');

        const nextWalletIndex = (walletIndex + 1) % walletRefs.length;
        log(`Next wallet in ${config.miningInterval / 1000}s`, walletObj, proxy, 'warning');
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

        if (proxies.length === 0) {
            log('No proxies configured in proxies.txt. Running without proxies.', {}, null, 'warning');
        }

        const uiElements = await initUI();
        statusBox = uiElements.statusBox;
        logBox = uiElements.logBox;

        if (!statusBox || !logBox) {
            log('Failed to initialize statusBox or logBox', {}, null, 'error');
            process.exit(1);
        }

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
        log(`Critical error: ${error.message}`, {}, null, 'error');
        process.exit(1);
    }
};

main();
