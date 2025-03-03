use anchor_lang::prelude::*;

pub mod nft_simple {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("初始化简化NFT程序");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {} 