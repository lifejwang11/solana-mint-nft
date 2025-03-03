import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftTest } from "../target/types/nft_test";
import { PublicKey } from "@solana/web3.js";

describe("简化NFT测试", () => {
  // 配置客户端使用本地集群
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftTest as Program<NftTest>;
  const wallet = provider.wallet;

  it("初始化程序", async () => {
    // 使用anchor程序方法构建交易并发送
    const tx = await program.methods.initialize().rpc();
    console.log("初始化交易签名:", tx);
  });
});
