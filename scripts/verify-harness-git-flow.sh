#!/usr/bin/env bash
set -euo pipefail

head_ref="${PR_HEAD_REF:-${GITHUB_HEAD_REF:-$(git branch --show-current)}}"
base_ref="${PR_BASE_REF:-}"
base_sha="${PR_BASE_SHA:-}"
work_pattern='^(feat|fix|hotfix|refactor|docs|test|security|chore|release)/[a-z0-9]+(-[a-z0-9]+)*$'
safe_ref_pattern='^[0-9A-Za-z._/-]+$'

fail() {
  printf '하네스 Git 흐름 검증 실패: %s\n' "$1" >&2
  exit 1
}

[[ -n "$head_ref" ]] || fail 'PR head 브랜치가 비어 있음'
[[ "$head_ref" =~ $safe_ref_pattern ]] || fail "허용되지 않은 head ref: $head_ref"
[[ "$head_ref" != -* && "$head_ref" != *..* ]] || fail "위험한 head ref: $head_ref"

case "$base_ref" in
  feature)
    [[ "$head_ref" =~ $work_pattern ]] || fail "작업 PR은 <type>/<kebab-case> → feature여야 함: $head_ref → $base_ref"
    ;;
  main)
    [[ "$head_ref" == feature ]] || fail "release PR은 feature → main이어야 함: $head_ref → $base_ref"
    ;;
  *)
    fail "PR base는 feature 또는 main이어야 함: $base_ref"
    ;;
esac

if [[ -n "$base_sha" ]]; then
  [[ "$base_sha" =~ ^[0-9a-f]{40}$ ]] || fail "잘못된 base SHA: $base_sha"
  git cat-file -e "${base_sha}^{commit}" 2>/dev/null || fail "base commit을 찾을 수 없음: $base_sha"
  git merge-base --is-ancestor "$base_sha" HEAD || fail '현재 PR HEAD가 base commit을 포함하지 않음'
fi

printf '하네스 Git 흐름 검증 통과: %s → %s\n' "$head_ref" "$base_ref"
