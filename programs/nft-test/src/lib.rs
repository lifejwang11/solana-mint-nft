use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, MintTo},
};
use solana_program::program::invoke;
use solana_program::instruction::AccountMeta;

// 声明程序ID
declare_id!("6NZLquyhsNFA9GvspjQJ26Am1PzCdkhqdKtpHbtCjyDH");

// 简化模块
mod simple;

// Metaplex程序ID
pub const METADATA_PROGRAM_ID: &str = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

#[program]
pub mod nft_test {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("初始化NFT程序");
        Ok(())
    }

    pub fn mint_nft(
        ctx: Context<MintNFT>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        msg!("开始铸造NFT");
        
        // 1. 铸造代币
        // 先铸造一个代币到代币账户
        anchor_spl::token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            1, // 只铸造1个NFT代币
        )?;
        
        // 2. 创建元数据账户 - 使用低级别的CPI调用
        // 创建元数据账户的指令数据
        let metadata_program_id = ctx.accounts.token_metadata_program.key();
        
        // 创建元数据账户的指令
        let create_metadata_ix = create_metadata_accounts_v3(
            metadata_program_id,
            ctx.accounts.metadata.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.payer.key(),
            ctx.accounts.payer.key(),
            ctx.accounts.payer.key(),
            name,
            symbol,
            uri,
            ctx.accounts.payer.key(),
        );
        
        // 执行创建元数据账户的指令
        invoke(
            &create_metadata_ix,
            &[
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;
        
        // 3. 创建主NFT（Master Edition）
        let master_edition_ix = create_master_edition_v3(
            metadata_program_id,
            ctx.accounts.master_edition.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.payer.key(),
            ctx.accounts.payer.key(),
            ctx.accounts.metadata.key(),
            ctx.accounts.payer.key(),
            0, // max_supply: 0表示限量版，只有一个NFT
        );
        
        // 执行创建主NFT指令
        invoke(
            &master_edition_ix,
            &[
                ctx.accounts.master_edition.to_account_info(),
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;
        
        msg!("NFT铸造成功");
        
        Ok(())
    }
}

// 自定义函数来创建元数据账户指令
fn create_metadata_accounts_v3(
    program_id: Pubkey,
    metadata_account: Pubkey,
    mint: Pubkey,
    mint_authority: Pubkey,
    payer: Pubkey,
    update_authority: Pubkey,
    name: String,
    symbol: String,
    uri: String,
    creator: Pubkey,
) -> solana_program::instruction::Instruction {
    let accounts = vec![
        AccountMeta::new(metadata_account, false),
        AccountMeta::new_readonly(mint, false),
        AccountMeta::new_readonly(mint_authority, true),
        AccountMeta::new(payer, true),
        AccountMeta::new_readonly(update_authority, true),
        AccountMeta::new_readonly(solana_program::system_program::id(), false),
        AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
    ];

    // 创建指令数据
    // 指令索引为33，对应create_metadata_accounts_v3
    let mut data = vec![33];
    
    // 添加名称
    data.push(name.len() as u8);
    data.extend_from_slice(name.as_bytes());
    
    // 添加符号
    data.push(symbol.len() as u8);
    data.extend_from_slice(symbol.as_bytes());
    
    // 添加URI
    data.push(uri.len() as u8);
    data.extend_from_slice(uri.as_bytes());
    
    // 添加版税 (100 = 1%)
    data.push(100);
    
    // 添加创作者信息
    data.push(1); // 创作者数量
    data.extend_from_slice(&creator.to_bytes());
    data.push(1); // 已验证
    data.push(100); // 份额 100%
    
    // 其他参数
    data.push(1); // update_authority_is_signer
    data.push(1); // is_mutable
    data.push(0); // 无collection
    data.push(0); // 无uses
    data.push(0); // 无collection_details

    solana_program::instruction::Instruction {
        program_id,
        accounts,
        data,
    }
}

// 自定义函数来创建主版本指令
fn create_master_edition_v3(
    program_id: Pubkey,
    edition: Pubkey,
    mint: Pubkey,
    update_authority: Pubkey,
    mint_authority: Pubkey,
    metadata: Pubkey,
    payer: Pubkey,
    max_supply: u64,
) -> solana_program::instruction::Instruction {
    let accounts = vec![
        AccountMeta::new(edition, false),
        AccountMeta::new(mint, false),
        AccountMeta::new_readonly(update_authority, true),
        AccountMeta::new_readonly(mint_authority, true),
        AccountMeta::new(payer, true),
        AccountMeta::new_readonly(metadata, false),
        AccountMeta::new_readonly(anchor_spl::token::ID, false),
        AccountMeta::new_readonly(solana_program::system_program::id(), false),
        AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
    ];

    // 创建指令数据
    // 指令索引为37，对应create_master_edition_v3
    let mut data = vec![37];
    
    // 添加max_supply
    data.push(1); // 有max_supply
    data.extend_from_slice(&max_supply.to_le_bytes());

    solana_program::instruction::Instruction {
        program_id,
        accounts,
        data,
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        seeds = [b"mint", payer.key().as_ref()],
        bump,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer.key(),
    )]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: 不再使用这个账户
    #[account(mut)]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    /// CHECK: 由Metaplex程序创建和验证
    #[account(
        mut,
        seeds = [
            b"metadata",
            token_metadata_program.key().as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata: UncheckedAccount<'info>,
    
    /// CHECK: 由Metaplex程序创建和验证
    #[account(
        mut,
        seeds = [
            b"metadata",
            token_metadata_program.key().as_ref(),
            mint.key().as_ref(),
            b"edition",
        ],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub master_edition: UncheckedAccount<'info>,
    
    /// CHECK: 这是Metaplex程序ID
    #[account(address = METADATA_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub token_metadata_program: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
