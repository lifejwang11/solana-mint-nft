const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * 从Solana区块链下载NFT元数据和图片
 * @param {string} mintAddress - NFT铸币地址
 * @param {string} cluster - 网络环境 (mainnet, devnet, testnet)
 */
async function downloadNftFromChain(mintAddress, cluster = "devnet") {
  try {
    const downloadDir = path.join(__dirname, "../downloads");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    console.log(`获取NFT: ${mintAddress} (${cluster})`);

    // 设置RPC端点
    let rpcEndpoint;
    switch (cluster) {
      case "mainnet":
        rpcEndpoint = "https://api.mainnet-beta.solana.com";
        break;
      case "devnet":
        rpcEndpoint = "https://api.devnet.solana.com";
        break;
      case "testnet":
        rpcEndpoint = "https://api.testnet.solana.com";
        break;
      default:
        rpcEndpoint = "https://api.devnet.solana.com";
    }

    // 使用Solana CLI获取NFT元数据
    console.log(`从链上获取元数据...`);
    const metadataCommand = `solana metadata get ${mintAddress} --output json --url ${rpcEndpoint}`;

    exec(metadataCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`获取元数据失败: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`元数据错误: ${stderr}`);
        return;
      }

      try {
        // 解析元数据
        const metadata = JSON.parse(stdout);
        console.log(`获取NFT元数据成功: ${metadata.name}`);

        // 保存元数据到文件
        const metadataPath = path.join(downloadDir, `${mintAddress}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`元数据已保存到: ${metadataPath}`);

        // 获取NFT URI
        if (!metadata.uri) {
          console.error("元数据中未找到URI");
          return;
        }

        // 下载NFT元数据
        console.log(`从URI获取完整元数据: ${metadata.uri}`);
        const response = await axios.get(metadata.uri);
        const nftData = response.data;

        // 保存完整元数据
        const fullMetadataPath = path.join(
          downloadDir,
          `${mintAddress}_full.json`
        );
        fs.writeFileSync(fullMetadataPath, JSON.stringify(nftData, null, 2));
        console.log(`完整元数据已保存到: ${fullMetadataPath}`);

        // 检查是否有图片链接
        if (!nftData.image) {
          console.error("NFT元数据中未找到图片链接");
          return;
        }

        // 下载图片
        console.log(`找到图片: ${nftData.image}`);

        // 如果是IPFS链接，使用我们的IPFS下载脚本
        if (nftData.image.startsWith("ipfs://")) {
          const safeName = metadata.name
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "");
          const imageFilename = `${safeName}_${mintAddress}.png`;

          console.log(`使用IPFS下载脚本下载图片...`);
          const downloadCmd = `node ${path.join(
            __dirname,
            "download-ipfs.js"
          )} "${nftData.image}" "${imageFilename}"`;

          exec(downloadCmd, (err, dStdout, dStderr) => {
            if (err) {
              console.error(`下载图片失败: ${err.message}`);
              return;
            }
            console.log(dStdout);
            if (dStderr) console.error(dStderr);
          });
        } else {
          // 如果是HTTP链接，直接下载
          const imageExt = nftData.image.split(".").pop() || "png";
          const safeName = metadata.name
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "");
          const imagePath = path.join(
            downloadDir,
            `${safeName}_${mintAddress}.${imageExt}`
          );

          console.log(`从HTTP链接下载图片...`);
          const imageResponse = await axios({
            method: "GET",
            url: nftData.image,
            responseType: "stream",
          });

          const writer = fs.createWriteStream(imagePath);
          imageResponse.data.pipe(writer);

          writer.on("finish", () => {
            console.log(`图片已保存到: ${imagePath}`);
          });
          writer.on("error", (err) => {
            console.error(`保存图片失败: ${err.message}`);
          });
        }
      } catch (parseError) {
        console.error(`解析元数据失败: ${parseError.message}`);
        console.error(`原始输出: ${stdout}`);
      }
    });
  } catch (error) {
    console.error(`处理NFT失败: ${error.message}`);
  }
}

// 命令行参数处理
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node download-nft.js <mint-address> [cluster]

参数:
  mint-address: NFT的铸币地址
  cluster: 可选，网络环境 (mainnet, devnet, testnet)，默认为devnet

示例:
  node download-nft.js GwqvFqLKa3yxRnJKJGj2ftaZ63NJoiGC1XqTQ4TMPuAh
  node download-nft.js GwqvFqLKa3yxRnJKJGj2ftaZ63NJoiGC1XqTQ4TMPuAh mainnet
`);
    return;
  }

  const mintAddress = args[0];
  const cluster = args[1] || "devnet";

  downloadNftFromChain(mintAddress, cluster);
}

main();
