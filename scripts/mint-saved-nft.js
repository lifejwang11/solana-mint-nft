const fs = require("fs");
const path = require("path");
const {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} = require("@solana/web3.js");
const {
  Program,
  AnchorProvider,
  BN,
  utils,
  Wallet,
} = require("@coral-xyz/anchor");
const {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");

// 加载IDL
const idlPath = path.join(__dirname, "../target/idl/nft_test.json");
let idl;
try {
  idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
} catch (e) {
  console.error("无法加载IDL文件，请确保已经构建了项目: ", e.message);
  console.log('请先运行 "anchor build" 命令');
  process.exit(1);
}

// 程序ID
const PROGRAM_ID = "6NZLquyhsNFA9GvspjQJ26Am1PzCdkhqdKtpHbtCjyDH";
// Metaplex元数据程序ID
const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

/**
 * 使用已保存的数据铸造NFT
 */
async function mintSavedNft() {
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
    const connection = new Connection(url, "confirmed");

    // 3. 设置钱包
    const keypairPath = path.join(__dirname, "../deploy-keypair.json");
    if (!fs.existsSync(keypairPath)) {
      throw new Error("钱包密钥文件不存在: " + keypairPath);
    }

    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    const wallet = new Wallet(
      Keypair.fromSecretKey(new Uint8Array(keypairData))
    );

    console.log("使用钱包地址:", wallet.publicKey.toString());
    console.log("集群环境:", cluster);

    // 4. 设置Provider
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    // 5. 创建Program实例
    const program = new Program(idl, new PublicKey(PROGRAM_ID), provider);

    // 6. 派生所需的PDA地址
    // 派生铸币账户地址
    const [mintPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log("铸币账户:", mintPDA.toString());

    // 派生元数据账户地址
    const [metadataAccount] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPDA.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    console.log("元数据账户:", metadataAccount.toString());

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

    console.log("主版本账户:", masterEditionAccount.toString());

    // 获取关联代币账户地址
    const tokenAccount = await utils.token.associatedAddress({
      mint: mintPDA,
      owner: wallet.publicKey,
    });

    console.log("代币账户:", tokenAccount.toString());

    // 7. 调用mint_nft指令
    console.log("开始铸造NFT...");
    console.log(`名称: ${mintData.name}`);
    console.log(`符号: ${mintData.symbol}`);
    console.log(`URI: ${mintData.uri}`);

    // 构建和发送交易
    const tx = await program.methods
      .mintNft(mintData.name, mintData.symbol, mintData.uri)
      .accounts({
        payer: wallet.publicKey,
        mint: mintPDA,
        mintAuthority: wallet.publicKey,
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

    console.log("✅ NFT铸造成功!");
    console.log("交易签名:", tx);
    console.log(
      `请在浏览器查看交易: https://explorer.solana.com/tx/${tx}?cluster=${cluster}`
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
  node mint-saved-nft.js [cluster]

参数:
  cluster - 可选，网络环境 (mainnet, devnet, testnet)，默认为devnet

示例:
  node mint-saved-nft.js
  node mint-saved-nft.js devnet
  node mint-saved-nft.js mainnet
`);
    return;
  }

  mintSavedNft();
}

main();
