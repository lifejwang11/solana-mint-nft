const fs = require("fs");
const path = require("path");
const {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} = require("@solana/web3.js");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");

/**
 * 使用Metaplex SDK铸造NFT
 */
async function mintWithMetaplex() {
  try {
    // 1. 读取保存的铸造数据
    const tempDataPath = path.join(__dirname, "../temp-mint-data.json");
    if (!fs.existsSync(tempDataPath)) {
      throw new Error("铸造数据文件不存在: " + tempDataPath);
    }

    const mintData = JSON.parse(fs.readFileSync(tempDataPath, "utf8"));
    console.log("读取到的铸造数据:");
    console.log(mintData);

    // 2. 设置集群环境
    const cluster = process.argv[2] || "devnet";
    const endpoint =
      cluster === "mainnet"
        ? clusterApiUrl("mainnet-beta")
        : cluster === "testnet"
        ? clusterApiUrl("testnet")
        : clusterApiUrl("devnet");

    const connection = new Connection(endpoint, "confirmed");

    // 3. 加载钱包
    const keypairPath = path.join(__dirname, "../deploy-keypair.json");
    if (!fs.existsSync(keypairPath)) {
      throw new Error("钱包密钥文件不存在: " + keypairPath);
    }

    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    const wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));

    console.log("使用钱包地址:", wallet.publicKey.toString());

    // 4. 设置Metaplex
    const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

    // 5. 准备NFT元数据
    const { name, symbol, uri } = mintData;

    console.log("准备铸造NFT:");
    console.log(`名称: ${name}`);
    console.log(`符号: ${symbol}`);
    console.log(`URI: ${uri}`);
    console.log(`网络环境: ${cluster}`);

    // 6. 铸造NFT
    console.log("开始铸造NFT...");

    // 从IPFS URI中提取元数据URL
    let metadataUri = uri;
    if (uri.startsWith("ipfs://")) {
      // 将IPFS URI转换为HTTP URL
      const ipfsHash = uri.replace("ipfs://", "");
      metadataUri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    }

    console.log("使用元数据URI:", metadataUri);

    // 创建NFT
    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name: name,
      symbol: symbol,
      sellerFeeBasisPoints: 500, // 5% 版税
    });

    console.log("✅ NFT铸造成功!");
    console.log("NFT地址:", nft.address.toString());
    console.log("元数据地址:", nft.metadataAddress.toString());

    // 安全地获取主版本地址
    let masterEditionAddress = "未知";
    if (nft.masterEditionAddress) {
      masterEditionAddress = nft.masterEditionAddress.toString();
      console.log("主版本地址:", masterEditionAddress);
    }

    // 保存铸造结果
    const result = {
      name,
      symbol,
      uri,
      mint: nft.address.toString(),
      metadata: nft.metadataAddress.toString(),
      masterEdition: masterEditionAddress,
      owner: wallet.publicKey.toString(),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(__dirname, "../mint-result.json"),
      JSON.stringify(result, null, 2)
    );

    console.log("铸造结果已保存到 mint-result.json");
    console.log(
      `请在浏览器查看NFT: https://explorer.solana.com/address/${nft.address.toString()}?cluster=${cluster}`
    );
  } catch (error) {
    console.error(`❌ 铸造NFT失败: ${error.message}`);
    console.error(error);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.length > 0 && (args[0] === "--help" || args[0] === "-h")) {
    console.log(`
使用方法:
  node mint-metaplex.js [cluster]

参数:
  cluster - 可选，网络环境 (mainnet, devnet, testnet)，默认为devnet

示例:
  node mint-metaplex.js
  node mint-metaplex.js devnet
  node mint-metaplex.js mainnet
`);
    return;
  }

  mintWithMetaplex();
}

main();
