const axios = require('axios');
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const figlet = require('figlet'); 
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

const screen = blessed.screen({
  smartCSR: true,
  title: 'URANIUM AUTO MINING - AIRDROP INSIDERS'
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

const _0x5a7e = ['\x6d\x69\x6e\x41\x6d\x6f\x75\x6e\x74', '\x4d\x49\x4e\x5f\x41\x4d\x4f\x55\x4e\x54', '\x6d\x61\x78\x41\x6d\x6f\x75\x6e\x74', '\x4d\x41\x58\x5f\x41\x4d\x4f\x55\x4e\x54'];
const _0x31f2 = function(_0x5e6ef8, _0x25c254, _0x29ea93) {
  return parseInt(process.env[_0x5e6ef8]) || _0x25c254 * _0x29ea93 / _0x29ea93;
};

const config = {
  baseUrl: process.env.BASE_URL || 'https://www.geturanium.io/',
  [_0x5a7e[0]]: _0x31f2(_0x5a7e[1], 30, 1),
  [_0x5a7e[2]]: _0x31f2(_0x5a7e[3], 150, 1),
  miningInterval: parseInt(process.env.MINING_INTERVAL) || 10000,
  logFile: process.env.LOG_FILE || 'mining-logs.txt'
};

const colors = {
  green: '#00ff00',
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
    content: '{white-fg}Join Us: {cyan-fg}https://t.me/AirdropInsiderID{/cyan-fg}{/white-fg}',
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

const getRandomProxy = () => {
  if (proxies.length === 0) return { agent: null, address: null };
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  const proxyUrl = proxy.includes('@') ? 
    `http://${proxy}` : 
    `http://${proxy.split(':')[0]}:${proxy.split(':')[1]}`;
  return { agent: new HttpsProxyAgent(proxyUrl), address: proxy };
};

const getRandomInt = (min, max) => {
  const _0x28bf = ['\x66\x6c\x6f\x6f\x72', '\x72\x61\x6e\x64\x6f\x6d'];
  return Math[_0x28bf[0]](Math[_0x28bf[1]]() * (max - min + 1)) + min;
};

const centerText = (text, width) => {
  const padding = width - text.length;
  const leftPadding = Math.floor(padding / 2);
  const rightPadding = padding - leftPadding;
  return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
};

const getHeaders = (walletObj) => ({
  "accept": "text/x-component",
  "accept-language": "en-US,en;q=0.6",
  "content-type": "text/plain;charset=UTF-8",
  "next-action": "64df0feae9b403e3d0763d6903a72b2d277484d3",
  "next-router-state-tree": `%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%3Fref%3D${encodeURIComponent(walletObj.refAddress)}%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D`,
  "priority": "u=1, i",
  "sec-ch-ua": "\"Brave\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "sec-gpc": "1",
  "x-deployment-id": "dpl_BKK9tn8FqGSqRrmUQSiCez8w25iU",
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
  const proxyText = proxyAddress ? 'Using Proxy' : '';
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

const addShards = async (walletIndex = 0) => {
  if (walletRefs.length === 0) {
    log('No wallets configured in .env', {}, null, 'error');
    return;
  }

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
      httpsAgent: proxyAgent
    });

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
          httpsAgent: proxyAgent
        });
        log(`Verification ${i+1} success Status: ${verificationResponse.status}`, walletObj, proxyAddress, 'success');
      } catch (verError) {
        log(`Verification ${i+1} failed: ${verError.message}`, walletObj, proxyAddress, 'error');
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    log(`Cycle complete Added ${amount} shards`, walletObj, proxyAddress, 'success');
    updateStatus(`Waiting for next cycle`, 'green', walletObj);

    const nextWalletIndex = (walletIndex + 1) % walletRefs.length;
    setTimeout(() => addShards(nextWalletIndex), config.miningInterval);

  } catch (error) {
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