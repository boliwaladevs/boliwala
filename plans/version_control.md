# Version control & deployment permissions — collaborator on `main`

**Start here if you just want to do something** (push, sync a branch,
approve, merge). Everything below the Quick Reference is the investigation
log this doc grew out of — background and rationale, not a place to look
things up under time pressure.

---

# Quick Reference

## The rules of this repo, as currently configured

Live-checked against `github.com/boliwaladevs/boliwala`, re-verified
2026-08-08 (`gh api repos/boliwaladevs/boliwala/branches/main/protection`,
`gh api repos/boliwaladevs/boliwala/collaborators`).

- **`main` is protected:** requires a PR with **1 approving review** before
  merging; force-pushes and branch deletion are blocked for everyone.
  Everything else (status checks, signed commits, linear history,
  conversation resolution) is off.
- **Admins bypass the PR requirement** (`enforce_admins: false`) — an admin
  can `git push` straight to `main`. Non-admins cannot; a direct push is
  rejected with `GH006: Protected branch update failed`.
- **Collaborators today:** `boliwaladevs` (admin, bypasses the rule),
  `nesora-ops` (write, non-admin, must go through a PR).
- **A PR author can never approve their own PR** — GitHub blocks this
  regardless of which local `gh` account runs the command. With only one
  admin, every non-admin PR needs `boliwaladevs` specifically to approve it.
- **House defaults, decided in conversation, not GitHub settings — follow
  these even though GitHub wouldn't stop you doing otherwise:**
  - Syncing a stale feature branch with an advanced `main` → **merge**
    `origin/main` into the feature branch (not rebase). Reasoning: no
    history rewrite, so no force-push needed — safe even if someone else
    might have pushed to that branch too.
  - Merging an approved PR into `main` → **`--rebase`**. Reasoning: linear
    history on `main`, no merge commits, individual commits preserved
    (unlike squash).

## "Push to main" — admin only (`boliwaladevs`)

Admins can push directly; the protection rule doesn't apply to them. Still
worth pulling first so you're not pushing on top of something you haven't
seen:

```bash
gh auth switch --user boliwaladevs
git checkout main
git pull origin main
# ... make your changes, then:
git add <files>
git commit -m "..."
git push origin main
```

If you're a non-admin and try this, it will fail — see the PR flow below
instead.

## "Push to my feature branch" — anyone, including non-admins

Works the same for everyone; feature branches carry none of `main`'s
restrictions (force-push, rebase, delete freely on your own branch).

```bash
git checkout -b <branch-name>
git push -u origin <branch-name>
```

If committing under a specific identity (e.g. `nesora-ops`, distinct from
your machine's global git identity), set it locally first — `--local`
scopes this to the current repo only, and set the matching `gh` account
too, since `gh` is the credential helper that actually authenticates the
push:

```bash
git config --local user.name "nesora-ops"
git config --local user.email "ops@nesora.co.in"
gh auth switch --user nesora-ops
```

## Landing a feature branch on `main` when you're not an admin

Non-admins can't push to `main` directly — open a PR instead:

```bash
gh pr create --base main --title "..." --body "..."
```

Then it needs `boliwaladevs`'s approval before it can merge (§ rules
above). Once approved, whoever has write access can merge it — default to
`--rebase` per the house default:

```bash
gh pr merge <pr-number> --repo boliwaladevs/boliwala --rebase
```

(`--merge` keeps a merge commit; `--squash` flattens all commits into one.
Both work, `--rebase` is just the default going forward — swap in whichever
fits if a specific PR calls for it.)

## Approving a PR (must be `boliwaladevs`, and must not be the PR's author)

```bash
gh auth switch --user boliwaladevs
gh pr review <pr-number> --repo boliwaladevs/boliwala --approve
```

Switch back to whichever account should do the merge afterward, e.g.:

```bash
gh auth switch --user nesora-ops
```

No bulk-approve exists in the GitHub UI — each PR needs its own
**Files changed → Review changes → Approve**, or the `gh pr review`
equivalent. Scriptable if several are open:

