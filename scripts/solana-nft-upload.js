const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const pinataTools = require("./pinata-tools");

/**
 * 创建并上传NFT资产到Pinata，然后使用Solana程序铸造NFT
 * @param {string} name - NFT名称
 * @param {string} symbol - NFT符号
 * @param {string} description - NFT描述
 * @param {string} imagePath - NFT图片路径
 * @param {object} attributes - NFT属性
 * @param {string} programId - Solana程序ID
 * @param {string} cluster - Solana网络环境
 */
async function createAndMintNFT(
  name,
  symbol,
  description,
  imagePath,
  attributes = [],
  programId = "6NZLquyhsNFA9GvspjQJ26Am1PzCdkhqdKtpHbtCjyDH",
  cluster = "devnet"
) {
  try {
    console.log("开始NFT创建和铸造流程...");

    // 1. 准备元数据
    const metadata = {
      name,
      symbol,
      description,
      seller_fee_basis_points: 500, // 5% 版税
      external_url: "",
      attributes,
      collection: {
        name,
        family: symbol,
      },
      properties: {
        files: [
          {
            uri: "", // 待上传后填充
            type: "image/png",
          },
        ],
        category: "image",
        creators: [
          {
            address: "", // 待运行时填充
            share: 100,
          },
        ],
      },
    };

    // 2. 上传图片和元数据到Pinata
    console.log("上传图片和元数据到Pinata...");
    const uploadResult = await pinataTools.createAndUploadNft(
      metadata,
      imagePath
    );

    console.log(`
NFT资产上传成功!
图片IPFS: ${uploadResult.image.ipfsUrl}
元数据IPFS: ${uploadResult.metadata.ipfsUrl}
`);

    // 3. 创建临时文件存储交易信息
    const tempFile = path.join(__dirname, "../temp-mint-data.json");

    // 4. 获取当前用户的Solana钱包地址
    console.log("获取Solana钱包信息...");
    const walletOutput = execSync("solana address", { encoding: "utf8" });
    const walletAddress = walletOutput.trim();

    // 5. 更新元数据中的创作者地址
    metadata.properties.creators[0].address = walletAddress;

    // 6. 准备mint_nft交易参数
    const mintData = {
      name,
      symbol,
      uri: uploadResult.metadata.ipfsUrl,
      walletAddress,
    };

    // 7. 写入临时文件
    fs.writeFileSync(tempFile, JSON.stringify(mintData, null, 2));

    // 8. 构建mint_nft交易命令
    console.log(`准备使用Solana程序(${programId})铸造NFT...`);
    const mintCommand = `anchor run mint-nft ${name} ${symbol} ${uploadResult.metadata.ipfsUrl} --provider.cluster ${cluster}`;

    console.log(`
铸造命令:
${mintCommand}

您可以运行以上命令来铸造NFT，或者手动调用程序的mint_nft指令。

铸造参数:
- name: ${name}
- symbol: ${symbol}
- uri: ${uploadResult.metadata.ipfsUrl}

铸造数据已保存到: ${tempFile}
`);

    // 9. 返回结果
    return {
      success: true,
      metadata: uploadResult.nftMetadata,
      ipfs: {
        image: uploadResult.image,
        metadata: uploadResult.metadata,
      },
      mintCommand,
      mintData,
    };
  } catch (error) {
    console.error(`❌ NFT创建和铸造准备失败: ${error.message}`);
    throw error;
  }
}

/**
 * 生成完整的NFT合集
 * @param {string} collectionName - 合集名称
 * @param {string} symbol - 合集符号
 * @param {string} description - 合集描述
 * @param {string} imagesDir - 图片目录
 * @param {number} count - NFT数量，默认为所有图片
 * @param {function} attributeGenerator - 可选的属性生成函数
 */
