# Uranium Auto Mining Bot

An automated bot for mining Uranium tokens from the [GetUranium](https://www.geturanium.io/) platform.

## Features

- Automatically mines Uranium tokens
- Multiple wallet support
- Referral system integration
- Random mining amounts
- Proxy support for IP rotation
- Detailed mining activity logs

## Register

- Link : [https://www.geturanium.io/?ref=0x5fcd1722a3364f4a17c549f85266da235a79f28c]

## Prerequisites

- Node.js (v16+)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/airdropbomb/Uranium-Auto-Bot.git
```

2. Navigate to the project directory:
```bash
cd Uranium-Auto-Bot
```

3. Install dependencies:
```bash
npm install
```

## Configuration

1. Create a `.env` file in the root directory based on the `.env.example`:
```
BASE_URL=https://www.geturanium.io/
MINING_INTERVAL=10000
LOG_FILE=mining-logs.txt

# Add as many wallets as you want
WALLET_1=YOUR_WALLET_ADDRESS_1

WALLET_2=YOUR_WALLET_ADDRESS_2

# Add more wallets as needed...
```

2. (Optional) Create a `proxies.txt` file with your proxies in the format:
```
ip:port
ip:port:username:password
```

## Usage

Start the mining bot:
```bash
node index.js
```

### Controls
- Press `q`, `Escape`, or `Ctrl+C` to exit the application

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| BASE_URL | URL of the Uranium platform | https://www.geturanium.io/ |
| MINING_INTERVAL | Time between mining operations (ms) | 10000 |
| LOG_FILE | Name of the log file | mining-logs.txt |
| WALLET_# | Wallet addresses to use | - |

## Proxy Configuration

The bot supports HTTP/HTTPS proxies to avoid IP restrictions. Add your proxies to the `proxies.txt` file, one proxy per line:

```
ip:port
ip:port:username:password
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## Disclaimer

This tool is for educational purposes only. Use at your own risk. The developers assume no liability and are not responsible for any misuse or damage caused by this program.

## Join Our Community

Join us on Telegram: [Airdropbombnode](https://t.me/airdropbombnode)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