```bash
gh pr list --repo boliwaladevs/boliwala --json number --jq '.[].number' \
  | xargs -I{} gh pr review {} --approve --repo boliwaladevs/boliwala
```

## Syncing a stale feature branch with `main` — merge (house default)

```bash
git checkout <branch-name>
git fetch origin
git merge origin/main
git push
```

(Rebase is the alternative — `git rebase origin/main` then
`git push --force-with-lease` — but merge is the default here; only reach
for rebase deliberately, not as the default sync method.)

## Switching back to `main` locally

```bash
git checkout main
git pull origin main
```

A non-admin **can** `git commit` on `main` locally — that's purely local
and branch protection can't see it. What's blocked is `git push origin
main`. A local commit on `main` just has to move onto a branch and become a
PR like anything else — there's no shortcut around the push restriction.

## The recurring `gh` account-drift gotcha

`gh`'s active account silently reverts to whichever one was last used
system-wide (has drifted back to `hkforprojects` more than once this
project). **Always check before a push or a PR action that matters:**

```bash
gh auth status
```

and switch explicitly if it's not the account you meant:

```bash
gh auth switch --user <boliwaladevs|nesora-ops>
```

---

# Investigation log (background and rationale)

**Question asked:** you added a collaborator on GitHub. Can they push to
`main`? Given Vercel is on the Hobby plan, can they push to production?

**Checked against the actual repo, not general defaults** — findings below
are from `gh api` calls against `github.com/boliwaladevs/boliwala`, made
2026-08-04.

---

## 1. Can the collaborator push to `main`? — Yes, today they can.

```
$ gh api repos/boliwaladevs/boliwala/collaborators --jq '.[] | {login, permissions}'
{"login":"nesora-ops","permissions":{"admin":false,"maintain":false,"pull":true,"push":true,"triage":true}}
{"login":"boliwaladevs","permissions":{"admin":true,"maintain":true,"pull":true,"push":true,"triage":true}}

$ gh api repos/boliwaladevs/boliwala/branches/main/protection
{"message":"Branch not protected","status":404}
```

Two facts combine here:
- `nesora-ops` has the **Write** role (`push: true`) — write access lets
  someone push directly to any branch, same as an owner, *unless* something
  additionally restricts it.
- `main` has **no branch protection rule at all**. Nothing requires a pull
  request, a review, or a passing check before a push lands on `main`.

So right now, `nesora-ops` can push directly to `main` — including a force
push, since nothing prevents that either. GitHub's own explanation: *"Without
protection, any contributor with write access can push directly to main."*
([GitHub Docs — About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches))

**If you want to require pull requests instead:** add a branch protection
rule on `main` (Settings → Branches → Add rule) requiring a PR before
merging, with required approvals. This is free on GitHub for both public and
private repos — no plan upgrade needed. It's the standard fix and doesn't
touch Vercel at all.

---

## 2. Will their push deploy to Vercel production? — Yes, because this repo is public.

This is the part that doesn't work the way Hobby-plan docs make it sound at
first read, and it's worth being precise about, because the general rule and
your actual situation point in different directions.

**The general Hobby-plan rule** (from Vercel's own docs,
[Troubleshoot project collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)):

> "The Hobby Plan does not support collaboration for private repositories...
> To deploy commits under a Hobby team, the commit author must be the owner
> of the Hobby team containing the Vercel project connected to the Git
> repository."

