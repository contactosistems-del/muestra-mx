import type { Survey, SurveyOption } from '../../domain/models';

export function optionKeys(opt: SurveyOption): string[] {
  return [...new Set([opt.id, opt.label, opt.voteValue, ...(opt.aliases ?? [])].filter(Boolean) as string[])];
}

function softKeyMatch(value: string, key: string): boolean {
  const v = value.trim();
  const k = key.trim();
  if (!v || !k) return false;
  return v === k || v.startsWith(`${k} `) || k.startsWith(`${v} `);
}

function findByKeys(options: SurveyOption[], value: string): SurveyOption | undefined {
  const exact = options.find((opt) => optionKeys(opt).includes(value));
  if (exact) return exact;
  const soft = options.filter((opt) => optionKeys(opt).some((key) => softKeyMatch(value, key)));
  return soft.length === 1 ? soft[0] : undefined;
}

export function matchSurveyOption(
  survey: Survey,
  opcion: string,
  previous?: Survey | null,
): SurveyOption | undefined {
  const value = String(opcion ?? '').trim();
  if (!value) return undefined;

  const current = findByKeys(survey.options, value);
  if (current) return current;

  if (previous) {
    const prevOpt = findByKeys(previous.options, value);
    if (prevOpt) {
      const byId = survey.options.find((opt) => opt.id === prevOpt.id);
      if (byId) return byId;
    }
  }

  return undefined;
}

export function enrichOptionsWithVoteAliases(
  survey: Survey,
  voteOptions: string[],
  previous?: Survey | null,
): SurveyOption[] {
  return survey.options.map((opt) => {
    const aliases = new Set<string>(opt.aliases ?? []);
    const prev = previous?.options.find((item) => item.id === opt.id);
    if (prev) optionKeys(prev).forEach((key) => aliases.add(key));

    const probe: SurveyOption = {
      ...opt,
      aliases: [...aliases],
    };
    voteOptions.forEach((raw) => {
      const value = String(raw ?? '').trim();
      if (!value) return;
      if (optionKeys(probe).some((key) => softKeyMatch(value, key))) {
        aliases.add(value);
      } else if (prev && optionKeys(prev).some((key) => softKeyMatch(value, key))) {
        aliases.add(value);
      }
    });

    aliases.delete(opt.id);
    aliases.delete(opt.label);
    if (opt.voteValue) aliases.delete(opt.voteValue);

    return {
      ...opt,
      ...(aliases.size ? { aliases: [...aliases] } : { aliases: undefined }),
    };
  });
}

export function countForOption(opt: SurveyOption, counts: Record<string, number>): number {
  if (Object.prototype.hasOwnProperty.call(counts, opt.id)) {
    return Number(counts[opt.id]) || 0;
  }
  const seen = new Set<string>();
  let sum = 0;
  for (const key of optionKeys(opt)) {
    if (seen.has(key)) continue;
    seen.add(key);
    sum += Number(counts[key]) || 0;
  }
  return sum;
}