async function generateCollection(
  collectionName,
  symbol,
  description,
  imagesDir,
  count = 0,
  attributeGenerator = null
) {
  try {
    console.log(`开始创建NFT合集: ${collectionName}`);

    // 1. 检查图片目录
    if (!fs.existsSync(imagesDir) || !fs.statSync(imagesDir).isDirectory()) {
      throw new Error(`图片目录不存在: ${imagesDir}`);
    }

    // 2. 获取所有图片文件
    const imageFiles = fs.readdirSync(imagesDir).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".png", ".jpg", ".jpeg", ".gif"].includes(ext);
    });

    // 3. 处理数量限制
    const totalImages =
      count > 0 && count < imageFiles.length ? count : imageFiles.length;

    // 4. 创建输出目录
    const outputDir = path.join(__dirname, "../collection-output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 5. 创建合集信息
    const collection = {
      name: collectionName,
      symbol,
      description,
      image: "",
      external_url: "",
      seller_fee_basis_points: 500,
      nfts: [],
    };

    // 6. 处理每个图片
    console.log(`开始处理${totalImages}个NFT图片...`);

    for (let i = 0; i < totalImages; i++) {
      const imageFile = imageFiles[i];
      const imagePath = path.join(imagesDir, imageFile);
      const nameWithoutExt = path.basename(imageFile, path.extname(imageFile));

      // 生成NFT名称
      const nftName = `${collectionName} #${i + 1}`;

      // 生成属性
      let attributes = [];
      if (attributeGenerator) {
        attributes = attributeGenerator(nameWithoutExt, i);
      }

      // 创建元数据
      const metadata = {
        name: nftName,
        symbol,
        description,
        image: "", // 待上传后填充
        attributes,
        collection: {
          name: collectionName,
          family: symbol,
        },
        properties: {
          files: [
            {
              uri: "", // 待上传后填充
              type: "image/png",
            },
          ],
          category: "image",
          creators: [
            {
              address: "", // 待运行时填充
              share: 100,
            },
          ],
        },
      };

      // 保存元数据到临时文件
      const tempMetadataPath = path.join(outputDir, `${nameWithoutExt}.json`);
      fs.writeFileSync(tempMetadataPath, JSON.stringify(metadata, null, 2));

      // 添加到合集
      collection.nfts.push({
        name: nftName,
        imagePath,
        metadataPath: tempMetadataPath,
      });

      console.log(`[${i + 1}/${totalImages}] 处理: ${nftName}`);
    }

    // 7. 保存合集信息
    const collectionPath = path.join(outputDir, "collection.json");
    fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));

    console.log(`
NFT合集准备完成!
- 合集名称: ${collectionName}
- NFT数量: ${totalImages}
- 输出目录: ${outputDir}

现在您可以:
1. 修改生成的元数据文件(如需要)
2. 运行'node scripts/upload-collection.js'上传并铸造整个合集
`);

    return {
      success: true,
      collection,
      outputDir,
      collectionPath,
    };
  } catch (error) {
    console.error(`❌ 合集生成失败: ${error.message}`);
    throw error;
  }
}

// 命令行参数处理
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node solana-nft-upload.js mint <名称> <符号> <描述> <图片路径> [程序ID] [网络环境]
  node solana-nft-upload.js collection <合集名称> <符号> <描述> <图片目录> [数量]

示例:
  node solana-nft-upload.js mint "我的NFT" "MYNFT" "这是我的第一个NFT" ./images/my-nft.png
  node solana-nft-upload.js collection "我的NFT合集" "COLL" "这是我的NFT合集" ./images/collection
`);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case "mint":
        if (args.length < 5) {
          console.error("❌ 请提供NFT名称、符号、描述和图片路径");
          return;
        }

        await createAndMintNFT(
          args[1], // 名称
          args[2], // 符号
          args[3], // 描述
          args[4], // 图片路径
          [], // 属性
          args[5] || "6NZLquyhsNFA9GvspjQJ26Am1PzCdkhqdKtpHbtCjyDH", // 程序ID
          args[6] || "devnet" // 网络环境
        );
        break;

      case "collection":
        if (args.length < 5) {
          console.error("❌ 请提供合集名称、符号、描述和图片目录");
          return;
        }

        await generateCollection(
          args[1], // 合集名称
          args[2], // 符号
          args[3], // 描述
          args[4], // 图片目录
          args[5] ? parseInt(args[5]) : 0 // 数量
        );
        break;

      default:
        console.error(`❌ 未知命令: ${command}`);
        break;
    }
  } catch (error) {
    console.error(`❌ 操作失败: ${error.message}`);
    process.exit(1);
  }
}

// 导出函数，便于在其他脚本中使用
module.exports = {
  createAndMintNFT,
  generateCollection,
};

// 如果直接运行此脚本，则执行main函数
if (require.main === module) {
  main();
}
