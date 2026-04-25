#!/usr/bin/env bash
# Claude Code status line: shows context window usage like /context command
# Format: 107.3k/200k tokens (54%)

input=$(cat)

used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

if [ -z "$used_pct" ]; then
  # No messages yet — show model name only
  echo "$input" | jq -r '.model.display_name // "Claude"'
  exit 0
fi

input_tokens=$(echo "$input" | jq -r '.context_window.current_usage.input_tokens // 0')
context_size=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')

# Format input_tokens as e.g. "107.3k"
format_k() {
  local n=$1
  if [ "$n" -ge 1000 ]; then
    printf "%.1fk" "$(echo "scale=4; $n / 1000" | bc)"
  else
    echo "$n"
  fi
}

# Format context_size as e.g. "200k"
format_ctx() {
  local n=$1
  if [ "$n" -ge 1000 ]; then
    printf "%dk" "$((n / 1000))"
  else
    echo "$n"
  fi
}

used_fmt=$(format_k "$input_tokens")
ctx_fmt=$(format_ctx "$context_size")
pct_fmt=$(printf "%.0f" "$used_pct")

printf "%s/%s tokens (%s%%)" "$used_fmt" "$ctx_fmt" "$pct_fmt"
