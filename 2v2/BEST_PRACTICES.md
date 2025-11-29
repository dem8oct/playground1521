# Best Practices: Working with Claude Code

**Project:** 2v2 Kick Off Night
**Purpose:** Guidelines for effective collaboration with Claude on this project

---

## 📝 Documentation Strategy

### 1. Separate Files by Purpose

✅ **Good** (our current structure):
```
FUTURE_IDEAS.md          - Brainstorming and proposals
UX_IMPROVEMENTS.md       - Completed UX changes
BUGFIXES.md              - Bug tracking and fixes
PROJECT_STATUS.md        - Current state overview
PHASE5_IMPROVEMENTS.md   - Specific phase documentation
BEST_PRACTICES.md        - This file
```

❌ **Avoid**: One giant file with everything mixed together

**Why this works:**
- Easy to find specific information
- Each file has a clear purpose
- Can reference specific docs in conversation
- Prevents documentation from becoming overwhelming

---

### 2. Clear Naming Conventions

Use prefixes to indicate document type:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `FUTURE_*` | Ideas not yet implemented | `FUTURE_IDEAS.md` |
| `*_STATUS` | Current state snapshots | `PROJECT_STATUS.md` |
| `*_IMPROVEMENTS` | Completed enhancements | `UX_IMPROVEMENTS.md` |
| No prefix | Guides and references | `TROUBLESHOOTING.md`, `SETUP.md` |

---

### 3. Structure for Ideas and Proposals

When documenting new ideas, always include:

```markdown
## Feature Name

**Status:** 💭 Proposed | 🚧 In Progress | ✅ Complete
**Priority:** High | Medium | Low
**Effort:** ~X hours

### Current State
(What exists now)

### Problem
(Why we need this)

### Proposed Solutions

#### Option A: Name ⭐ RECOMMENDED
**How it works:** ...
**Pros:** ...
**Cons:** ...
**Implementation:** ...

#### Option B: Name
(same structure)

### Decision Matrix
(comparison table)

### Recommendation
(final call with reasoning)
```

**Benefits:**
- Clear prioritization
- Time estimation
- Multiple options evaluated
- Easy to implement later

---

## 🔄 Version Control Workflow

### Commit Frequently with Clear Messages

✅ **Good commit messages:**
```bash
"Add user authentication to session management"
"Fix leaderboard sorting by points"
"Document dashboard tabs proposal in FUTURE_IDEAS.md"
"Implement Phase 6: Leaderboards and Stats Calculation"
```

❌ **Avoid vague messages:**
```bash
"updates"
"fix stuff"
"wip"
"changes"
```

### When to Commit Documentation

- ✅ After completing a feature → update `PROJECT_STATUS.md`
- ✅ After brainstorming session → save to `FUTURE_IDEAS.md`
- ✅ After fixing bugs → log in `BUGFIXES.md`
- ✅ When UX changes are made → document in `UX_IMPROVEMENTS.md`
- ✅ After making decisions → mark in relevant docs

### Commit Strategy

**During active development:**
```bash
# Commit code and docs together
git add src/components/Feature.tsx
git add FEATURE_DOCS.md
git commit -m "Add feature X with documentation"
```

**Incremental commits > giant commits:**
- Commit after each logical unit of work
- Don't wait until end of session
- Easier to review and rollback if needed

---

## 💬 Working Session Flow

### At Start of Session

**You say:**
```
"What did we last work on?"
"Continue where we left off"
"Show me project status"
```

**I do:**
- Read `PROJECT_STATUS.md` and recent commits
- Summarize completed work
- Identify next steps
- Check for any incomplete tasks

### During Work

**Active task tracking:**
- Use `TodoWrite` tool for multi-step tasks
- Mark tasks as `in_progress` when starting
- Mark as `completed` immediately when done
- Don't batch completions

**Documentation as we go:**
- I document decisions in real-time
- Commit incrementally
- Update relevant docs

### End of Session

**You say:**
```
"Summarize what we did and update docs"
"Commit and push everything"
```

**I do:**
1. Update `PROJECT_STATUS.md` with progress
2. Add entries to relevant improvement logs
3. Commit all changes with descriptive messages
4. Push to remote repository
5. Provide summary of what was accomplished

---

