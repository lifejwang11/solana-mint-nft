const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// 创建下载目录
const downloadDir = path.join(__dirname, "../downloads");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

// Pinata配置 - 请替换为您的API密钥
const PINATA_CONFIG = {
  apiKey: "97cdd7aca97fda87d550", // 替换为您的API密钥
  apiSecret: "5133e13583f6c3cfa7f8eacf5762ebdc6e313eaa8d85fb9f1ddb2ea9822b3dc2", // 替换为您的API密钥密码
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwNmM2NDQ0My04MWVmLTRjZWQtYTY3OC1hNzIxNzQxNGNhZDYiLCJlbWFpbCI6IjEzMTIyMTkyMzM2QDE2My5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiOTdjZGQ3YWNhOTdmZGE4N2Q1NTAiLCJzY29wZWRLZXlTZWNyZXQiOiI1MTMzZTEzNTgzZjZjM2NmYTdmOGVhY2Y1NzYyZWJkYzZlMzEzZWFhOGQ4NWZiOWYxZGRiMmVhOTgyMmIzZGMyIiwiZXhwIjoxNzcyNTE1MTc5fQ.F8BiIxIGWtWwsX6_n8L5Dk1fpabgVGIGLsqMVjhcs8o", // 或者使用JWT令牌代替apiKey和apiSecret
};

/**
 * 上传文件到Pinata
 * @param {string} filePath - 要上传的文件路径
 * @param {string} name - 文件的显示名称
 * @param {object} metadata - 可选的元数据
 * @returns {Promise<object>} - 上传结果，包含IpfsHash
 */
