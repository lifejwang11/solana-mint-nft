const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 创建下载目录
const downloadDir = path.join(__dirname, "../downloads");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

/**
 * 从IPFS网关下载图片
 * @param {string} ipfsUri - IPFS URI (ipfs://...)或CID
 * @param {string} filename - 保存的文件名，如果不提供则使用CID作为文件名
 */
async function downloadFromIpfs(ipfsUri, filename) {
  try {
    // 解析IPFS URI或CID
    let cid = ipfsUri;
    if (ipfsUri.startsWith("ipfs://")) {
      cid = ipfsUri.substring(7);
    }

    // 移除可能的路径前缀
    if (cid.includes("/")) {
      cid = cid.split("/")[0];
    }

    // 使用文件名或CID作为文件名
    const outputFilename = filename || `${cid}.png`;
    const outputPath = path.join(downloadDir, outputFilename);

    // 尝试多个IPFS网关
    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
    ];

    // 尝试从不同网关下载直到成功
    for (const gateway of gateways) {
      try {
        console.log(`尝试从 ${gateway} 下载...`);
        const response = await axios({
          method: "GET",
          url: gateway,
          responseType: "stream",
        });

        // 将响应流写入文件
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on("finish", () => {
            console.log(`✅ 成功下载到 ${outputPath}`);
            resolve(outputPath);
          });
          writer.on("error", (err) => {
            console.error(`❌ 写入文件时出错: ${err.message}`);
            reject(err);
          });
        });
      } catch (error) {
        console.log(`从 ${gateway} 下载失败，尝试下一个网关...`);
      }
    }

    throw new Error("所有网关下载尝试均失败");
  } catch (error) {
    console.error(`❌ 下载失败: ${error.message}`);
    throw error;
  }
}

/**
 * 从NFT元数据下载图片
 * @param {string} metadataUri - 元数据URI
 */
async function downloadFromMetadata(metadataUri) {
  try {
    // 获取元数据
    let metadataUrl = metadataUri;
    if (metadataUri.startsWith("ipfs://")) {
      const cid = metadataUri.substring(7).split("/")[0];
      metadataUrl = `https://ipfs.io/ipfs/${cid}`;
    }

    console.log(`获取元数据 ${metadataUrl}...`);
    const response = await axios.get(metadataUrl);
    const metadata = response.data;

    if (!metadata.image) {
      throw new Error("元数据中未找到图片URI");
    }

    console.log(`找到图片URI: ${metadata.image}`);

    // 从元数据中提取文件名
    const name = metadata.name ? metadata.name.replace(/\s+/g, "_") : null;
    const filename = name ? `${name}.png` : null;

    // 下载图片
    return await downloadFromIpfs(metadata.image, filename);
  } catch (error) {
    console.error(`❌ 处理元数据失败: ${error.message}`);
    throw error;
  }
}

// 命令行参数处理
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node download-ipfs.js <ipfs-uri> [filename]
  node download-ipfs.js --metadata <metadata-uri>

示例:
  node download-ipfs.js ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/Vincent_van_Gogh.html
  node download-ipfs.js QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco my_image.png
  node download-ipfs.js --metadata ipfs://QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL
`);
    return;
  }

  try {
    if (args[0] === "--metadata") {
      if (!args[1]) {
        console.error("❌ 请提供元数据URI");
        return;
      }
      await downloadFromMetadata(args[1]);
    } else {
      await downloadFromIpfs(args[0], args[1]);
    }
  } catch (error) {
    console.error(`❌ 操作失败: ${error.message}`);
    process.exit(1);
  }
}

main();
