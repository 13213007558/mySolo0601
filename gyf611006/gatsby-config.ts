import type { GatsbyConfig } from "gatsby";

const config: GatsbyConfig = {
  siteMetadata: {
    title: `危化菱形测距端`,
    siteUrl: `https://www.example.com`,
    description: `化工园区泄漏应急处置专业测距工具，支持菱形标签四向拖拽测距、风向扇形自动修正、违规距离禁止提交`,
  },
  plugins: [
    `gatsby-plugin-typescript`,
    `gatsby-plugin-postcss`,
  ],
  flags: {
    DEV_SSR: true,
    FAST_DEV: true,
  },
};

export default config;
