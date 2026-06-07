import type {
  BabyRecord,
  FoodRestriction,
  IngredientItem,
  ValidationItem,
  ValidationStatus,
  RecordStatus,
} from '@/types';

function nameMatches(ingredientName: string, restriction: FoodRestriction): boolean {
  const target = ingredientName.trim().toLowerCase();
  if (
    restriction.ingredientName.toLowerCase().includes(target) ||
    target.includes(restriction.ingredientName.toLowerCase())
  ) {
    return true;
  }
  if (
    restriction.synonyms?.some(
      (s) => target.includes(s.toLowerCase()) || s.toLowerCase().includes(target),
    )
  ) {
    return true;
  }
  return false;
}

function buildValidationItem(
  ingredient: IngredientItem,
  restriction: FoodRestriction,
  status: ValidationStatus,
  reason: string,
  detail: string,
): ValidationItem {
  return {
    id: `val-${ingredient.id}-${restriction.id}`,
    ingredientId: ingredient.id,
    restrictionId: restriction.id,
    ingredientName: ingredient.name,
    status,
    reason,
    detail,
    amount: ingredient.amount,
    unit: ingredient.unit,
    maxAllowed: restriction.maxAmount,
    maxUnit: restriction.unit,
    mealType: ingredient.mealType,
  };
}

export function validateRecord(
  record: BabyRecord,
  ingredients: IngredientItem[],
): { validations: ValidationItem[]; status: RecordStatus } {
  const validations: ValidationItem[] = [];

  for (const ingredient of ingredients) {
    for (const restriction of record.restrictions) {
      if (!nameMatches(ingredient.name, restriction)) continue;

      if (restriction.unit !== ingredient.unit) {
        validations.push(
          buildValidationItem(
            ingredient,
            restriction,
            'unit_mismatch',
            '单位不一致需人工复核',
            `禁忌以 ${restriction.unit} 计量，食材以 ${ingredient.unit} 录入；禁忌食材「${restriction.ingredientName}」最大 ${restriction.maxAmount}${restriction.unit}，食材「${ingredient.name}」${ingredient.amount}${ingredient.unit}`,
          ),
        );
        continue;
      }

      if (restriction.maxAmount === 0 && ingredient.amount > 0) {
        validations.push(
          buildValidationItem(
            ingredient,
            restriction,
            'boundary_triggered',
            '边界值触发',
            `禁忌最大摄入量为 0${restriction.unit}（完全禁食），食材含 ${ingredient.amount}${ingredient.unit}「${ingredient.name}」`,
          ),
        );
        continue;
      }

      if (ingredient.amount > restriction.maxAmount && restriction.maxAmount !== 0) {
        validations.push(
          buildValidationItem(
            ingredient,
            restriction,
            'fail',
            '超过限量',
            `食材「${ingredient.name}」${ingredient.amount}${ingredient.unit} 超过最大限量 ${restriction.maxAmount}${restriction.unit}`,
          ),
        );
        continue;
      }

      validations.push(
        buildValidationItem(
          ingredient,
          restriction,
          ingredient.amount === restriction.maxAmount ? 'warning' : 'pass',
          ingredient.amount === restriction.maxAmount ? '达到边界值' : '安全通过',
          ingredient.amount === restriction.maxAmount
            ? `食材「${ingredient.name}」${ingredient.amount}${ingredient.unit} 刚好达到最大限量，建议人工确认`
            : `食材「${ingredient.name}」${ingredient.amount}${ingredient.unit} 在安全范围内（≤${restriction.maxAmount}${restriction.unit}）`,
        ),
      );
    }
  }

  const hasFail = validations.some(
    (v) => v.status === 'fail' || v.status === 'boundary_triggered',
  );
  const hasUnitMismatch = validations.some((v) => v.status === 'unit_mismatch');
  const hasWarning = validations.some((v) => v.status === 'warning');

  let status: RecordStatus = 'normal';
  if (hasFail) status = 'abnormal';
  else if (hasUnitMismatch) status = 'pending';
  else if (hasWarning) status = 'pending';

  if (record.override) {
    status = record.override.toStatus;
  }

  return { validations, status };
}

export function validateAllRecords(
  records: BabyRecord[],
  ingredients: IngredientItem[],
): BabyRecord[] {
  return records.map((r) => {
    const { validations, status } = validateRecord(r, ingredients);
    const finalStatus = r.override ? r.status : status;
    return { ...r, validations, status: finalStatus };
  });
}
