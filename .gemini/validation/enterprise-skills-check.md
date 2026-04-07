# Enterprise Skills Validation

<critical>
This validation is MANDATORY and must be executed BEFORE any skill or agent logic.
DO NOT skip this step. DO NOT proceed if validation blocks execution.
</critical>

## Validation Algorithm

Follow these 7 steps in order. Each step depends on the previous one.

### Step 1: Read Local Lock File

1. Read `enterprise-skills-lock.json` from the project root.
2. If the file does not exist, treat ALL skills as missing (proceed to Step 2 with empty local skills).
3. Extract `remote.url` and `remote.branch` from the lock file.
4. Extract the `skills` object as the local skills registry.

### Step 2: Fetch Remote Repository

1. Check if the cache directory `.gemini/.enterprise-skills-cache/` exists.
2. If the cache directory exists and contains a `.git/` subdirectory:
   - Run: `git -C .gemini/.enterprise-skills-cache/ pull --ff-only`
3. If the cache directory does NOT exist:
   - Run: `git clone --depth 1 --branch {branch} {url} .gemini/.enterprise-skills-cache/`
   - Replace `{branch}` with the value from `remote.branch` (default: `main`)
   - Replace `{url}` with the value from `remote.url`
4. If the git command fails (exit code != 0), go to **Step 7 (Fallback Offline)**.

### Step 3: Read Remote Lock File

1. Read `.gemini/.enterprise-skills-cache/skills-lock.json`.
2. Parse the JSON and extract the `skills` object as the remote skills registry.
3. Each entry in `skills` is an **mandatory enterprise skill** with a `computedHash` field.

### Step 4: Compare Hashes

For each skill in the **remote** registry:
1. Check if the skill exists in the **local** registry.
2. If the skill does NOT exist locally, classify it as **missing**.
3. If the skill exists locally but `computedHash` differs (remote != local), classify it as **outdated**.
4. If the skill exists locally and `computedHash` matches, classify it as **valid**.

For each skill in the **local** registry:
1. Check if the skill still exists in the **remote** registry.
2. If it does NOT exist remotely, classify it as **removed**.

### Step 5: Execute Actions

**For each missing or outdated skill:**

1. Copy the skill directory from the cache:
   ```
   cp -r .gemini/.enterprise-skills-cache/.gemini/skills/{skill-name}/ .gemini/skills/{skill-name}/
   ```
2. Report progress:
   - Missing skill: `→ Instalando {skill-name}... OK`
   - Outdated skill: `→ Atualizando {skill-name}... OK`

**For each removed skill:**

1. Delete the skill directory:
   ```
   rm -rf .gemini/skills/{skill-name}
   ```
2. Report: `→ Removendo {skill-name}... OK`

**If all skills are valid (no actions needed):**

Report: `✓ Skills empresariais validadas`

**Summary messages after actions:**

- If skills were installed: `✓ {count} skill(s) empresarial(is) instalada(s)`
- If skills were updated: `✓ {count} skill(s) atualizada(s)`
- If skills were removed: `✓ {count} skill(s) removida(s)`

### Step 6: Update Local Lock File

1. Build the updated `enterprise-skills-lock.json` with:
   - `version`: keep as `1`
   - `remote`: keep existing values (`url`, `branch`, `provider`)
   - `lastChecked`: set to current ISO 8601 timestamp (e.g., `2026-04-04T14:30:00Z`)
   - `skills`: for each skill in the remote registry, create an entry with:
     - `computedHash`: the `computedHash` value from the remote registry
     - `installedAt`: if newly installed/updated, use current timestamp; if unchanged, keep existing value
     - `files`: list all files installed for the skill (relative paths from project root)
2. Write the updated JSON to `enterprise-skills-lock.json` in the project root.

### Step 7: Fallback Offline

This step is reached ONLY when Step 2 (git clone/pull) fails.

1. Check if `enterprise-skills-lock.json` exists AND has a non-empty `skills` object.
2. **If YES** (skills already installed locally):
   - Report: `⚠ Não foi possível verificar skills empresariais (erro de rede). Usando versão local.`
   - **ALLOW** the skill/agent to proceed with execution.
3. **If NO** (no local skills installed):
   - Report: `✗ Skills empresariais obrigatórias não encontradas. Conecte-se à internet e tente novamente, ou execute /kspec-bootstrap para instalar.`
   - **BLOCK** execution. DO NOT proceed with any subsequent steps of the skill or agent.

## Important Notes

- All git operations use standard `git` CLI commands. This is **provider-agnostic** — works with GitHub, Azure DevOps, GitLab, Bitbucket, or any git hosting accessible via URL.
- Authentication relies on the developer's existing git credentials (SSH keys, credential helpers, tokens).
- The cache directory `.gemini/.enterprise-skills-cache/` is in `.gitignore` and should NOT be committed.
- The lock file `enterprise-skills-lock.json` MUST be committed to the repository for team consistency.
- The `remote.url` in the lock file can be changed to migrate between git providers without modifying validation logic.
