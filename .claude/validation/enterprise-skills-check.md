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

1. Check if the cache directory `.claude/.enterprise-skills-cache/` exists.
2. If the cache directory exists and contains a `.git/` subdirectory:
   - Run: `git -C .claude/.enterprise-skills-cache/ pull --ff-only`
3. If the cache directory does NOT exist:
   - Run: `git clone --depth 1 --branch {branch} {url} .claude/.enterprise-skills-cache/`
   - Replace `{branch}` with the value from `remote.branch` (default: `main`)
   - Replace `{url}` with the value from `remote.url`
4. If the git command fails (exit code != 0), go to **Step 7 (Fallback Offline)**.

### Step 3: Read Remote Lock File

1. Read `.claude/.enterprise-skills-cache/skills-lock.json`.
2. Parse the JSON and extract three registries:
   - `skills` — mandatory enterprise skills
   - `rules` — mandatory enterprise rules
   - `templates` — mandatory enterprise templates
3. Each entry in any registry has a `computedHash` field.

### Step 4: Compare Hashes

Repeat the following comparison for each of the three registries (`skills`, `rules`, `templates`):

For each entry in the **remote** registry:
1. Check if the entry exists in the **local** registry of the same type.
2. If it does NOT exist locally, classify it as **missing**.
3. If it exists locally but `computedHash` differs, classify it as **outdated**.
4. If it exists locally and `computedHash` matches, classify it as **valid**.

For each entry in the **local** registry:
1. If it does NOT exist in the **remote** registry, classify it as **removed**.

### Step 5: Execute Actions

**Deriving `{basename}` from `{name}`:**
Rule and template names in the lock file may contain a category prefix (e.g., `frontend/react`).
Derive `{basename}` as the last segment of `{name}` (e.g., `react` from `frontend/react`).
If `{name}` has no `/`, then `{basename}` = `{name}`.
This allows the enterprise repo to organize by category while the project keeps rules flat.

**For each missing or outdated skill:**
1. Copy: `cp -r .claude/.enterprise-skills-cache/.agents/skills/{name}/ .agents/skills/{name}/`
2. Symlink: `ln -sfn ../../.agents/skills/{name} .claude/skills/{name}`

**For each missing or outdated rule:**
1. Copy: `cp .claude/.enterprise-skills-cache/.agents/rules/{name}.md .agents/rules/{basename}.md`
2. Symlink: `ln -sfn ../../.agents/rules/{basename}.md .claude/rules/{basename}.md`

**For each missing or outdated template:**
1. Copy: `cp .claude/.enterprise-skills-cache/.agents/templates/{name}.md .agents/templates/{basename}.md`
2. Symlink: `ln -sfn ../../.agents/templates/{basename}.md .claude/templates/{basename}.md`

**For each removed entry:**
- Skills: `rm -rf .agents/skills/{name}` and `rm -f .claude/skills/{name}`
- Rules: `rm -f .agents/rules/{basename}.md` and `rm -f .claude/rules/{basename}.md`
- Templates: `rm -f .agents/templates/{basename}.md` and `rm -f .claude/templates/{basename}.md`

**Progress messages:**
- Skills: `→ Instalando skill {name}... OK` / `→ Atualizando skill {name}... OK`
- Rules: `→ Instalando rule {name}... OK` / `→ Atualizando rule {name}... OK`
- Templates: `→ Instalando template {name}... OK` / `→ Atualizando template {name}... OK`
- Removed: `→ Removendo {type} {name}... OK`

**If all entries are valid (no actions needed):**
Report: `✓ Artefatos empresariais validados`

**Summary messages:**
- `✓ {count} skill(s) empresarial(is) instalada(s)/atualizada(s)`
- `✓ {count} rule(s) empresarial(is) instalada(s)/atualizada(s)`
- `✓ {count} template(s) empresarial(is) instalado(s)/atualizado(s)`

### Step 6: Update Local Lock File

1. Build the updated `enterprise-skills-lock.json` with:
   - `version`: set to `2`
   - `remote`: keep existing values
   - `lastChecked`: current ISO 8601 timestamp
   - `skills`: for each skill in remote registry, entry with computedHash, installedAt, files
   - `rules`: for each rule in remote registry, entry with computedHash, installedAt, files
   - `templates`: for each template in remote registry, entry with computedHash, installedAt, files
2. Write to `enterprise-skills-lock.json` in project root.

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
- The enterprise artifacts cache `.claude/.enterprise-skills-cache/` is in `.gitignore` and should NOT be committed.
- The lock file `enterprise-skills-lock.json` MUST be committed to the repository for team consistency.
- The `remote.url` in the lock file can be changed to migrate between git providers without modifying validation logic.
- The validation supports three types of artifacts: skills, rules, and templates. All three follow the same hash-based versioning and are managed independently.
