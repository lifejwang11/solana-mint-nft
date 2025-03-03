
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
  const name = "龙的NFT";
  const symbol = "MYNFT";
  const uri = "ipfs://QmRL7Fx87sA2y1i8CsV24YT6HrmCvSBScyBbd1G4GuyT91";

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
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);

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
