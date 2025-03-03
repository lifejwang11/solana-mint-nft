const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/**
 * 使用Anchor CLI铸造NFT
 */
async function mintWithAnchor() {
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

    // 4. 创建临时的Anchor测试文件
    const testDir = path.join(__dirname, "../tests");
    const testFilePath = path.join(testDir, "mint-temp.ts");

    // 确保测试目录存在
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // 创建测试文件内容
    const testFileContent = `
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftTest } from "../target/types/nft_test";
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";

// 元数据程序ID
const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function main() {
  // 配置客户端使用指定集群
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftTest as Program<NftTest>;

  // NFT元数据
  const name = "${name}";
  const symbol = "${symbol}";
  const uri = "${uri}";

  console.log("铸造NFT:", name, symbol, uri);

  // 派生铸币账户地址
  const [mintPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  // 派生元数据账户地址
  const [metadataAccount] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPDA.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  // 派生主版本账户地址
  const [masterEditionAccount] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPDA.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  );

  // 获取关联代币账户地址
  const tokenAccount = await anchor.utils.token.associatedAddress({
    mint: mintPDA,
    owner: provider.wallet.publicKey,
  });

  console.log("铸币账户:", mintPDA.toString());
  console.log("元数据账户:", metadataAccount.toString());
  console.log("主版本账户:", masterEditionAccount.toString());
  console.log("代币账户:", tokenAccount.toString());

  // 铸造NFT
  const tx = await program.methods
    .mintNft(name, symbol, uri)
    .accounts({
      payer: provider.wallet.publicKey,
      mint: mintPDA,
      mintAuthority: provider.wallet.publicKey,
      tokenAccount: tokenAccount,
      metadata: metadataAccount,
      masterEdition: masterEditionAccount,
      tokenMetadataProgram: METADATA_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log("铸造NFT交易签名:", tx);
  console.log(\`https://explorer.solana.com/tx/\${tx}?cluster=${cluster}\`);

  // 保存铸造结果
  const result = {
    name,
    symbol,
    uri,
    mint: mintPDA.toString(),
    tokenAccount: tokenAccount.toString(),
    txSignature: tx,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "./mint-result.json", 
    JSON.stringify(result, null, 2)
  );
  
  console.log("铸造结果已保存到 mint-result.json");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
`;

    // 写入测试文件
    fs.writeFileSync(testFilePath, testFileContent);
    console.log(`临时测试文件已创建: ${testFilePath}`);

    // 5. 构建Anchor命令
    const command = `cd ${path.join(
      __dirname,
      ".."
    )} && anchor test --skip-build --skip-deploy tests/mint-temp.ts -- --provider.cluster ${cluster}`;

    console.log("\n执行命令:");
    console.log(command);

    // 6. 执行命令
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`\n❌ 铸造失败: ${error.message}`);
        console.error(stderr);
        return;
      }

      console.log("\n✅ 命令执行结果:");
      console.log(stdout);

      // 清理临时文件
      try {
        fs.unlinkSync(testFilePath);
        console.log(`临时测试文件已删除: ${testFilePath}`);
      } catch (err) {
        console.warn(`无法删除临时文件: ${err.message}`);
      }

      // 显示成功消息
      console.log(`
铸造已完成！请检查上面的输出以确认是否成功。

NFT信息:
名称: ${name}
符号: ${symbol}
URI: ${uri}

如果铸造成功，您可以在mint-result.json文件中找到详细信息。
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
  node mint-with-anchor.js [cluster]

参数:
  cluster - 可选，网络环境 (mainnet, devnet, testnet)，默认为devnet

示例:
  node mint-with-anchor.js
  node mint-with-anchor.js devnet
  node mint-with-anchor.js mainnet
`);
    return;
  }

  mintWithAnchor();
}

main();
