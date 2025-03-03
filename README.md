# Solana NFT 工具集

_[English Version](#solana-nft-toolkit)_

## 项目概述

这是一个用于 Solana 区块链的 NFT 开发工具集，提供了从 IPFS 下载、上传，到 NFT 铸造的全套功能。支持在 Solana 的 devnet、testnet 和 mainnet 上操作，让创建和管理 NFT 变得简单高效。

## 功能特点

- 📥 从 IPFS 下载内容（单个文件或批量）
- 📤 上传内容到 Pinata IPFS 服务
- 🖼️ 在 Solana 区块链上铸造 NFT
- 🗃️ 管理 NFT 合集
- 🔄 支持不同的 Solana 网络环境
- 📋 详细的操作日志和结果记录

## 安装指南

### 前提条件

- Node.js (v14+)
- npm 或 yarn
- Solana CLI 工具
- 有效的 Solana 钱包（部署密钥）

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/solana-nft-tools.git
cd solana-nft-tools
```

2. 安装依赖

```bash
npm install
```

3. 配置 Pinata API 密钥（如需使用上传功能）
   编辑`scripts/pinata-tools.js`文件，添加您的 Pinata API 密钥

## 使用指南

### 1. IPFS 下载工具 (download-ipfs.js)

下载单个 IPFS 内容：

```bash
# 直接从IPFS下载
node scripts/download-ipfs.js "ipfs://QmYourIPFSHash"

# 下载并提取元数据中的图片
node scripts/download-ipfs.js "ipfs://QmYourMetadataHash" --extract-image
```

### 2. 批量下载工具 (batch-download.js)

```bash
# 首次运行，生成模板
node scripts/batch-download.js

# 编辑download-list.txt，然后运行
node scripts/batch-download.js
```

### 3. Solana NFT 元数据下载 (download-nft.js)

```bash
# 从devnet下载NFT元数据和图片
node scripts/download-nft.js <mint地址>

# 从主网下载
node scripts/download-nft.js <mint地址> mainnet
```

### 4. Pinata 上传下载工具 (pinata-tools.js)

```bash
# 上传文件
node scripts/pinata-tools.js upload-file ./images/my-image.png "我的图片"

# 上传JSON
node scripts/pinata-tools.js upload-json ./metadata.json "NFT元数据"

# 上传文件夹
node scripts/pinata-tools.js upload-folder ./collection "我的NFT合集"
```

### 5. Solana NFT 铸造工具 (mint-metaplex.js)

```bash
# 在devnet上铸造NFT
node scripts/mint-metaplex.js

# 在主网上铸造NFT
node scripts/mint-metaplex.js mainnet
```

### 6. NFT 合集上传工具 (upload-collection.js)

```bash
# 上传整个NFT合集到Pinata
node scripts/upload-collection.js ../collection-output/collection.json
```

## 常见使用场景

### 创建和铸造单个 NFT

1. 上传图片到 IPFS：

```bash
node scripts/pinata-tools.js upload-file ./images/my-nft.png "我的NFT图片"
```

2. 创建并上传元数据：

```bash
node scripts/pinata-tools.js create-metadata "我的NFT" "MYNFT" "这是我的第一个NFT" "ipfs://QmYourImageHash" --attributes "trait_type=背景,value=蓝色" "trait_type=稀有度,value=稀有"
```

3. 铸造 NFT：

```bash
node scripts/mint-metaplex.js
```

### 查看您的 NFT

1. 在 Solana Explorer 上：

```
https://explorer.solana.com/address/<NFT地址>?cluster=devnet
```

2. 在钱包中：打开 Phantom 或 Solflare 钱包，切换到对应网络查看

## 常见问题

**Q: 如何更改默认网络？**  
A: 大多数脚本支持通过命令行参数设置网络，例如`node scripts/mint-metaplex.js mainnet`

**Q: 如何解决连接超时问题？**  
A: 请检查您的网络连接，或尝试更换 RPC 节点。编辑各个脚本中的 endpoint 设置。

**Q: 铸造 NFT 需要多少 SOL？**  
A: 在 devnet 上通常不到 0.01 SOL，mainnet 上会根据网络拥堵状况有所不同。

## 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [创建 Issue](https://github.com/yourusername/solana-nft-tools/issues)
- Email: your.email@example.com

---

# Solana NFT Toolkit

_[中文版本](#solana-nft-工具集)_

## Project Overview

This is a comprehensive toolkit for NFT development on the Solana blockchain, providing a complete set of functionalities from IPFS downloading, uploading, to NFT minting. It supports operations on Solana's devnet, testnet, and mainnet, making the creation and management of NFTs simple and efficient.

## Features

- 📥 Download content from IPFS (single file or batch)
- 📤 Upload content to Pinata IPFS service
- 🖼️ Mint NFTs on the Solana blockchain
- 🗃️ Manage NFT collections
- 🔄 Support for different Solana network environments
- 📋 Detailed operation logs and result records

## Installation Guide

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Solana CLI tools
- Valid Solana wallet (deployment key)

### Installation Steps

1. Clone the repository

```bash
git clone https://github.com/yourusername/solana-nft-tools.git
cd solana-nft-tools
```

2. Install dependencies

```bash
npm install
```

3. Configure Pinata API keys (if using upload functionality)
   Edit the `scripts/pinata-tools.js` file and add your Pinata API keys

## Usage Guide

### 1. IPFS Download Tool (download-ipfs.js)

Download a single IPFS content:

```bash
# Direct download from IPFS
node scripts/download-ipfs.js "ipfs://QmYourIPFSHash"

# Download and extract image from metadata
node scripts/download-ipfs.js "ipfs://QmYourMetadataHash" --extract-image
```

### 2. Batch Download Tool (batch-download.js)

```bash
# First run, generate template
node scripts/batch-download.js

# Edit download-list.txt, then run
node scripts/batch-download.js
```

### 3. Solana NFT Metadata Download (download-nft.js)

```bash
# Download NFT metadata and image from devnet
node scripts/download-nft.js <mint-address>

# Download from mainnet
node scripts/download-nft.js <mint-address> mainnet
```

### 4. Pinata Upload/Download Tool (pinata-tools.js)

```bash
# Upload file
node scripts/pinata-tools.js upload-file ./images/my-image.png "My Image"

# Upload JSON
node scripts/pinata-tools.js upload-json ./metadata.json "NFT Metadata"

# Upload folder
node scripts/pinata-tools.js upload-folder ./collection "My NFT Collection"
```

### 5. Solana NFT Minting Tool (mint-metaplex.js)

```bash
# Mint NFT on devnet
node scripts/mint-metaplex.js

# Mint NFT on mainnet
node scripts/mint-metaplex.js mainnet
```

### 6. NFT Collection Upload Tool (upload-collection.js)

```bash
# Upload an entire NFT collection to Pinata
node scripts/upload-collection.js ../collection-output/collection.json
```

## Common Use Cases

### Create and Mint a Single NFT

1. Upload image to IPFS:

```bash
node scripts/pinata-tools.js upload-file ./images/my-nft.png "My NFT Image"
```

2. Create and upload metadata:

```bash
node scripts/pinata-tools.js create-metadata "My NFT" "MYNFT" "This is my first NFT" "ipfs://QmYourImageHash" --attributes "trait_type=Background,value=Blue" "trait_type=Rarity,value=Rare"
```

3. Mint NFT:

```bash
node scripts/mint-metaplex.js
```

### View Your NFT

1. On Solana Explorer:

```
https://explorer.solana.com/address/<NFT-address>?cluster=devnet
```

2. In your wallet: Open Phantom or Solflare wallet, switch to the corresponding network to view

## FAQs

**Q: How do I change the default network?**  
A: Most scripts support setting the network via command line parameter, e.g., `node scripts/mint-metaplex.js mainnet`

**Q: How do I resolve connection timeout issues?**  
A: Please check your network connection or try changing the RPC node. Edit the endpoint settings in the respective scripts.

**Q: How much SOL is needed to mint an NFT?**  
A: On devnet, usually less than 0.01 SOL; on mainnet, it varies depending on network congestion.

## Contact

If you have any questions or suggestions, please contact via:

- GitHub Issues: [Create Issue](https://github.com/yourusername/solana-nft-tools/issues)
- Email: your.email@example.com