Read alone, that sounds like: collaborator pushes → Vercel checks if the
commit author is you → it isn't → deployment blocked. That's the experience
a lot of people hit and post about (e.g. the [`vercel-hobby-collaboration-github-actions`](https://github.com/DaviZCodes/vercel-hobby-collaboration-github-actions)
workaround repo exists specifically for this).

**But that restriction is scoped to private repositories.** The same doc
page opens with:

> "💡 Note: Collaboration is free for public repositories."

`github.com/boliwaladevs/boliwala` is **public**
(`gh repo view boliwaladevs/boliwala --json isPrivate,visibility` →
`"isPrivate": false`). For a public repo, the commit-author-must-be-team-
owner check doesn't apply — Vercel treats it like an open-source repo, where
any push (from any contributor, even one with no Vercel account at all)
triggers a build. This is the same mechanism that lets Vercel build PRs from
random outside contributors on open-source projects.

**Net result:** `nesora-ops` pushing to `main` today will trigger a Vercel
deployment, and — assuming the project's Production Branch is still the
default (`main`), which wasn't independently re-verified here since no
Vercel CLI session was available this session (`vercel whoami` → no
credentials) — that deployment goes to **production**, not just a preview.
Worth a 30-second check in the Vercel dashboard (Project → Settings → Git →
Production Branch) to confirm it's still `main` before relying on this.

---

## 3. If you want to prevent that

Two independent levers, either one works, and they compose:

1. **GitHub branch protection on `main`** (recommended first move) —
   require a pull request before merging. This stops direct pushes
   regardless of what Vercel does, and it's free. `nesora-ops` would push to
   a feature branch (which still deploys as a Vercel **Preview**, harmless)
   and open a PR; merging the PR is still a push to `main` by whoever merges,
   so if you want *you* to be the only one who can actually land things on
   `main`, add "Restrict who can push to matching branches" to the rule as
   well, or require your own approval on every PR.
2. **Change the Vercel Production Branch** away from `main` (Project
   Settings → Git) — e.g. point Production at a `production` branch that
   only you merge into, while `main` stays the default integration branch.
   Pushes to `main` then only ever produce Preview deployments; nothing
   reaches production without a deliberate promotion.

Neither of these requires upgrading off the Hobby plan — the Hobby
restriction that actually costs money to lift is *inviting `nesora-ops` as a
member of your Vercel team* (Pro Plan, $20/mo/seat), which isn't needed here
since the repo being public already gives them working deployments without
that.

---

## 4. Follow-up: does switching the repo to private solve this instead? — No, and here's specifically why

The instinct is reasonable — private repo + Hobby's commit-author check
sounds like a built-in gate. It isn't one, and understanding why matters for
not relying on it:

**The check is per-push, not persistent.** Vercel evaluates the author of
the commit at the tip of whatever ref triggered the webhook. It does not
remember "this branch has an unreviewed commit on it" and keep refusing
forever. So the sequence is:

1. `nesora-ops` pushes commit `A` to `main` on a private repo → Vercel checks
   the author of `A`, it isn't you, deployment is skipped. GitHub `main` is
   now at `A`. Vercel production is still at whatever it built before.
2. You push commit `B` on top (or merge something) → Vercel checks the
   author of `B` (you) → **builds and deploys the current tip of `main`**,
   which is `B` sitting on top of `A`. The deploy ships `A`'s changes too —
   Vercel doesn't build a diff, it builds the full tree at that commit.

Net effect: `A` reaches production the moment you push anything afterward,
with **no review ever having happened** on `A`. The commit-author check
only ever controls *who is allowed to trigger the specific build event*, not
*what code eventually ships*. Treating it as a content gate is the mistake —
it delays by one push, it doesn't review.

This is exactly the Git/Vercel divergence scenario you asked about, and
going private *causes* it rather than preventing it. The branch-protection
approach in §3 doesn't have this failure mode, because there `main` never
advances at all without a merge you performed — there's no "skipped deploy
sitting on an advanced branch" state to drift out of sync in the first
place.

**Recommendation: keep the repo public, add branch protection on `main`.**
Concretely (personal GitHub accounts, like `boliwaladevs`, can't use the
"restrict push to specific people" rule — that's org-only — but don't need
it here):

```
gh api -X PUT repos/boliwaladevs/boliwala/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
EOF
```

- `enforce_admins: false` — you (repo admin) can still push directly to
  `main` if you want; `nesora-ops` (not an admin — confirmed `admin: false`
  in §1) is blocked from direct pushes regardless, by the required-PR rule
  itself, no separate restriction needed.
- `required_approving_review_count: 1` — a PR needs your sign-off before it
  can merge. Set to `0` instead if you just want the PR gate without
  mandatory review.
- His branch pushes still auto-deploy as Vercel **Previews** (public repo,
  non-production branch) — he gets a working preview URL for every push,
  harmless to production.
- Production only moves when you merge — merging *is* the push to `main`,
  so GitHub and Vercel never have room to disagree about what's "latest."

**Applied 2026-08-04.** Verified live:

```
$ gh api repos/boliwaladevs/boliwala/branches/main/protection --jq \
  '{enforce_admins: .enforce_admins.enabled, required_approvals: .required_pull_request_reviews.required_approving_review_count, allow_force_pushes: .allow_force_pushes.enabled}'
{"allow_force_pushes":false,"enforce_admins":false,"required_approvals":1}
```

`nesora-ops` can no longer push directly to `main` (must open a PR, needs
your approval to merge); direct force-pushes to `main` are also now blocked
for everyone, including `boliwaladevs`. Regular direct pushes from the admin
account are still allowed (`enforce_admins: false`).

---

## 5. Where to see the branch protection rule in the GitHub UI

`github.com/boliwaladevs/boliwala` → **Settings** → **Code and automation** →
**Branches** → the rule listed under "Branch protection rules" for `main` →
**Edit**. Requires being signed in as an admin of the repo (`boliwaladevs`,
or another admin) — the Settings tab doesn't appear otherwise.

**Re-checked 2026-08-08** (`gh api repos/boliwaladevs/boliwala/branches/main/protection`
and `gh api repos/boliwaladevs/boliwala/rulesets`) — still a classic branch
protection rule, no repo rulesets in use. Current state:

| Setting | State |
|---|---|
| Require a pull request before merging | ✅ on, 1 approving review |
| Dismiss stale approvals | ❌ off |
| Require code owner review | ❌ off |
| Require status checks | ❌ off |
| Require signed commits | ❌ off |
| Require linear history | ❌ off |
| Require conversation resolution | ❌ off |
| Allow force pushes | ❌ blocked |
| Allow deletions | ❌ blocked |
| Do not allow bypassing (include administrators) | ❌ off |

Since "include administrators" is off, `boliwaladevs` (admin) still bypasses
the PR requirement and can push straight to `main` — this is why the
Sprint 3 and Sprint 4 work landed on `main` via direct push, not a PR. The
rule as configured mainly stops force-push/deletion on `main` and makes the
PR+review path the only option for non-admin collaborators.

Collaborators, confirmed live the same day:

```
$ gh api repos/boliwaladevs/boliwala/collaborators --jq \
  '.[] | "\(.login)\t\(.role_name)\tadmin=\(.permissions.admin)\tpush=\(.permissions.push)"'
nesora-ops    write    admin=false    push=true
boliwaladevs  admin    admin=true     push=true
```

So `nesora-ops` is currently the only non-admin collaborator, and the only
one actually held to the PR/approval requirement.

---

## 6. Collaborator PR workflow — `nesora-ops` end to end

`nesora-ops` has push access to the repo itself (no fork needed), but not to
`main` directly — a direct push is rejected server-side:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
```

Working flow: branch → push → PR → **`boliwaladevs` approves** (the only
account that can, since a PR author can't approve their own PR, and
approvals require write access or higher) → `nesora-ops` merges once
approved.

```bash
git checkout -b <branch-name>
git push -u origin <branch-name>
gh pr create --base main --title "..." --body "..."
# after boliwaladevs approves in the GitHub UI:
gh pr merge --squash
```

Feature branches themselves are unprotected — force-push, rebase, delete
freely on those. Only `main` is covered by the rule.

`gh` uses whichever account is currently active as the git credential
helper for github.com — the push and the PR are attributed to whoever `gh
auth switch` last selected, not to whatever `git config user.email` says.
Both need to be set correctly before pushing as a specific person:

```bash
git config --local user.name "nesora-ops"
git config --local user.email "ops@nesora.co.in"
gh auth switch --user nesora-ops
```

`--local` (not `--global`) scopes the identity change to this repo only.

**Worked example, done 2026-08-08:** copied the previously-untracked
`plans/` folder into the repo (see gotcha in §1 of `MEMORY.md` about
`plans/` originally living outside the repo — this reverses that), committed
and pushed as `nesora-ops` to branch `feat_hriday`, opened a PR into `main`,
approved as `boliwaladevs` in the browser to see the flow work end to end.

---

## 7. Syncing a stale feature branch with an advanced `main`

If `main` has moved on since a feature branch was cut, two ways to bring the
branch up to date — **merge is the one we're using** (rebase is the
alternative, noted below for reference, not the house preference):

**Merge `main` into the feature branch (preferred):**

```bash
git checkout feat_hriday
git fetch origin
git merge origin/main
git push
```

No history rewrite, so no force-push needed — safe on a branch that's
already been pushed and might be shared. Adds a merge commit.

**Rebase instead (alternative, not preferred here):** rewrites the branch's
commits onto the tip of `main` (`git rebase origin/main`), giving linear
history but requiring `git push --force-with-lease` afterward since the
branch's history changed. `--force-with-lease` (never plain `--force`)
refuses the push if someone else has pushed to the same branch in the
meantime, so it won't silently clobber a collaborator's work.

---

## 8. Switching back to `main`, and can a collaborator commit to it locally?

```bash
git checkout main
git pull origin main   # picks up anything merged since, e.g. after a PR lands
```

**Can `nesora-ops` `git commit` to `main` locally?** Yes — `git commit` is
purely local; branch protection is a GitHub server-side rule on `git push`,
it has no visibility into local commits. They can check out `main` and
commit on it all they like on their own machine.

What's blocked is `git push origin main` — same `GH006` rejection as
before, since only `boliwaladevs` (admin) bypasses the rule. In practice a
local commit on `main` just sits there unpushed until it's moved onto a
branch and opened as a PR — same flow as §6.

---

## 9. Approving and merging a PR via `gh` (as opposed to the browser)

Same PR as §6's worked example — `feat_hriday` → `main`, opened by
`nesora-ops`. GitHub blocks a PR author from approving their own PR, no
matter which local account runs the command, so the approval has to come
from `boliwaladevs` and the merge from whoever has write access once that
approval exists (`nesora-ops` qualifies).

```bash
# 1. Approve as boliwaladevs (must not be the PR author)
gh auth switch --user boliwaladevs
gh pr review 1 --repo boliwaladevs/boliwala --approve

# 2. Switch back
gh auth switch --user nesora-ops

# 3. "Push to main" happens via merging the PR, not a direct git push —
#    a bare `git push origin main` is still blocked even after approval.
gh pr merge 1 --repo boliwaladevs/boliwala --squash
```

`--squash` can be swapped for `--merge` (keeps the commit as-is, adds a merge
commit) or `--rebase` (linear history, no merge commit) — all three are
enabled on this repo (`allow_squash`/`allow_merge`/`allow_rebase`, checked
§1). `gh pr merge` succeeds here specifically because the review requirement
is now satisfied; before approval it would fail the same way a direct push
does.

**Bulk-approving multiple open PRs at once:** no such button in the GitHub
UI — each PR needs its own **Files changed → Review changes → Approve** (or
the `gh pr review <n> --approve` equivalent). Scriptable if several are open
at once:

```bash
gh pr list --repo boliwaladevs/boliwala --json number --jq '.[].number' \
  | xargs -I{} gh pr review {} --approve --repo boliwaladevs/boliwala
```

**Removing the approval requirement entirely** (not done — just the option,
if the one-approver bottleneck becomes a problem) is a branch-protection
change, not a per-PR action: drop `required_approving_review_count` to `0`
in Settings → Branches → the rule for `main`. Keeps the PR-before-merge
structure and the force-push/deletion protection, just removes the mandatory
sign-off — the same tradeoff noted in §5.

---

## Sources

- [Vercel Docs — Troubleshoot project collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)
- [GitHub Docs — About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs — Permission levels for a personal account repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository)
- `gh api repos/boliwaladevs/boliwala/collaborators` and
  `gh api repos/boliwaladevs/boliwala/branches/main/protection` — run
  directly against your repo, 2026-08-04