## 💡 Idea Management Workflow

### Capturing New Ideas

**When you have an idea:**

1. **Quick capture**
   ```
   You: "I have an idea for dashboard tabs"
   Me: "Tell me about it"
   ```

2. **I document it** in `FUTURE_IDEAS.md` with:
   - Multiple options/approaches
   - Pros/cons analysis
   - Effort estimates
   - Implementation notes

3. **You decide**:
   - Pick an option now
   - Defer for later
   - Request more research

4. **If implementing now**:
   - Create TodoWrite plan
   - Start implementation
   - Update docs when complete

5. **When done**:
   - Move from `FUTURE_IDEAS.md` to `*_IMPROVEMENTS.md`
   - Mark as ✅ Complete
   - Update `PROJECT_STATUS.md`

---

## 🔍 Referencing Past Work

### Efficient Context Retrieval

**Instead of re-explaining:**
```
You: "Remember that co-logger restriction we added?"

Me: *Searches UX_IMPROVEMENTS.md*
    "Yes! SessionLobby.tsx:218 - only players with
     profile_id can be co-loggers. Added on 2025-11-28."
```

**Benefits:**
- I quickly find exact context
- You don't waste time explaining
- Accurate file/line references
- Consistent understanding

### What Gets Documented Where

| Type of Information | Document |
|---------------------|----------|
| Future feature ideas | `FUTURE_IDEAS.md` |
| Completed UX changes | `UX_IMPROVEMENTS.md` |
| Bug fixes and lessons | `BUGFIXES.md` |
| Overall project state | `PROJECT_STATUS.md` |
| Implementation details | Phase-specific docs |
| Setup instructions | `SETUP.md` |
| Common issues | `TROUBLESHOOTING.md` |

---

## 📊 Multi-Session Projects

### Maintaining Continuity

**Day 1 - Start:**
- Create or update `PROJECT_STATUS.md` with phases
- Mark current phase as "in progress"
- Document what's complete vs. pending
- Commit when pausing work

**Day 2 - Resume:**
```
You: "Continue where we left off"

Me: *Reads PROJECT_STATUS.md*
    "We completed Phase 5 (Match Logging),
     now starting Phase 6 (Leaderboards).
     Should I begin with player stats?"
```

**Benefits:**
- Zero time wasted catching up
- Seamless continuation across sessions
- Clear progress tracking
- No loss of context

### Long-Term Project Memory

Claude Code maintains context through:
- ✅ Documentation files (primary)
- ✅ Git commit history (secondary)
- ✅ Code itself (when well-structured)

**NOT through:**
- ❌ Previous conversation memory (sessions are stateless)
- ❌ Verbal explanations (document instead)

**Therefore:** Document everything important!

---

## 🎯 Decision Documentation

### Recording Architectural Decisions

**When we discuss options:**

```markdown
## Feature Name: Dashboard Layout

**Date:** 2025-11-28
**Decision Maker:** User
**Context:** Needed better organization of dashboard sections

### Options Considered:
- Option A: Tabbed navigation ⭐
- Option B: Accordion sections
- Option C: Scrolling with quick nav

### Decision: **Option A - Tabs**

**Rationale:**
- Best mobile UX
- Standard pattern users understand
- Reduces visual clutter

**Implementation:** See FUTURE_IDEAS.md for details

**Status:** 💭 Approved, not yet implemented
```

**Benefits:**
- Clear paper trail
- Can revisit reasoning later
- Team members understand "why"
- Easy to reference when implementing

---

## 📋 What to Document

### Always Document

✅ **Architecture decisions**
- Why we chose X over Y
- Trade-offs considered
- Long-term implications

✅ **Bug fixes**
- What broke
- Root cause
- How we fixed it
- How to prevent recurrence

✅ **UX improvements**
- Before state
- After state
- User impact
- Implementation details

✅ **Future ideas**
- Even half-baked ideas
- "Wouldn't it be cool if..."
- Deferred features

✅ **Phase completion**
- What was built
- What's pending
- Known issues

### Don't Need to Document

❌ **Obvious code comments**
- Code should be self-documenting
- Use clear variable/function names instead

❌ **Temporary experiments**
- Quick tests
- Throwaway code

