const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/**
 * 使用Solana CLI铸造NFT
 */
async function mintWithCli() {
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
    const url = `https://api.${cluster}.solana.com`;

    // 3. 设置程序ID和钱包
    const programId = "6NZLquyhsNFA9GvspjQJ26Am1PzCdkhqdKtpHbtCjyDH";
    const keypairPath = path.join(__dirname, "../deploy-keypair.json");

    if (!fs.existsSync(keypairPath)) {
      throw new Error("钱包密钥文件不存在: " + keypairPath);
    }

    // 4. 准备命令行参数
    const name = mintData.name;
    const symbol = mintData.symbol;
    const uri = mintData.uri;

    console.log("准备铸造NFT:");
    console.log(`名称: ${name}`);
    console.log(`符号: ${symbol}`);
    console.log(`URI: ${uri}`);
    console.log(`程序ID: ${programId}`);
    console.log(`网络环境: ${cluster}`);

    // 5. 构建Solana CLI命令
    // 使用 `solana program invoke` 命令调用程序
    const command = `solana program invoke \
    --program-id ${programId} \
    --keypair ${keypairPath} \
    --url ${url} \
    -- \
    ${Buffer.from("mint_nft").toString("hex")} \
    ${Buffer.from(name).toString("hex")} \
    ${Buffer.from(symbol).toString("hex")} \
    ${Buffer.from(uri).toString("hex")}`;

    console.log("\n执行命令:");
    console.log(command);

    // 6. 执行命令
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
  node mint-with-cli.js [cluster]

参数:
  cluster - 可选，网络环境 (mainnet, devnet, testnet)，默认为devnet

示例:
  node mint-with-cli.js
  node mint-with-cli.js devnet
  node mint-with-cli.js mainnet
`);
    return;
  }

  mintWithCli();
}

main();
