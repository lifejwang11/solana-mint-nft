const fs = require("fs");
const path = require("path");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const { exec } = require("child_process");

/**
 * 使用简单的方式铸造NFT
 */
async function mintSimple() {
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

    // 3. 准备命令行参数
    const name = mintData.name;
    const symbol = mintData.symbol;
    const uri = mintData.uri;

    console.log("准备铸造NFT:");
    console.log(`名称: ${name}`);
    console.log(`符号: ${symbol}`);
    console.log(`URI: ${uri}`);
    console.log(`网络环境: ${cluster}`);

    // 4. 使用Solana CLI命令铸造NFT
    // 这里我们使用sugar命令，这是Metaplex Candy Machine的一个工具
    // 但我们可以使用它来直接铸造单个NFT
    const command = `solana-keygen new -o nft-mint-keypair.json --no-bip39-passphrase --force && \
    solana airdrop 1 $(solana-keygen pubkey nft-mint-keypair.json) --url ${cluster} && \
    solana create-token --decimals 0 nft-mint-keypair.json --url ${cluster} && \
    solana create-account $(solana-keygen pubkey nft-mint-keypair.json) --keypair ./deploy-keypair.json --url ${cluster} && \
    solana mint $(solana-keygen pubkey nft-mint-keypair.json) 1 $(solana address) --url ${cluster} && \
    echo "NFT铸造成功！"`;

    console.log("\n执行命令:");
    console.log(command);

    // 5. 执行命令
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`\n❌ 铸造失败: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`\n警告: ${stderr}`);
      }

      console.log("\n✅ 命令执行结果:");
      console.log(stdout);

      // 显示成功消息
      console.log(`
铸造可能已成功完成！
请检查Solana浏览器上的交易详情以确认。

NFT信息:
名称: ${name}
符号: ${symbol}
URI: ${uri}
      `);
    });
  } catch (error) {
    console.error(`❌ 铸造NFT失败: ${error.message}`);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.length > 0 && (args[0] === "--help" || args[0] === "-h")) {
    console.log(`
使用方法:
  node mint-simple.js [cluster]

参数:
  cluster - 可选，网络环境 (mainnet, devnet, testnet)，默认为devnet

示例:
  node mint-simple.js
  node mint-simple.js devnet
  node mint-simple.js mainnet
`);
    return;
  }

  mintSimple();
}

main();
