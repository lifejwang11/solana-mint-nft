import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftTest } from "../target/types/nft_test";
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";

describe("NFT铸造测试", () => {
  // 配置客户端使用本地集群
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftTest as Program<NftTest>;

  // 使用deploy-keypair.json作为钱包
  const rawdata = fs.readFileSync("./deploy-keypair.json", "utf8");
  const keypairData = JSON.parse(rawdata);
  const wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));

  // 元数据程序ID
  const METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  it("铸造NFT", async () => {
    // NFT元数据
    const name = "测试NFT";
    const symbol = "TNFT";
    const uri = "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq"; // 使用IPFS URI

    // 派生铸币账户地址
    const [mintPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), wallet.publicKey.toBuffer()],
      program.programId
    );

    // 派生铸币权限地址
    const [mintAuthority] = await PublicKey.findProgramAddressSync(
      [Buffer.from("mint_auth"), mintPDA.toBuffer()],
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
      owner: wallet.publicKey,
    });

    console.log("铸币账户:", mintPDA.toString());
    console.log("铸币权限:", mintAuthority.toString());
    console.log("元数据账户:", metadataAccount.toString());
    console.log("主版本账户:", masterEditionAccount.toString());
    console.log("代币账户:", tokenAccount.toString());

    // 铸造NFT
    const tx = await program.methods
      .mintNft(name, symbol, uri)
      .accounts({
        payer: wallet.publicKey,
        mint: mintPDA,
        mintAuthority: mintAuthority,
        tokenAccount: tokenAccount,
        metadata: metadataAccount,
        masterEdition: masterEditionAccount,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([wallet])
      .rpc();

    console.log("铸造NFT交易签名:", tx);

    // 验证NFT是否铸造成功
    const tokenBalance = await provider.connection.getTokenAccountBalance(
      tokenAccount
    );
    console.log("代币余额:", tokenBalance.value.uiAmount);

    // 确保代币余额为1
    assert.equal(tokenBalance.value.uiAmount, 1, "NFT代币应该只有1个");
  });
});