async function uploadFileToPinata(filePath, name, metadata = {}) {
  try {
    console.log(`正在上传文件: ${filePath}`);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 创建FormData
    const formData = new FormData();

    // 添加文件数据
    const fileStream = fs.createReadStream(filePath);
    formData.append("file", fileStream);

    // 添加pinata选项
    const pinataOptions = {
      cidVersion: 0,
      customPinPolicy: {
        regions: [
          {
            id: "FRA1",
            desiredReplicationCount: 1,
          },
          {
            id: "NYC1",
            desiredReplicationCount: 2,
          },
        ],
      },
    };

    // 准备元数据
    const pinataMetadata = {
      name: name || path.basename(filePath),
      keyvalues: metadata,
    };

    formData.append("pinataOptions", JSON.stringify(pinataOptions));
    formData.append("pinataMetadata", JSON.stringify(pinataMetadata));

    // 设置请求头
    const headers = {
      "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
    };

    // 使用JWT或API密钥
    if (PINATA_CONFIG.jwt) {
      headers.Authorization = `Bearer ${PINATA_CONFIG.jwt}`;
    } else {
      headers.pinata_api_key = PINATA_CONFIG.apiKey;
      headers.pinata_secret_api_key = PINATA_CONFIG.apiSecret;
    }

    // 发送上传请求
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      { headers }
    );

    console.log(`✅ 上传成功! IPFS哈希: ${response.data.IpfsHash}`);

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
      name: pinataMetadata.name,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
    };
  } catch (error) {
    console.error(`❌ 上传失败: ${error.message}`);
    if (error.response) {
      console.error(`服务器响应: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * 上传JSON数据到Pinata
 * @param {object} jsonData - 要上传的JSON数据
 * @param {string} name - 数据的显示名称
 * @param {object} metadata - 可选的元数据
 * @returns {Promise<object>} - 上传结果，包含IpfsHash
 */
async function uploadJsonToPinata(jsonData, name, metadata = {}) {
  try {
    console.log(`正在上传JSON数据: ${name}`);

    // 准备元数据
    const pinataMetadata = {
      name: name,
      keyvalues: metadata,
    };

    // 准备内容
    const data = {
      pinataOptions: {
        cidVersion: 0,
      },
      pinataMetadata: pinataMetadata,
      pinataContent: jsonData,
    };

    // 设置请求头
    const headers = {};

    // 使用JWT或API密钥
    if (PINATA_CONFIG.jwt) {
      headers.Authorization = `Bearer ${PINATA_CONFIG.jwt}`;
    } else {
      headers.pinata_api_key = PINATA_CONFIG.apiKey;
      headers.pinata_secret_api_key = PINATA_CONFIG.apiSecret;
    }

    // 发送上传请求
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      data,
      { headers }
    );

    console.log(`✅ JSON上传成功! IPFS哈希: ${response.data.IpfsHash}`);

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
      name: pinataMetadata.name,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
    };
  } catch (error) {
    console.error(`❌ JSON上传失败: ${error.message}`);
    if (error.response) {
      console.error(`服务器响应: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * 从Pinata下载文件
 * @param {string} ipfsHash - IPFS哈希值
 * @param {string} filename - 保存的文件名
 * @returns {Promise<string>} - 下载的文件路径
 */
async function downloadFromPinata(ipfsHash, filename) {
  try {
    // 解析IPFS哈希
    if (ipfsHash.startsWith("ipfs://")) {
      ipfsHash = ipfsHash.substring(7);
    }

    // 如果包含路径，只取哈希部分
    if (ipfsHash.includes("/")) {
      ipfsHash = ipfsHash.split("/")[0];
    }

    // 设置文件名
    const outputFilename = filename || `${ipfsHash}`;
    const outputPath = path.join(downloadDir, outputFilename);

    console.log(`从Pinata下载: ${ipfsHash}`);

    // 使用Pinata网关URL
    const pinataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    // 下载文件
    const response = await axios({
      method: "GET",
      url: pinataGatewayUrl,
      responseType: "stream",
    });

    // 将响应流写入文件
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`✅ 文件下载成功: ${outputPath}`);
        resolve(outputPath);
      });
      writer.on("error", (err) => {
        console.error(`❌ 写入文件时出错: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`❌ 下载失败: ${error.message}`);
    throw error;
  }
}

/**
 * 列出Pinata上的文件
 * @param {number} limit - 返回的记录数量
 * @returns {Promise<Array>} - 文件列表
 */
async function listPinataFiles(limit = 10) {
  try {
    console.log("获取Pinata文件列表...");

    // 设置请求参数
    const params = {
      status: "pinned",
      pageLimit: limit,
      pageOffset: 0,
    };

    // 设置请求头
    const headers = {};

    // 使用JWT或API密钥
    if (PINATA_CONFIG.jwt) {
      headers.Authorization = `Bearer ${PINATA_CONFIG.jwt}`;
    } else {
      headers.pinata_api_key = PINATA_CONFIG.apiKey;
      headers.pinata_secret_api_key = PINATA_CONFIG.apiSecret;
    }

    // 发送请求
    const response = await axios.get("https://api.pinata.cloud/data/pinList", {
      params,
      headers,
    });

    console.log(`✅ 获取到${response.data.rows.length}个文件`);

    return response.data.rows;
  } catch (error) {
    console.error(`❌ 获取文件列表失败: ${error.message}`);
    if (error.response) {
      console.error(`服务器响应: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * 删除Pinata上的文件
 * @param {string} ipfsHash - 要删除的文件的IPFS哈希
 * @returns {Promise<boolean>} - 是否成功删除
 */
async function unpinFromPinata(ipfsHash) {
  try {
    console.log(`从Pinata取消固定: ${ipfsHash}`);

    // 设置请求头
    const headers = {};

    // 使用JWT或API密钥
    if (PINATA_CONFIG.jwt) {
      headers.Authorization = `Bearer ${PINATA_CONFIG.jwt}`;
    } else {
      headers.pinata_api_key = PINATA_CONFIG.apiKey;
      headers.pinata_secret_api_key = PINATA_CONFIG.apiSecret;
    }

    // 发送请求
    await axios.delete(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
      headers,
    });

    console.log(`✅ 成功从Pinata取消固定: ${ipfsHash}`);

    return true;
  } catch (error) {
    console.error(`❌ 取消固定失败: ${error.message}`);
    if (error.response) {
      console.error(`服务器响应: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * 创建NFT元数据并上传到Pinata
 * @param {object} metadata - NFT元数据
 * @param {string} imageFilePath - 图片文件路径
 * @returns {Promise<object>} - 上传结果
 */
async function createAndUploadNft(metadata, imageFilePath) {
  try {
    // 1. 上传图片
    console.log("上传NFT图片...");
    const imageResult = await uploadFileToPinata(
      imageFilePath,
      `${metadata.name} Image`,
      { type: "image", nft: metadata.name }
    );

    // 2. 创建完整元数据
    const nftMetadata = {
      ...metadata,
      image: `ipfs://${imageResult.ipfsHash}`,
    };

    // 3. 上传元数据
    console.log("上传NFT元数据...");
    const metadataResult = await uploadJsonToPinata(
      nftMetadata,
      `${metadata.name} Metadata`,
      { type: "metadata", nft: metadata.name }
    );

    return {
      success: true,
      image: {
        ipfsHash: imageResult.ipfsHash,
        url: imageResult.pinataUrl,
        ipfsUrl: `ipfs://${imageResult.ipfsHash}`,
      },
      metadata: {
        ipfsHash: metadataResult.ipfsHash,
        url: metadataResult.pinataUrl,
        ipfsUrl: `ipfs://${metadataResult.ipfsHash}`,
      },
      nftMetadata: nftMetadata,
    };
  } catch (error) {
    console.error(`❌ NFT创建失败: ${error.message}`);
    throw error;
  }
}

/**
 * 上传整个文件夹到Pinata
 * @param {string} folderPath - 文件夹路径
 * @param {string} name - 文件夹名称
 * @returns {Promise<object>} - 上传结果
 */
async function uploadFolderToPinata(folderPath, name) {
  try {
    console.log(`正在上传文件夹: ${folderPath}`);

    // 检查文件夹是否存在
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      throw new Error(`文件夹不存在: ${folderPath}`);
    }

    // 创建FormData
    const formData = new FormData();

    // 递归函数，添加文件夹中的所有文件
    const addFilesRecursively = (dir, baseDir = "") => {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const relativePath = path.join(baseDir, file);

        if (fs.statSync(filePath).isDirectory()) {
          addFilesRecursively(filePath, relativePath);
        } else {
          const fileStream = fs.createReadStream(filePath);
          formData.append("file", fileStream, {
            filepath: relativePath,
          });
        }
      });
    };

    // 添加文件夹中的所有文件
    addFilesRecursively(folderPath);

    // 添加pinata选项
    const pinataOptions = {
      cidVersion: 0,
      wrapWithDirectory: true,
    };

    // 准备元数据
    const pinataMetadata = {
      name: name || path.basename(folderPath),
      keyvalues: {
        type: "folder",
      },
    };

    formData.append("pinataOptions", JSON.stringify(pinataOptions));
    formData.append("pinataMetadata", JSON.stringify(pinataMetadata));

    // 设置请求头
    const headers = {
      "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
    };

    // 使用JWT或API密钥
    if (PINATA_CONFIG.jwt) {
      headers.Authorization = `Bearer ${PINATA_CONFIG.jwt}`;
    } else {
      headers.pinata_api_key = PINATA_CONFIG.apiKey;
      headers.pinata_secret_api_key = PINATA_CONFIG.apiSecret;
    }

    // 发送上传请求
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      { headers }
    );

    console.log(`✅ 文件夹上传成功! IPFS哈希: ${response.data.IpfsHash}`);

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
      name: pinataMetadata.name,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
    };
  } catch (error) {
    console.error(`❌ 上传文件夹失败: ${error.message}`);
    if (error.response) {
      console.error(`服务器响应: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// 命令行参数处理
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node pinata-tools.js upload-file <文件路径> [名称]
  node pinata-tools.js upload-json <JSON文件路径> [名称]
  node pinata-tools.js upload-folder <文件夹路径> [名称]
  node pinata-tools.js download <IPFS哈希> [文件名]
  node pinata-tools.js list [记录数量]
  node pinata-tools.js unpin <IPFS哈希>
  node pinata-tools.js create-nft <元数据文件路径> <图片文件路径>

示例:
  node pinata-tools.js upload-file ./images/my-image.png "我的图片"
  node pinata-tools.js upload-json ./metadata.json "NFT元数据"
  node pinata-tools.js upload-folder ./collection "我的NFT合集"
  node pinata-tools.js download QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco my_image.png
  node pinata-tools.js list 20
  node pinata-tools.js unpin QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
  node pinata-tools.js create-nft ./metadata.json ./images/nft-image.png
`);
    return;
  }

  // 检查API配置
  if (
    (!PINATA_CONFIG.apiKey || !PINATA_CONFIG.apiSecret) &&
    !PINATA_CONFIG.jwt
  ) {
    console.error(
      "❌ 请先在代码中设置您的Pinata API密钥和密钥密码，或者JWT令牌"
    );
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case "upload-file":
        if (!args[1]) {
          console.error("❌ 请提供文件路径");
          return;
        }
        await uploadFileToPinata(args[1], args[2]);
        break;

      case "upload-json":
        if (!args[1]) {
          console.error("❌ 请提供JSON文件路径");
          return;
        }
        const jsonData = JSON.parse(fs.readFileSync(args[1], "utf8"));
        await uploadJsonToPinata(jsonData, args[2] || path.basename(args[1]));
        break;

      case "upload-folder":
        if (!args[1]) {
          console.error("❌ 请提供文件夹路径");
          return;
        }
        await uploadFolderToPinata(args[1], args[2]);
        break;

      case "download":
        if (!args[1]) {
          console.error("❌ 请提供IPFS哈希");
          return;
        }
        await downloadFromPinata(args[1], args[2]);
        break;

      case "list":
        const limit = args[1] ? parseInt(args[1]) : 10;
        const files = await listPinataFiles(limit);
        console.log("Pinata文件列表:");
        files.forEach((file, index) => {
          console.log(`${index + 1}. ${file.metadata.name || "Unnamed"}`);
          console.log(`   Hash: ${file.ipfs_pin_hash}`);
          console.log(`   Size: ${file.size} bytes`);
          console.log(
            `   Pinned: ${new Date(file.date_pinned).toLocaleString()}`
          );
          console.log(
            `   URL: https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`
          );
          console.log("---");
        });
        break;

      case "unpin":
        if (!args[1]) {
          console.error("❌ 请提供IPFS哈希");
          return;
        }
        await unpinFromPinata(args[1]);
        break;

      case "create-nft":
        if (!args[1] || !args[2]) {
          console.error("❌ 请提供元数据文件路径和图片文件路径");
          return;
        }
        const metadata = JSON.parse(fs.readFileSync(args[1], "utf8"));
        const result = await createAndUploadNft(metadata, args[2]);
        console.log("NFT创建成功:");
        console.log(`图片IPFS: ${result.image.ipfsUrl}`);
        console.log(`元数据IPFS: ${result.metadata.ipfsUrl}`);
        console.log(`Pinata查看: ${result.metadata.url}`);
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
  uploadFileToPinata,
  uploadJsonToPinata,
  downloadFromPinata,
  listPinataFiles,
  unpinFromPinata,
  createAndUploadNft,
  uploadFolderToPinata,
};

// 如果直接运行此脚本，则执行main函数
if (require.main === module) {
  main();
}
