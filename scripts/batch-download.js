const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

// 下载列表文件路径
const DOWNLOAD_LIST = path.join(__dirname, "download-list.txt");

/**
 * 批量下载IPFS资源
 */
async function batchDownload() {
  try {
    // 检查下载列表是否存在
    if (!fs.existsSync(DOWNLOAD_LIST)) {
      console.log(`创建下载列表文件: ${DOWNLOAD_LIST}`);
      fs.writeFileSync(
        DOWNLOAD_LIST,
        `# 在每行添加IPFS URI或CID，可选添加空格和文件名
# 以#开头的行将被忽略
# 例如:
# ipfs://QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL
# QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL example.png
# --metadata ipfs://QmSbT73F88z2tR5gS1rkWDtADByXxNBK1SAXLwEhsyVRVL
`
      );
      console.log(
        "请编辑download-list.txt添加要下载的IPFS资源，然后重新运行此脚本"
      );
      return;
    }

    // 读取下载列表
    const content = fs.readFileSync(DOWNLOAD_LIST, "utf8");
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    if (lines.length === 0) {
      console.log("下载列表为空，请编辑download-list.txt添加要下载的IPFS资源");
      return;
    }

    console.log(`找到${lines.length}个下载任务`);

    // 依次下载
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`[${i + 1}/${lines.length}] 处理: ${line}`);

      const args = line.split(/\s+/);
      const cmd = `node ${path.join(__dirname, "download-ipfs.js")} ${args.join(
        " "
      )}`;

      try {
        const { stdout, stderr } = await exec(cmd);
        console.log(stdout);
        if (stderr) console.error(stderr);
      } catch (error) {
        console.error(`下载失败: ${error.message}`);
        // 继续下一个
      }
    }

    console.log("批量下载完成");
  } catch (error) {
    console.error(`批量下载失败: ${error.message}`);
    process.exit(1);
  }
}

batchDownload();
