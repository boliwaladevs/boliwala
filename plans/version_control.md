# Version control & deployment permissions — collaborator on `main`

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

## Sources

- [Vercel Docs — Troubleshoot project collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)
- [GitHub Docs — About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs — Permission levels for a personal account repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository)
- `gh api repos/boliwaladevs/boliwala/collaborators` and
  `gh api repos/boliwaladevs/boliwala/branches/main/protection` — run
  directly against your repo, 2026-08-04
