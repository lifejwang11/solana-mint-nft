const fs = require("fs");
const path = require("path");
const pinataTools = require("./pinata-tools");

/**
 * 上传整个NFT合集到Pinata
 * @param {string} collectionFilePath - 合集配置文件路径
 * @param {boolean} mintNfts - 是否自动铸造NFT
 */
async function uploadCollection(collectionFilePath, mintNfts = false) {
  try {
    console.log(`开始上传NFT合集: ${collectionFilePath}`);

    // 1. 读取合集配置
    if (!fs.existsSync(collectionFilePath)) {
      throw new Error(`合集配置文件不存在: ${collectionFilePath}`);
    }

    const collection = JSON.parse(fs.readFileSync(collectionFilePath, "utf8"));
    console.log(`合集: ${collection.name} (${collection.nfts.length} NFTs)`);

    // 2. 创建结果存储目录
    const uploadDir = path.join(path.dirname(collectionFilePath), "uploaded");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. 上传所有NFT
    const results = [];
    console.log(`开始上传${collection.nfts.length}个NFT...`);

    for (let i = 0; i < collection.nfts.length; i++) {
      const nft = collection.nfts[i];
      console.log(`[${i + 1}/${collection.nfts.length}] 上传: ${nft.name}`);

      // 读取元数据
      const metadata = JSON.parse(fs.readFileSync(nft.metadataPath, "utf8"));

      try {
        // 上传图片和元数据
        const result = await pinataTools.createAndUploadNft(
          metadata,
          nft.imagePath
        );

        // 保存上传结果
        const resultPath = path.join(
          uploadDir,
          `${path.basename(nft.metadataPath, ".json")}_uploaded.json`
        );
        fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

        console.log(`✅ NFT上传成功: ${nft.name}`);
        console.log(`   图片: ${result.image.ipfsUrl}`);
        console.log(`   元数据: ${result.metadata.ipfsUrl}`);

        // 添加到结果集
        results.push({
          name: nft.name,
          image: result.image,
          metadata: result.metadata,
          nftMetadata: result.nftMetadata,
        });

        // 如果需要铸造，调用铸造命令(这里只是示例，实际铸造需要实现mint函数)
        if (mintNfts) {
          console.log(`正在铸造NFT: ${nft.name}...`);
          // TODO: 实现NFT铸造
        }
      } catch (uploadError) {
        console.error(`❌ 上传失败 [${nft.name}]: ${uploadError.message}`);
      }
    }

    // 4. 保存上传结果摘要
    const summaryPath = path.join(uploadDir, "upload-summary.json");
    fs.writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          collection: collection.name,
          symbol: collection.symbol,
          totalNfts: collection.nfts.length,
          successful: results.length,
          failed: collection.nfts.length - results.length,
          nfts: results,
        },
        null,
        2
      )
    );

    console.log(`
NFT合集上传完成!
- 总计: ${collection.nfts.length} NFTs
- 成功: ${results.length} NFTs
- 失败: ${collection.nfts.length - results.length} NFTs
- 结果摘要: ${summaryPath}
`);

    return {
      success: true,
      total: collection.nfts.length,
      successful: results.length,
      failed: collection.nfts.length - results.length,
      results,
      summaryPath,
    };
  } catch (error) {
    console.error(`❌ 上传合集失败: ${error.message}`);
    throw error;
  }
}

// 命令行参数处理
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node upload-collection.js <合集配置文件路径> [mint]

参数:
  合集配置文件路径: 通过collection命令生成的collection.json文件路径
  mint: 可选，是否自动铸造NFT(设置为'mint'以启用)

示例:
  node upload-collection.js ../collection-output/collection.json
  node upload-collection.js ../collection-output/collection.json mint
`);
    return;
  }

  const collectionFilePath = args[0];
  const mintNfts = args[1] === "mint";

  try {
    await uploadCollection(collectionFilePath, mintNfts);
  } catch (error) {
    console.error(`❌ 操作失败: ${error.message}`);
    process.exit(1);
  }
}

// 导出函数，便于在其他脚本中使用
module.exports = {
  uploadCollection,
};

// 如果直接运行此脚本，则执行main函数
if (require.main === module) {
  main();
}
