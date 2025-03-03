import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftTest } from "../target/types/nft_test";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import * as fs from "fs";
import * as assert from "assert";

describe("简化代币铸造测试", () => {
  // 配置客户端使用本地集群
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // 使用deploy-keypair.json作为钱包
  const rawdata = fs.readFileSync("./deploy-keypair.json", "utf8");
  const keypairData = JSON.parse(rawdata);
  const wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));

  it("铸造基本代币", async () => {
    console.log("钱包地址:", wallet.publicKey.toString());

    // 创建一个新的代币铸币账户
    const mintKeypair = Keypair.generate();
    console.log("铸币账户:", mintKeypair.publicKey.toString());

    // 创建铸币账户
    const mint = await createMint(
      provider.connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      0 // 0小数位 = NFT
    );

    console.log("铸币账户已创建:", mint.toString());

    // 创建代币账户
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet,
      mint,
      wallet.publicKey
    );

    console.log("代币账户已创建:", tokenAccount.address.toString());

    // 铸造1个代币
    await mintTo(
      provider.connection,
      wallet,
      mint,
      tokenAccount.address,
      wallet.publicKey,
      1
    );

    console.log("代币已铸造");

    // 验证代币余额
    const tokenBalance = await provider.connection.getTokenAccountBalance(
      tokenAccount.address
    );
    console.log("代币余额:", tokenBalance.value.uiAmount);

    // 确保代币余额为1
    assert.equal(tokenBalance.value.uiAmount, 1, "代币应该只有1个");
  });
});
