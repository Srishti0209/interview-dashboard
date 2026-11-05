# Question bank content

Role-specific questions are written as Markdown in `src/<role>/*.md` (one
file per interview round) so they are easy to review and edit in git.

    node scripts/content/build-questions.mjs   # src/*.md → questions/<role>.json
    node scripts/content/load-seed.mjs         # loads seed + questions/*.json into Supabase

## Format

Each question starts with `## <title>`, followed by metadata lines, then a
`### Prompt` and an `### Answer` section. Use `####` (or smaller) headings
inside answers.

    ## How would you improve our onboarding flow?
    - id: po-product-sense-01          (stable, never change it: answers link to it)
    - round: PRODUCT_SENSE
    - difficulty: medium               (easy | medium | hard)
    - levels: mid, senior              (empty = all levels)
    - tags: onboarding, activation
    - companies:                       (optional, comma-separated)

    ### Prompt
    The question as the interviewer asks it…

    ### Answer
    #### Key points
    …