❌ **Every tiny tweak**
- Minor CSS adjustments
- Typo fixes (unless they caused issues)

---

## 🤖 Using Documentation to Guide Claude

### Directive-Based Implementation

**You can say:**
```
"Claude, read FUTURE_IDEAS.md and implement the
 Dashboard Tabs feature using Option A"
```

**I will:**
1. Read the full proposal from docs
2. Follow the implementation notes exactly
3. Create the feature as documented
4. Update status when done
5. Mark as ✅ Complete

**This works because:**
- Documentation serves as specification
- Clear, unambiguous requirements
- No need to re-explain
- Consistent implementation

### Documentation as Project Memory

Think of docs as:
- 🧠 **Project brain** - stores all knowledge
- 📖 **Instruction manual** - guides implementation
- 🗺️ **Roadmap** - shows what's next
- 🔍 **Search index** - quick reference

---

## ✨ Advanced Tips

### 1. Use Markdown Headers for Navigation

Structure docs with clear hierarchy:
```markdown
# Main Topic
## Subtopic
### Detail Level
```

I can quickly jump to sections when you reference them.

### 2. Link Between Documents

```markdown
See [Dashboard Tabs Proposal](FUTURE_IDEAS.md#dashboard-tabs)
```

Creates connected knowledge base.

### 3. Update Dates on Changes

```markdown
**Last Updated:** 2025-11-28
```

Shows document freshness.

### 4. Status Emojis for Quick Scanning

```markdown
💭 Proposed
🚧 In Progress
✅ Complete
🔴 Blocked
⏸️ Paused
```

Visual status at a glance.

### 5. Code Snippets in Docs

Include actual code examples:
```tsx
// Good example
<Button onClick={handleClick}>
  Click Me
</Button>
```

Makes implementation faster and more accurate.

---

## 🎯 Quick Reference

### File Organization Checklist

- [ ] Each doc has a clear purpose
- [ ] File names are descriptive
- [ ] Status/priority included in proposals
- [ ] Decisions are marked clearly
- [ ] Dates are included
- [ ] Code examples provided where helpful

### Session Workflow Checklist

**Start:**
- [ ] Ask Claude for status summary
- [ ] Review PROJECT_STATUS.md
- [ ] Decide on today's goal

**During:**
- [ ] Use TodoWrite for complex tasks
- [ ] Commit incrementally
- [ ] Document decisions as made

**End:**
- [ ] Update PROJECT_STATUS.md
- [ ] Commit all changes
- [ ] Push to remote
- [ ] Get summary from Claude

### Communication Tips

✅ **Effective:**
- "Implement dashboard tabs from FUTURE_IDEAS.md"
- "Continue where we left off"
- "Fix the leaderboard sorting bug"

❌ **Less effective:**
- "Do that thing we talked about"
- "Fix the bug" (which one?)
- "Make it better" (how?)

---

## 🚀 Project-Specific Conventions

### For This Project (2v2 Kick Off Night)

**Branch naming:**
- `feature/*` for new features
- `bugfix/*` for bug fixes
- Main branch: `main`

**Commit format:**
```
Short descriptive title (50 chars max)

- Bullet point details
- What changed and why
- File references if helpful

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Phase structure:**
- Phase 1-4: Foundation ✅
- Phase 5: Match Logging ✅
- Phase 6: Leaderboards ✅
- Phase 7: Real-time (optional)

---

## 📚 Summary

**Core Principles:**

1. **Document Everything Important** - Docs are project memory
2. **Commit Often** - Small, logical commits
3. **Clear Naming** - Files and commits should be self-explanatory
4. **Structure Ideas** - Status, priority, options, decision
5. **Use TodoWrite** - Track multi-step work
6. **Reference Docs** - Guide Claude with existing documentation
7. **Update PROJECT_STATUS** - Keep central hub current

**Why This Matters:**

- 🧠 **Continuity** across sessions
- ⚡ **Efficiency** through context
- 📈 **Scalability** as project grows
- 🤝 **Collaboration** with team members
- 🔍 **Searchability** of decisions and implementations

---

**Remember:** Good documentation saves time, reduces confusion, and makes collaboration with Claude significantly more effective!

---

**Last Updated:** 2025-11-29
**Maintained By:** Claude (Sonnet 4.5) & User
