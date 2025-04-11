const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const figlet = require('figlet');
const axios = require('axios'); // CapMonster API အတွက်
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
    capmonsterApiKey: process.env.CAPMONSTER_API_KEY // .env ထဲမှာ ထည့်ဖို့
};

// ... (ယခင်က code တွေ အတူတူပဲ၊ createBanner, createNoteBox, initUI, etc.)

const solveCaptchaWithCapMonster = async (siteKey, pageUrl) => {
    try {
        // CapMonster API ကို ခေါ်တယ်
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

        // Result ကို စောင့်တယ်
        let result;
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 စက္ကန့်စောင့်
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

        return result.gRecaptchaResponse; // hCaptcha response token
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

        // CAPTCHA detection
        const captchaSelector = 'iframe[src*="hcaptcha.com"]'; // hCaptcha အတွက်
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
            await page.waitForTimeout(2000); // CAPTCHA submission အတွက် စောင့်
        }

        // Vercel Security Checkpoint စစ်ဆေးမှု
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

        // Mining request
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

        // Verification
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

// ... (တခြား functions တွေ အတူတူပဲ၊ initLogs, main, etc.)
