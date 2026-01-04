# Claude-Specific Instructions

This file contains Claude-specific prompting techniques for the Tabby Chrome extension project. For general project instructions, see [.github/copilot-instructions.md](.github/copilot-instructions.md) and the files in [.github/instructions/](.github/instructions/).

## Core Claude Behaviors

### Be Explicit and Precise

Claude 4.x models respond well to clear, explicit instructions. Be specific about desired outputs and behaviors.

**Instead of:** "Improve this component"  
**Try:** "Refactor this component to use React hooks, maintain existing functionality, and add TypeScript types for all props"

### Default to Action

```xml
<default_to_action>
By default, implement changes rather than only suggesting them. If the user's intent is unclear, infer the most useful likely action and proceed, using tools to discover any missing details instead of guessing.
</default_to_action>
```

### Communication Style

Claude 4.5 models are naturally:

- **More concise**: Skip verbose summaries unless requested
- **More direct**: Provide fact-based updates rather than self-celebratory commentary
- **More conversational**: Less machine-like, more natural

If you want more visibility into reasoning, request it: "After completing tool use, provide a brief summary of what you did."

## Tool Usage Optimization

### Parallel Tool Calls

```xml
<use_parallel_tool_calls>
If you intend to call multiple tools and there are no dependencies between the tool calls, make all of the independent tool calls in parallel. For example, when reading 3 files, run 3 tool calls in parallel to read all 3 files at once. However, if some tool calls depend on previous calls, do NOT call these tools in parallel. Never use placeholders or guess missing parameters.
</use_parallel_tool_calls>
```

### Reading Files Efficiently

- Read multiple independent files in parallel
- Read large sections rather than many small reads
- Use grep_search for file overviews before detailed reads
- Semantic search first for discovering relevant code

### After Tool Results

After receiving tool results, reflect on their quality and determine optimal next steps before proceeding. Use thinking to plan and iterate based on new information, then take the best action.

## Long-Horizon Tasks

### Context Awareness

This environment may compact context as it approaches limits. Save progress to files before context refreshes. Be persistent and complete tasks fully, even if approaching context limits. Never artificially stop tasks early.

### State Management

- Use structured formats (JSON) for state data like test results or task status
- Use unstructured text for progress notes
- Use git for state tracking across sessions
- Focus on incremental progress—make steady advances on a few things at a time

### Multi-Window Workflows

For tasks spanning multiple context windows:

1. **First window**: Set up framework (write tests, create setup scripts)
2. **Future windows**: Iterate on todo-list
3. **Create tests first**: Write tests in structured format (e.g., `tests.json`) before starting work
4. **Setup scripts**: Create `init.sh` or similar to gracefully start servers, run tests, prevent repeated work
5. **Starting fresh**: When context clears, review `progress.txt`, `tests.json`, and git logs before continuing

## Code Quality Principles

### Avoid Overengineering

```xml
<avoid_overengineering>
Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused.

Don't add features, refactor code, or make "improvements" beyond what was asked. Don't add error handling, fallbacks, or validation for scenarios that can't happen. Don't create helpers, utilities, or abstractions for one-time operations. Don't design for hypothetical future requirements.

The right amount of complexity is the minimum needed for the current task.
</avoid_overengineering>
```

### Investigate Before Answering

```xml
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer - give grounded and hallucination-free answers.
</investigate_before_answering>
```

### Code Exploration

ALWAYS read and understand relevant files before proposing code edits. Do not speculate about code you haven't inspected. If the user references a specific file/path, you MUST open and inspect it before explaining or proposing fixes. Be rigorous and persistent in searching code for key facts.

### General Solutions Over Test Passing

Write high-quality, general-purpose solutions using standard tools available. Do not create helper scripts or workarounds. Implement solutions that work correctly for all valid inputs, not just test cases. Do not hard-code values or create solutions that only work for specific test inputs.

## Output Formatting

### Avoid Excessive Markdown

````xml
<avoid_excessive_markdown_and_bullet_points>
When writing reports, documents, technical explanations, analyses, or any long-form content, write in clear, flowing prose using complete paragraphs and sentences. Use standard paragraph breaks for organization and reserve markdown primarily for `inline code`, code blocks (```...```), and simple headings (### and ####). Avoid using **bold** and *italics*.

DO NOT use ordered lists (1. ...) or unordered lists (*) unless: a) you're presenting truly discrete items where a list format is the best option, or b) the user explicitly requests a list or ranking.

Your goal is readable, flowing text that guides the reader naturally through ideas rather than fragmenting information into isolated points.
</avoid_excessive_markdown_and_bullet_points>
````

### File References

Always use markdown links for file references (never backticks):

- File: [package.json](package.json)
- Line: [package.json](package.json#L10)
- Heading: [Release Instructions](RELEASE.md#tips)

## Research and Complex Tasks

### Structured Research

For complex research tasks:

```
Search for this information in a structured way. As you gather data, develop several competing hypotheses. Track your confidence levels in progress notes. Regularly self-critique your approach and plan. Update a hypothesis tree or research notes file to persist information and provide transparency. Break down this complex research task systematically.
```

### Task Persistence

This is a very long task, so plan your work clearly. It's encouraged to spend your entire output context working on the task—just make sure you don't run out of context with significant uncommitted work. Continue working systematically until you have completed this task.

## File Management

### Minimize Temporary Files

If you create any temporary new files, scripts, or helper files for iteration, clean up these files by removing them at the end of the task.

### Essential Files Only

Create files only when essential to completing the user's request. Don't create summary markdown files after edits unless specifically requested.

## Thinking Capabilities

### When to Use Thinking

Use thinking/reflection for:

- Tasks involving reflection after tool use
- Complex multi-step reasoning
- Planning optimal next steps after receiving tool results

### Thinking Sensitivity

When extended thinking is disabled, Claude Opus 4.5 is sensitive to the word "think" and its variants. Use alternative words: "consider," "believe," "evaluate."

## Project-Specific Reminders

- Glob patterns in instruction files are repository-root-relative
- This is a Chrome extension—changes may require extension reload
- Uses React 19, TypeScript 5.x, Vite, pnpm workspaces, Turborepo
- Read [commands.instructions.md](.github/instructions/commands.instructions.md) before running commands
- Frontmatter in .instructions.md files determines when they apply
