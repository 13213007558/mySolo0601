import type { Ingredient, TabooMatch } from '@/types';

interface TabooRule {
  keyword: string;
  tabooName: string;
  riskLevel: '高' | '中' | '低';
  description: string;
}

const tabooRules: TabooRule[] = [
  {
    keyword: '虾仁',
    tabooName: '海鲜类过敏高敏期禁忌',
    riskLevel: '高',
    description: '6月龄以内婴幼儿尚未建立海鲜耐受，虾仁为常见高致敏原，按本中心规范禁用。',
  },
  {
    keyword: '虾',
    tabooName: '海鲜类过敏高敏期禁忌',
    riskLevel: '高',
    description: '虾类为常见高致敏原，婴幼儿早期辅食应避免。',
  },
  {
    keyword: '蟹',
    tabooName: '海鲜类过敏高敏期禁忌',
    riskLevel: '高',
    description: '蟹类为易致敏食物，婴幼儿早期辅食建议禁用。',
  },
  {
    keyword: '花生',
    tabooName: '坚果类早期添加禁忌',
    riskLevel: '中',
    description: '常规花生制品通常建议 12 月龄后引入，高敏宝宝需在医生指导下使用。',
  },
  {
    keyword: '蜂蜜',
    tabooName: '婴儿蜂蜜绝对禁忌',
    riskLevel: '高',
    description: '1 岁以内婴儿严禁食用蜂蜜，存在肉毒杆菌芽孢中毒风险。',
  },
  {
    keyword: '盐',
    tabooName: '钠摄入过量禁忌',
    riskLevel: '中',
    description: '婴幼儿辅食应避免额外加盐，1 岁以内以天然食物原味为主。',
  },
  {
    keyword: '蛋清',
    tabooName: '蛋清早期添加禁忌',
    riskLevel: '中',
    description: '蛋清建议 8 月龄后添加，早期仅食用蛋黄以减少过敏风险。',
  },
];

export function matchTaboos(ingredients: Ingredient[]): TabooMatch[] {
  const matches: TabooMatch[] = [];
  for (const ing of ingredients) {
    for (const rule of tabooRules) {
      if (ing.name.includes(rule.keyword) && !ing.name.includes('低敏')) {
        matches.push({
          ingredientName: ing.name,
          tabooName: rule.tabooName,
          riskLevel: rule.riskLevel,
          description: rule.description,
        });
      }
    }
  }
  return matches;
}
