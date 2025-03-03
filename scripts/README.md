# NFT 工具集

这个目录包含了一系列用于 NFT 项目的实用工具，包括 IPFS 下载、Pinata 上传下载和 Solana NFT 创建的脚本。

## 准备工作

安装依赖：

```bash
npm install axios form-data
```

## 1. IPFS 下载工具 (download-ipfs.js)

从 IPFS 直接下载单个图片。

**使用方法:**

```bash
node download-ipfs.js <ipfs-uri> [filename]
node download-ipfs.js --metadata <metadata-uri>
```

**示例:**

```bash
# 从IPFS URI下载图片
node download-ipfs.js ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/Vincent_van_Gogh.html

# 从IPFS CID下载图片并自定义文件名
node download-ipfs.js QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco my_image.png

# 从NFT元数据中提取图片URI并下载
node download-ipfs.js --metadata ipfs://QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL
```

## 2. 批量下载工具 (batch-download.js)

批量下载多个 IPFS 资源。

**使用方法:**

```bash
node batch-download.js
```

首次运行会创建一个`download-list.txt`文件，按照里面的说明添加要下载的 IPFS 资源，然后再次运行此脚本。

**download-list.txt 格式:**

```
# 在每行添加IPFS URI或CID，可选添加空格和文件名
# 以#开头的行将被忽略

ipfs://QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL
QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL example.png
--metadata ipfs://QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL
```

## 3. Solana NFT 元数据下载工具 (download-nft.js)

直接从 Solana 区块链查询 NFT 元数据并下载相关图片。

**使用方法:**

```bash
node download-nft.js <mint-address> [cluster]
```

**参数:**

- `mint-address`: NFT 的铸币地址
- `cluster`: 可选，网络环境 (mainnet, devnet, testnet)，默认为 devnet

**示例:**

```bash
# 从devnet下载NFT
node download-nft.js GwqvFqLKa3yxRnJKJGj2ftaZ63NJoiGC1XqTQ4TMPuAh

# 从主网下载NFT
node download-nft.js GwqvFqLKa3yxRnJKJGj2ftaZ63NJoiGC1XqTQ4TMPuAh mainnet
```

## 4. Pinata 上传下载工具 (pinata-tools.js)

使用 Pinata API 上传和下载 IPFS 内容。⚠️ 使用前请先在代码中设置您的 Pinata API 密钥。

**使用方法:**

```bash
node pinata-tools.js upload-file <文件路径> [名称]
node pinata-tools.js upload-json <JSON文件路径> [名称]
node pinata-tools.js upload-folder <文件夹路径> [名称]
node pinata-tools.js download <IPFS哈希> [文件名]
node pinata-tools.js list [记录数量]
node pinata-tools.js unpin <IPFS哈希>
node pinata-tools.js create-nft <元数据文件路径> <图片文件路径>
```

**功能:**

- 上传单个文件到 Pinata
- 上传 JSON 数据到 Pinata
- 上传整个文件夹到 Pinata
- 从 Pinata 下载文件
- 列出 Pinata 上的文件
- 从 Pinata 取消固定文件
- 创建 NFT 元数据并上传到 Pinata

## 5. Solana NFT 上传工具 (solana-nft-upload.js)

创建 NFT 并上传到 Pinata，然后准备使用 Solana 程序铸造 NFT。

**使用方法:**

```bash
node solana-nft-upload.js mint <名称> <符号> <描述> <图片路径> [程序ID] [网络环境]
node solana-nft-upload.js collection <合集名称> <符号> <描述> <图片目录> [数量]
```

**示例:**

```bash
# 创建单个NFT并准备铸造
node solana-nft-upload.js mint "我的NFT" "MYNFT" "这是我的第一个NFT" ./images/my-nft.png

# 生成NFT合集
node solana-nft-upload.js collection "我的NFT合集" "COLL" "这是我的NFT合集" ./images/collection
```

## 6. NFT 合集上传工具 (upload-collection.js)

上传整个 NFT 合集到 Pinata。

**使用方法:**

```bash
node upload-collection.js <合集配置文件路径> [mint]
```

**示例:**

```bash
# 仅上传
node upload-collection.js ../collection-output/collection.json

# 上传并尝试铸造
node upload-collection.js ../collection-output/collection.json mint
```

## 常见使用场景

### 场景 1: 创建和铸造单个 NFT

```bash
# 步骤1: 上传NFT到Pinata并准备铸造
node solana-nft-upload.js mint "我的第一个NFT" "NFT1" "这是一个测试NFT" ./images/nft.png

# 步骤2: 使用打印的铸造命令在Solana上铸造NFT
# (输出中会显示具体命令)
```

### 场景 2: 创建和上传 NFT 合集

```bash
# 步骤1: 准备NFT合集
node solana-nft-upload.js collection "我的NFT合集" "COLL" "测试NFT合集" ./images/collection-folder

# 步骤2: 上传合集到Pinata
node upload-collection.js ../collection-output/collection.json
```

### 场景 3: 使用 Pinata 上传文件夹

```bash
node pinata-tools.js upload-folder ./my-nft-assets "我的NFT资产"
```

## 下载位置

所有下载的文件将保存在项目根目录下的`downloads`文件夹中。
